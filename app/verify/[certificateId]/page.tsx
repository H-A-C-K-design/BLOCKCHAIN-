"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerificationView } from "@/components/VerificationView";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function CertificateVerificationDetailPage() {
  const params = useParams();
  const certificateId = (params?.certificateId as string) || "";

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/verify"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Certificate Lookup</span>
          </Link>
        </div>

        {/* Page Heading */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-soft border border-brand-border text-xs font-semibold text-brand-deep">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
            <span>Decentralized Verification Result</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight">
            Verifying Certificate <span className="font-mono text-brand-primary">{certificateId}</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Live cryptographic query against the smart contract registry and SHA-256 byte integrity check.
          </p>
        </div>

        {/* Verification Component with autoFetch enabled */}
        <VerificationView initialCertificateId={certificateId} autoFetch={true} />
      </main>

      <Footer />
    </div>
  );
}
