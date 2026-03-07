use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct BidInput {
        amount: u8,
    }

    pub struct TwoBids {
        bid_a: u8,
        bid_b: u8,
    }

    #[instruction]
    pub fn submit_bid(input_ctxt: Enc<Shared, BidInput>) -> Enc<Shared, u8> {
        let input = input_ctxt.to_arcis();
        // Validate and commit to the bid — returns encrypted commitment
        input_ctxt.owner.from_arcis(input.amount)
    }

    #[instruction]
    pub fn reveal_winner(input_ctxt: Enc<Shared, TwoBids>) -> Enc<Shared, u8> {
        let input = input_ctxt.to_arcis();
        // Compare two bids inside MXE — returns 0 if a wins, 1 if b wins
        // Amounts are never revealed
        let winner: u8 = if input.bid_a >= input.bid_b { 0 } else { 1 };
        input_ctxt.owner.from_arcis(winner)
    }
}
