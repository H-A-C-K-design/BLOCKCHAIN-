"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, institutionName, loading, isConfigured, signInWithGoogle, signOut, refreshRole } =
    useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isStaff = role === "university_admin" || role === "issuer";

  React.useEffect(() => {
    if (!loading && user && isStaff) {
      router.push("/dashboard");
    }
  }, [user, isStaff, loading, router]);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setErrorMsg(msg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleRefresh = async () => {
    setErrorMsg(null);
    setRefreshing(true);
    try {
      await refreshRole();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refresh failed";
      setErrorMsg(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="relative w-48 h-12 mx-auto mb-3">
              <Image
                src="/memocheck-logo.svg"
                alt="MEMOCHECK"
                fill
                priority
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-brand-text">Staff Authentication Portal</h1>
            <p className="text-xs text-brand-muted mt-1">
              Authorized access for university registrars and certificate administrators.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-card p-8">
            {/* 1. Firebase not configured state */}
            {!isConfigured ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Firebase Credentials Required</span>
                  </div>
                  <p>
                    Firebase Authentication is not yet configured for this deployment. To enable Google sign-in:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 font-mono text-[11px]">
                    <li>Create a Firebase Project in the Google Cloud console.</li>
                    <li>Enable the Google sign-in provider in Authentication.</li>
                    <li>Add your credentials to <span className="bg-white px-1 py-0.5 rounded">.env.local</span>.</li>
                  </ol>
                </div>
                <div className="text-xs text-brand-muted">
                  Refer to <code className="bg-brand-soft px-1.5 py-0.5 rounded text-brand-deep">.env.example</code> for the required parameter keys.
                </div>
              </div>
            ) : loading || signingIn ? (
              /* Loading state */
              <div className="py-12 text-center space-y-4">
                <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-brand-text">Authenticating with Google...</p>
              </div>
            ) : user && isStaff ? (
              /* Signed in AND authorized */
              <div className="space-y-6 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-primary mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-text">Authorized Staff Session</h2>
                  <p className="text-xs text-brand-muted mt-1">
                    Signed in as <strong className="text-brand-text">{user.email}</strong>
                  </p>
                  <div className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-semibold">
                    Role: {role} ({institutionName || "Institution"})
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-deep transition-all shadow-subtle flex items-center justify-center space-x-2 text-sm"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-soft transition-all text-xs flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : user && !isStaff ? (
              /* Signed in BUT NO ISSUER ROLE: Access not granted state */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-bold text-amber-900">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                    <span>Access Not Granted</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    Your Google account (<strong>{user.email}</strong>) has been authenticated, but you do not
                    possess university issuing authority.
                  </p>
                  <div className="p-2.5 rounded bg-white/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <div className="font-semibold">Security Policy:</div>
                    <p>
                      Google login confirms identity, but does not grant certificate issuance privileges.
                      Only verified staff approved by an institutional administrator can issue or revoke credentials.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-brand-bg p-3.5 border border-brand-border text-xs text-brand-muted space-y-2">
                  <div className="flex items-center space-x-1.5 font-semibold text-brand-text">
                    <Terminal className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Admin Bootstrap Procedure</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    If you are the institution administrator configuring this system, execute the server bootstrap script:
                  </p>
                  <div className="bg-white p-2 rounded border border-brand-border font-mono text-[10px] text-brand-deep select-all">
                    node scripts/bootstrap-admin.cjs {user.email} university_admin
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60"
                  >
                    {refreshing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <span>Refresh Authorization</span>
                    )}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="py-2.5 px-3 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* Signed out: standard login form */
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-brand-muted">
                    Sign in with your authorized institutional Google account.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignIn}
                  className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border border-brand-border bg-white hover:bg-brand-soft text-brand-text text-sm font-semibold transition-all shadow-subtle group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <div className="pt-2 border-t border-brand-border/60 text-[11px] text-brand-muted space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-brand-primary" />
                    <span>Protected by Firebase ID Token Authentication</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <HelpCircle className="w-3 h-3 text-brand-muted" />
                    <span>External employers do not need to sign in to verify documents.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
