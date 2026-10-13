"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerificationView } from "@/components/VerificationView";
import { ShieldCheck, Info } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const idFromQuery = searchParams.get("id") || "";

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Page Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-soft border border-brand-border text-xs font-semibold text-brand-deep">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
            <span>Cryptographic Decentralized Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
            Verify Academic Certificate
          </h1>
          <p className="text-sm text-brand-muted max-w-xl mx-auto leading-relaxed">
            Instant tamper-evident verification powered by EVM smart contracts and exact byte-level SHA-256 file hashing.
          </p>
        </div>

        {/* Verification Component */}
        <VerificationView initialCertificateId={idFromQuery} autoFetch={Boolean(idFromQuery)} />

        {/* Verification Explanatory Footnote */}
        <div className="p-4 rounded-xl bg-white border border-brand-border text-xs text-brand-muted space-y-1.5 shadow-subtle">
          <div className="flex items-center space-x-1.5 font-semibold text-brand-text">
            <Info className="w-4 h-4 text-brand-primary" />
            <span>How Verification Works</span>
          </div>
          <p className="leading-relaxed">
            When you verify with MEMOCHECK, the system performs a live cryptographic read from the configured EVM smart
            contract to verify the issuance timestamp, issuer authorization, and revocation state. If you supply the
            original certificate PDF, MEMOCHECK calculates the SHA-256 hash of the exact file bytes in real time and
            matches it against the immutable hash anchored on the blockchain.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PublicVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-muted text-sm">
          Loading verification portal...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
