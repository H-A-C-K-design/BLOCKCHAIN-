"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./AuthContext";
import { Menu, X, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role } = useAuth();

  const isStaff = role === "university_admin" || role === "issuer";

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-44 h-10">
              <Image
                src="/memocheck-logo.svg"
                alt="MEMOCHECK Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/#features"
              className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#universities"
              className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
            >
              For universities
            </Link>
            <Link
              href="/verify"
              className="text-sm font-medium text-brand-primary hover:text-brand-deep flex items-center space-x-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify certificate</span>
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {isStaff ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-deep transition-all shadow-subtle"
                  >
                    <span>Staff Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-soft text-brand-deep text-sm font-medium hover:bg-brand-border transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>My Account</span>
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-deep text-white text-sm font-medium hover:bg-brand-primary transition-all shadow-subtle"
              >
                <span>University login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-soft focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-brand-border bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-text hover:bg-brand-soft"
          >
            How it works
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-text hover:bg-brand-soft"
          >
            Features
          </Link>
          <Link
            href="/#universities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-text hover:bg-brand-soft"
          >
            For universities
          </Link>
          <Link
            href="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-primary bg-brand-soft"
          >
            Verify certificate
          </Link>
          <div className="pt-2 border-t border-brand-border">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2.5 rounded-lg bg-brand-primary text-white font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2.5 rounded-lg bg-brand-deep text-white font-medium"
              >
                University login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
