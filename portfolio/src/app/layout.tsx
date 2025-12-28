import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ali Tayyebi",
  description: "Design Lead Manager at Meta Superintelligence Labs. Building AI-powered interfaces for billions of users.",
  authors: [{ name: "Ali Tayyebi" }],
  openGraph: {
    title: "Ali Tayyebi",
    description: "Design Lead Manager at Meta Superintelligence Labs",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
