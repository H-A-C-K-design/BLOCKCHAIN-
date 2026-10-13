import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Lock, FileCode, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="relative w-44 h-10">
              <Image
                src="/memocheck-logo.svg"
                alt="MEMOCHECK"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm text-brand-muted max-w-md leading-relaxed">
              Tamper-evident academic credential verification. Universities register cryptographic SHA-256
              fingerprints to EVM smart contracts, allowing employers and institutions worldwide to confirm
              authenticity without exposing private student records.
            </p>
            <div className="flex items-center space-x-6 text-xs text-brand-muted pt-2">
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-primary" />
                <span>Zero Student PII On-Chain</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>SHA-256 Document Integrity</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-text mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/verify" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Verify a Certificate
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Workflow Architecture
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Security Features
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Issuer Staff Sign-in
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture / Security Note */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-text mb-4">
              Decentralized Trust
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-3">
              Source of truth is determined by authorized Ethereum Virtual Machine contract state. IPFS provides
              distributed document anchoring when configured.
            </p>
            <div className="p-3 rounded-lg bg-brand-soft/70 border border-brand-border text-xs text-brand-deep">
              <div className="font-semibold flex items-center space-x-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                <span>Vercel + EVM Compatible</span>
              </div>
              <span>Pure byte-level integrity verification.</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center text-xs text-brand-muted space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} MEMOCHECK Platform. All rights reserved.</p>
          <div className="flex space-x-6">
            <span>Serverless Architecture</span>
            <span>•</span>
            <span>EVM Registry</span>
            <span>•</span>
            <span>Strict Role Authorization</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
