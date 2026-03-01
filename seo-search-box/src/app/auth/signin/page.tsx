"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { Navbar } from "@/components/common/Navbar";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink/20 border-2 border-pink mb-4">
            <Search className="h-8 w-8 text-pink" />
          </div>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">Sign in to SEO Bandwagon</h1>
          <p className="text-[#F5F5F5]/50 mt-2">
            Access your saved searches and track changes over time
          </p>
        </div>

        {/* Auth Options */}
        <div className="bg-[#F5F5F5]/5 border-2 border-pink/30 rounded-xl p-6 space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-[#000022] font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <p className="text-sm text-[#F5F5F5]/40 text-center mb-4">
            Why create an account?
          </p>
          <Benefit text="Save and bookmark your searches" />
          <Benefit text="Track keyword and domain changes over time" />
          <Benefit text="Set up alerts for ranking changes" />
          <Benefit text="Access your data from any device" />
        </div>

        {/* Terms */}
        <p className="text-xs text-[#F5F5F5]/30 text-center mt-8">
          By signing in, you agree to our{" "}
          <a href="/terms" className="text-pink hover:text-pink/80">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-pink hover:text-pink/80">
            Privacy Policy
          </a>
        </p>
      </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000022] flex items-center justify-center">
        <div className="text-[#F5F5F5]/40">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#F5F5F5]/50">
      <svg
        className="w-4 h-4 text-green-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      {text}
    </div>
  );
}
