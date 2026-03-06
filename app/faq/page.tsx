import Navbar from "@/components/Navbar";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export const metadata = { title: "FAQ — BLINDBID" };

export default function FAQPage() {
  return (
    <main className="flex flex-col w-full bg-[#0A0A0A] pt-[60px]">
      <Navbar />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
