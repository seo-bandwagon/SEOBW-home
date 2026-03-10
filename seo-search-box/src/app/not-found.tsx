import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy">
      <Navbar />
      <div className="flex items-center justify-center text-center p-10" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div>
        <h1 className="font-heading text-[clamp(6rem,20vw,15rem)] text-pink tracking-[10px] leading-none">
          404
        </h1>
        <p className="text-2xl my-[30px] text-[#F5F5F5]/80">
          This page doesn&apos;t exist. Maybe it never did.
        </p>
        <Link
          href="/"
          className="inline-block font-heading text-2xl bg-pink text-[#F5F5F5] py-[18px] px-[45px] no-underline tracking-[2px] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(245,55,150,0.5)]"
        >
          BACK TO HOME
        </Link>
      </div>
      </div>
    </div>
  );
}
