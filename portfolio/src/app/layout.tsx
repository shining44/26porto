import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ali Tayyebi — Design Lead Manager",
  description: "Director of AI-Driven Product Design at Meta Superintelligence Labs. Leading a cross-functional design team innovating LLM-driven enterprise and consumer products.",
  keywords: ["AI design", "product design", "LLM", "Meta", "design leadership", "enterprise design"],
  authors: [{ name: "Ali Tayyebi" }],
  openGraph: {
    title: "Ali Tayyebi — Design Lead Manager",
    description: "Director of AI-Driven Product Design at Meta Superintelligence Labs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
