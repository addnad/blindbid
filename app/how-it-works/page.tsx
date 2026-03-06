import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export const metadata = { title: "How It Works — BLINDBID" };

export default function HowItWorksPage() {
  return (
    <main className="flex flex-col w-full bg-[#0A0A0A] pt-[60px]">
      <Navbar />
      <HowItWorks />
      <Footer />
    </main>
  );
}
