"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
  LayoutDashboard,
  FilePlus,
  Files,
  ShieldCheck,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, institutionName, loading, isConfigured, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isStaff = role === "university_admin" || role === "issuer";

  useEffect(() => {
    if (!loading && isConfigured) {
      if (!user) {
        router.push("/login");
      }
    }
  }, [user, loading, isConfigured, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-brand-muted">Verifying staff credentials...</p>
        </div>
      </div>
    );
  }

  if (user && !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-brand-border shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-brand-text">Staff Authorization Required</h1>
          <p className="text-xs text-brand-muted leading-relaxed">
            Signed in as <strong>{user.email}</strong>. Your account has not yet been assigned
            the university_admin or issuer role.
          </p>
          <div className="pt-2 flex flex-col space-y-2">
            <Link
              href="/login"
              className="py-2.5 px-4 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep"
            >
              Back to Sign In
            </Link>
            <button
              onClick={() => signOut()}
              className="py-2 px-4 rounded-xl border border-brand-border text-brand-muted text-xs hover:text-brand-text"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/issue", label: "Issue Certificate", icon: FilePlus },
    { href: "/dashboard/certificates", label: "Certificates", icon: Files },
    { href: "/dashboard/revocations", label: "Revocations", icon: AlertTriangle },
    { href: "/verify", label: "Public Verifier", icon: ShieldCheck },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-brand-border fixed inset-y-0 z-40">
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-brand-border">
          <Link href="/" className="relative w-36 h-8 block">
            <Image
              src="/memocheck-logo.svg"
              alt="MEMOCHECK"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        {/* Institution Badge */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-brand-soft border border-brand-border/60">
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-deep">
            <UserCheck className="w-4 h-4 text-brand-primary" />
            <span className="truncate">{institutionName || "Institution Registry"}</span>
          </div>
          <div className="text-[11px] text-brand-muted mt-1 font-mono uppercase tracking-wider">
            Role: {role}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-primary text-white shadow-subtle"
                    : "text-brand-muted hover:text-brand-text hover:bg-brand-soft"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-brand-muted"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer & sign out */}
        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-text truncate">
                {user?.displayName || user?.email}
              </p>
              <p className="text-[11px] text-brand-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-error hover:bg-red-50 transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-brand-border z-30 flex items-center justify-between px-4">
        <Link href="/" className="relative w-36 h-8 block">
          <Image
            src="/memocheck-logo.svg"
            alt="MEMOCHECK"
            fill
            priority
            className="object-contain object-left"
          />
        </Link>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-soft"
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full flex flex-col p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Navigation
              </span>
              <button onClick={() => setMobileNavOpen(false)}>
                <X className="w-5 h-5 text-brand-muted" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium ${
                      isActive ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-soft"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-brand-border">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-semibold text-brand-error rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
