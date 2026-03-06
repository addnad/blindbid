import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import Bento from "@/components/Bento";
import Stats from "@/components/Stats";
import Comparison from "@/components/Comparison";
import Footer from "@/components/Footer";

export const metadata = { title: "Features — BLINDBID" };

export default function FeaturesPage() {
  return (
    <main className="flex flex-col w-full bg-[#0A0A0A] pt-[60px]">
      <Navbar />
      <Features />
      <Stats />
      <Bento />
      <Comparison />
      <Footer />
    </main>
  );
}
