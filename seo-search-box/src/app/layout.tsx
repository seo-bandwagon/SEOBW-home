import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { auth } from "@/lib/auth";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "SEO Bandwagon - SEO Services That Actually Work | Seattle",
  description: "Free SEO audit, rank tracking, and local SEO tools. No corporate nonsense, just results. Built in Seattle since 2010.",
  keywords: "SEO, local SEO, SEO services, free SEO audit, rank tracker, Seattle SEO",
  openGraph: {
    title: "SEO Bandwagon - SEO Services That Actually Work",
    description: "Free SEO audit, rank tracking, and local SEO tools. No corporate nonsense, just results.",
    type: "website",
    url: "https://seobandwagon.dev/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${spaceMono.variable} font-body`}>
        <SessionProviderWrapper session={session}>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
