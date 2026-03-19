import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI4Econ - AI Toolkit For Economist",
  description: "AI-powered tools and resources for economists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
