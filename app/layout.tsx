import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "MEMOCHECK — Academic Certificate Verification Platform",
  description:
    "Decentralized, tamper-evident academic certificate verification platform using SHA-256 integrity checks, IPFS, and EVM smart contracts.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased selection:bg-brand-soft selection:text-brand-deep">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
