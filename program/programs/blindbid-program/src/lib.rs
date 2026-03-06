use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod blindbid_program {
    use super::*;

    // Create a new sealed-bid auction
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        auction_id: String,
        name: String,
        floor_lamports: u64,
        ends_at: i64,
        auction_type: u8, // 0=Vickrey, 1=Uniform, 2=FirstPrice
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock = Clock::get()?;

        require!(ends_at > clock.unix_timestamp, BlindBidError::InvalidEndTime);
        require!(floor_lamports > 0, BlindBidError::InvalidFloor);
        require!(auction_id.len() <= 16, BlindBidError::StringTooLong);
        require!(name.len() <= 64, BlindBidError::StringTooLong);

        auction.creator       = ctx.accounts.creator.key();
        auction.auction_id    = auction_id;
        auction.name          = name;
        auction.floor_lamports = floor_lamports;
        auction.ends_at       = ends_at;
        auction.auction_type  = auction_type;
        auction.bid_count     = 0;
        auction.settled       = false;
        auction.created_at    = clock.unix_timestamp;
        auction.bump          = ctx.bumps.auction;

        emit!(AuctionCreated {
            creator:    ctx.accounts.creator.key(),
            auction_id: auction.auction_id.clone(),
            ends_at,
        });

        Ok(())
    }

    // Place an encrypted sealed bid
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        commitment: String,      // SHA-256 hash of bid amount
        client_pubkey: String,   // Arcium x25519 ephemeral pubkey
        computation_offset: String, // Arcium computation ID
        amount_lamports: u64,    // Actual bid amount in lamports
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock   = Clock::get()?;

        require!(!auction.settled, BlindBidError::AuctionSettled);
        require!(clock.unix_timestamp < auction.ends_at, BlindBidError::AuctionEnded);
        require!(amount_lamports >= auction.floor_lamports, BlindBidError::BelowFloor);
        require!(commitment.len() <= 64, BlindBidError::StringTooLong);

        // Transfer bid SOL to escrow PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.bidder.to_account_info(),
                to:   ctx.accounts.escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount_lamports)?;

        // Store bid record
        let bid = &mut ctx.accounts.bid;
        bid.auction    = auction.key();
        bid.bidder     = ctx.accounts.bidder.key();
        bid.commitment = commitment.clone();
        bid.client_pubkey       = client_pubkey;
        bid.computation_offset  = computation_offset;
        bid.amount_lamports     = amount_lamports;
        bid.placed_at           = clock.unix_timestamp;
        bid.refunded            = false;
        bid.bump                = ctx.bumps.bid;

        auction.bid_count += 1;

        emit!(BidPlaced {
            auction: auction.key(),
            bidder:  ctx.accounts.bidder.key(),
            commitment,
        });

        Ok(())
    }

    // Settle auction — refund all losers, pay winner
    // In production Arcium MPC reveals the winner; here creator submits winner
    pub fn settle(
        ctx: Context<Settle>,
        winner: Pubkey,
        winning_amount: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock   = Clock::get()?;

        require!(!auction.settled, BlindBidError::AuctionSettled);
        require!(clock.unix_timestamp >= auction.ends_at, BlindBidError::AuctionNotEnded);
        require!(
            ctx.accounts.creator.key() == auction.creator,
            BlindBidError::Unauthorized
        );

        auction.settled = true;
        auction.winner  = Some(winner);

        emit!(AuctionSettled {
            auction: auction.key(),
            winner,
            winning_amount,
        });

        Ok(())
    }

    // Refund a single losing bid from escrow
    pub fn refund_bid(ctx: Context<RefundBid>) -> Result<()> {
        let bid     = &mut ctx.accounts.bid;
        let auction = &ctx.accounts.auction;

        require!(auction.settled, BlindBidError::AuctionNotSettled);
        require!(!bid.refunded, BlindBidError::AlreadyRefunded);

        // Only refund if not the winner
        if let Some(winner) = auction.winner {
            require!(bid.bidder != winner, BlindBidError::WinnerCannotRefund);
        }

        bid.refunded = true;

        let amount = bid.amount_lamports;
        let escrow = &mut ctx.accounts.escrow;
        let bidder = &ctx.accounts.bidder;

        // Transfer from escrow PDA back to bidder
        **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        **bidder.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(BidRefunded {
            auction: auction.key(),
            bidder:  bid.bidder,
            amount,
        });

        Ok(())
    }
}

// ── Account structs ──────────────────────────────────────────────────────

#[account]
pub struct AuctionAccount {
    pub creator:         Pubkey,   // 32
    pub auction_id:      String,   // 4 + 16
    pub name:            String,   // 4 + 64
    pub floor_lamports:  u64,      // 8
    pub ends_at:         i64,      // 8
    pub auction_type:    u8,       // 1
    pub bid_count:       u32,      // 4
    pub settled:         bool,     // 1
    pub winner:          Option<Pubkey>, // 33
    pub created_at:      i64,      // 8
    pub bump:            u8,       // 1
}

#[account]
pub struct BidAccount {
    pub auction:              Pubkey,  // 32
    pub bidder:               Pubkey,  // 32
    pub commitment:           String,  // 4 + 64
    pub client_pubkey:        String,  // 4 + 64
    pub computation_offset:   String,  // 4 + 16
    pub amount_lamports:      u64,     // 8
    pub placed_at:            i64,     // 8
    pub refunded:             bool,    // 1
    pub bump:                 u8,      // 1
}

// ── Contexts ─────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct CreateAuction<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + 32 + (4+16) + (4+64) + 8 + 8 + 1 + 4 + 1 + 33 + 8 + 1,
        seeds = [b"auction", creator.key().as_ref(), auction_id.as_bytes()],
        bump
    )]
    pub auction: Account<'info, AuctionAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,

    #[account(
        init,
        payer = bidder,
        space = 8 + 32 + 32 + (4+64) + (4+64) + (4+16) + 8 + 8 + 1 + 1,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, BidAccount>,

    /// CHECK: PDA escrow holding bid SOL
    #[account(
        mut,
        seeds = [b"escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut, has_one = creator)]
    pub auction: Account<'info, AuctionAccount>,
}

#[derive(Accounts)]
pub struct RefundBid<'info> {
    /// CHECK: bidder receiving refund
    #[account(mut)]
    pub bidder: UncheckedAccount<'info>,

    #[account(mut, has_one = bidder)]
    pub bid: Account<'info, BidAccount>,

    pub auction: Account<'info, AuctionAccount>,

    /// CHECK: PDA escrow
    #[account(
        mut,
        seeds = [b"escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,
}

// ── Errors ───────────────────────────────────────────────────────────────

#[error_code]
pub enum BlindBidError {
    #[msg("Auction has already been settled")]
    AuctionSettled,
    #[msg("Auction has not ended yet")]
    AuctionNotEnded,
    #[msg("Auction has already ended")]
    AuctionEnded,
    #[msg("Auction is not yet settled")]
    AuctionNotSettled,
    #[msg("Bid is below the floor price")]
    BelowFloor,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Invalid floor price")]
    InvalidFloor,
    #[msg("String too long")]
    StringTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Winner cannot claim refund")]
    WinnerCannotRefund,
}

// ── Events ───────────────────────────────────────────────────────────────

#[event]
pub struct AuctionCreated {
    pub creator:    Pubkey,
    pub auction_id: String,
    pub ends_at:    i64,
}

#[event]
pub struct BidPlaced {
    pub auction:    Pubkey,
    pub bidder:     Pubkey,
    pub commitment: String,
}

#[event]
pub struct AuctionSettled {
    pub auction:        Pubkey,
    pub winner:         Pubkey,
    pub winning_amount: u64,
}

#[event]
pub struct BidRefunded {
    pub auction: Pubkey,
    pub bidder:  Pubkey,
    pub amount:  u64,
}
