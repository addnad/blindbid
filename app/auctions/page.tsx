import Navbar from "@/components/Navbar";
import Showcase from "@/components/Showcase";
import Footer from "@/components/Footer";

export const metadata = { title: "Auctions — BLINDBID" };

export default function AuctionsPage() {
  return (
    <main className="flex flex-col w-full bg-[#0A0A0A] pt-[60px]">
      <Navbar />
      <Showcase />
      <Footer />
    </main>
  );
}
