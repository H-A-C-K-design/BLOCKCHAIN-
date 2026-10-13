"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  FileCheck,
  Cpu,
  Lock,
  QrCode,
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [quickCertId, setQuickCertId] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<{
    status?: string;
    message?: string;
    certificateId?: string;
    onChainChecked?: boolean;
    error?: string;
  } | null>(null);

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCertId.trim()) return;

    setQuickLoading(true);
    setQuickResult(null);

    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(quickCertId.trim())}`);
      const data = await res.json();
      setQuickResult({
        status: data.status,
        message: data.message,
        certificateId: data.certificateId,
        onChainChecked: data.chainChecked,
      });
    } catch {
      setQuickResult({
        status: "UNABLE_TO_VERIFY",
        message: "Unable to contact verification service. Please check your network connection.",
        certificateId: quickCertId,
      });
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left copy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-soft border border-brand-border text-xs font-semibold text-brand-deep">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Tamper-evident Credential Verification</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-text tracking-tight leading-[1.12]">
                  Academic certificates you can verify with{" "}
                  <span className="text-brand-primary underline decoration-brand-border decoration-wavy decoration-2">
                    confidence
                  </span>
                  .
                </h1>

                <p className="text-lg text-brand-muted leading-relaxed max-w-2xl">
                  MEMOCHECK helps universities and degree-granting institutions issue tamper-evident digital
                  certificate records and enables employers, embassies, and academic bodies to verify
                  authenticity in seconds using cryptographic SHA-256 hashes and EVM smart contracts.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-deep transition-all shadow-subtle text-base"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify a certificate</span>
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white border border-brand-border text-brand-text font-medium hover:bg-brand-soft transition-all text-base"
                  >
                    <span>University login</span>
                    <ArrowRight className="w-4 h-4 text-brand-muted" />
                  </Link>
                </div>

                <div className="pt-4 flex items-center space-x-6 text-xs text-brand-muted border-t border-brand-border/60">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Zero Hardcoded Sample Data</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Exact Byte-Level SHA-256</span>
                  </span>
                </div>
              </div>

              {/* Right illustrative preview card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-white border border-brand-border shadow-elevated p-6 sm:p-8 space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-border pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-brand-primary" />
                    </div>
                    <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider bg-brand-soft px-2.5 py-1 rounded">
                      Illustrative Diagram
                    </span>
                  </div>

                  {/* Visual mockup illustrating verification steps */}
                  <div className="space-y-4">
                    <div className="rounded-xl bg-brand-bg p-4 border border-brand-border/80">
                      <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                        Cryptographic Flow
                      </div>
                      <div className="space-y-2.5 text-xs text-brand-text font-mono">
                        <div className="flex items-center justify-between p-2 rounded bg-white border border-brand-border/60">
                          <span className="text-brand-muted">Uploaded PDF Bytes</span>
                          <span className="text-brand-deep font-semibold">Exact 32-byte digest</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white border border-brand-border/60">
                          <span className="text-brand-muted">Smart Contract Query</span>
                          <span className="text-brand-primary font-semibold">getCertificate(id)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white border border-brand-border/60">
                          <span className="text-brand-muted">Tamper Status</span>
                          <span className="text-emerald-700 font-semibold">Byte Match Comparison</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-brand-primary/20 bg-brand-soft/60 p-4 flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-brand-deep">Decentralized Source of Truth</div>
                        <div className="text-brand-muted mt-0.5">
                          Verification results depend solely on actual on-chain events and real file bytes.
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-brand-muted text-center italic">
                    Pure cryptographic verification. No mock responses or simulated successes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK VERIFICATION SECTION */}
        <section className="py-12 bg-white border-y border-brand-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-text">
                Quick Certificate Lookup
              </h2>
              <p className="text-sm text-brand-muted max-w-xl mx-auto">
                Query the live blockchain registry and database directly by entering a unique institutional Certificate ID.
              </p>
            </div>

            <form onSubmit={handleQuickVerify} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickCertId}
                    onChange={(e) => setQuickCertId(e.target.value)}
                    placeholder="e.g. MC-2026-AB12CD"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-sm focus:bg-white focus:border-brand-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={quickLoading || !quickCertId.trim()}
                  className="px-6 py-3.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-deep disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-subtle shrink-0 text-sm flex items-center justify-center space-x-2"
                >
                  {quickLoading ? (
                    <span>Checking on-chain...</span>
                  ) : (
                    <>
                      <span>Check Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Result Display */}
            {quickResult && (
              <div className="max-w-2xl mx-auto mt-6">
                <div
                  className={`p-5 rounded-xl border ${
                    quickResult.status === "VALID"
                      ? "bg-brand-soft border-brand-primary/30 text-brand-deep"
                      : quickResult.status === "REVOKED"
                      ? "bg-amber-50 border-amber-300 text-amber-900"
                      : quickResult.status === "INVALID"
                      ? "bg-red-50 border-red-200 text-red-900"
                      : "bg-gray-100 border-gray-300 text-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1">
                        Status: {quickResult.status?.replace(/_/g, " ")}
                      </div>
                      <p className="text-sm font-medium">{quickResult.message}</p>
                    </div>
                    {quickResult.certificateId && (
                      <Link
                        href={`/verify/${encodeURIComponent(quickResult.certificateId)}`}
                        className="text-xs font-semibold underline flex items-center space-x-1 shrink-0 ml-4 hover:opacity-80"
                      >
                        <span>Full Evidence</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-soft border border-brand-border text-xs font-semibold text-brand-primary uppercase tracking-wider">
                System Workflow
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text">
                How MEMOCHECK Operates
              </h2>
              <p className="text-base text-brand-muted leading-relaxed">
                A transparent, multi-tiered credential issuance and verification lifecycle designed for real institutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                {
                  step: "01",
                  title: "Authorized Login",
                  desc: "University staff sign in with Google Auth and are verified against server-managed institutional roles.",
                  icon: Lock,
                },
                {
                  step: "02",
                  title: "SHA-256 Digest",
                  desc: "Server reads uploaded PDF bytes and computes an exact SHA-256 hash. Optional IPFS upload occurs if configured.",
                  icon: FileCheck,
                },
                {
                  step: "03",
                  title: "Smart Contract",
                  desc: "Issuance transaction writes certificate ID, hash, and issuer address to the blockchain registry.",
                  icon: Cpu,
                },
                {
                  step: "04",
                  title: "QR Code Issued",
                  desc: "Institutional Certificate ID and high-contrast QR code are generated linking directly to the verification page.",
                  icon: QrCode,
                },
                {
                  step: "05",
                  title: "Public Verification",
                  desc: "Employers query the contract, optionally upload the presented PDF, and get instant byte-level verification.",
                  icon: ShieldCheck,
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-brand-primary font-mono bg-brand-soft px-2.5 py-1 rounded">
                          STEP {item.step}
                        </span>
                        <IconComponent className="w-5 h-5 text-brand-muted" />
                      </div>
                      <h3 className="text-base font-bold text-brand-text mb-2">{item.title}</h3>
                      <p className="text-xs text-brand-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 bg-white border-t border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text">
                Enterprise Verification Standards
              </h2>
              <p className="text-base text-brand-muted leading-relaxed">
                Purpose-built to uphold academic credibility, prevent fraud, and protect student privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "SHA-256 Byte Integrity",
                  desc: "Calculates mathematical hashes from exact file bytes. Even altering a single comma or pixel changes the hash and triggers INVALID.",
                  icon: FileCheck,
                },
                {
                  title: "Decentralized Registry",
                  desc: "Smart contracts record issuance immutably. University credentials cannot be forged or altered retroactively.",
                  icon: Database,
                },
                {
                  title: "Official Revocation State",
                  desc: "Authorized staff can revoke credentials on-chain with auditable administrative reasons, immediately reflected in verifications.",
                  icon: AlertTriangle,
                },
                {
                  title: "Zero PII on Blockchain",
                  desc: "Student personal identification, names, and grades are never written to public ledgers—ensuring complete privacy compliance.",
                  icon: Lock,
                },
                {
                  title: "QR Code & Camera Scanning",
                  desc: "Employers can scan certificate QR codes with smartphone cameras or enter the institutional reference ID manually.",
                  icon: QrCode,
                },
                {
                  title: "Role-Based Staff Access",
                  desc: "Google sign-in is authentication only. Issuance and revocation require server-approved university_admin or issuer custom claims.",
                  icon: ShieldCheck,
                },
              ].map((f, i) => {
                const IconComp = f.icon;
                return (
                  <div key={i} className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-border flex items-center justify-center text-brand-primary">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-brand-text">{f.title}</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOR UNIVERSITIES */}
        <section id="universities" className="py-20 bg-brand-bg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-brand-deep text-white p-8 sm:p-12 shadow-elevated">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>For Academic Registrars</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    Institutional Onboarding & Authorization
                  </h2>
                  <p className="text-sm text-brand-soft/80 leading-relaxed">
                    Signing in with a Google account does not grant certificate issuing authority. All university
                    staff accounts must be provisioned by an institution administrator using server-side bootstrap
                    or admin claim assignments. Blockchain transactions incur standard network gas fees on EVM networks.
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="w-full text-center py-3.5 px-6 rounded-xl bg-white text-brand-deep font-semibold hover:bg-brand-soft transition-all text-sm"
                  >
                    Staff Portal
                  </Link>
                  <Link
                    href="/verify"
                    className="w-full text-center py-3.5 px-6 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all text-sm"
                  >
                    Public Verification
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
