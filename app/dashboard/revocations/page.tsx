"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { CertificateRecord } from "@/lib/types/certificate";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";

function RevocationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCertId = searchParams.get("certId") || "";

  const [certificateId, setCertificateId] = useState(initialCertId);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    certificateId: string;
    txHash?: string;
    message: string;
  } | null>(null);

  const [revokedCertificates, setRevokedCertificates] = useState<CertificateRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchRevokedList = React.useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const all: CertificateRecord[] = data.certificates || [];
        setRevokedCertificates(all.filter((c) => c.status === "REVOKED"));
      }
    } catch (err) {
      console.error("Failed to load revoked certificates:", err);
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRevokedList();
  }, [fetchRevokedList]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be authenticated as university staff to revoke certificates.");
      return;
    }
    if (!certificateId.trim()) {
      setError("Please provide a valid Certificate ID to revoke.");
      return;
    }
    if (!reason.trim()) {
      setError("An administrative revocation reason is required for institutional audit compliance.");
      return;
    }
    if (!confirmed) {
      setError("Please check the confirmation box acknowledging this action.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessResult(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/certificates/${encodeURIComponent(certificateId.trim())}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Revocation failed on the server.");
      }

      setSuccessResult({
        certificateId: data.certificateId,
        txHash: data.txHash,
        message: data.message,
      });

      // Clear form
      setReason("");
      setConfirmed(false);
      // Refresh list
      fetchRevokedList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing revocation";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">Certificate Revocations</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Execute cryptographically binding revocations on the smart contract registry with an immutable audit trail.
        </p>
      </div>

      {/* Revocation Form Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center space-x-3 text-brand-error">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-brand-error" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-text">Revoke an Existing Credential</h2>
            <p className="text-xs text-brand-muted">
              Revocation writes an immutable state transition to the blockchain. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
            <div className="font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successResult.message}</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-900">
              Certificate: <strong>{successResult.certificateId}</strong>
            </div>
            {successResult.txHash && (
              <div className="font-mono text-[11px] text-emerald-900 break-all">
                On-Chain Tx: {successResult.txHash}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRevokeSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">
              Certificate ID to Revoke <span className="text-brand-error">*</span>
            </label>
            <input
              type="text"
              required
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="e.g. MC-2026-9F8A12"
              className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-error/20 focus:border-brand-error"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              Enter the exact Certificate ID as registered in the blockchain ledger.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">
              Administrative Reason for Revocation <span className="text-brand-error">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Credential issued in error / Academic misconduct decision / Administrative supersession"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-error/20 focus:border-brand-error"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              The reason is recorded permanently in the institutional audit log.
            </p>
          </div>

          {/* Explicit Confirmation */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-start space-x-3">
              <input
                id="confirmRevocation"
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-brand-error focus:ring-brand-error"
              />
              <label htmlFor="confirmRevocation" className="text-xs text-amber-900 leading-relaxed cursor-pointer">
                <strong>Explicit Confirmation:</strong> I confirm that I am an authorized university official and
                understand that this revocation will update the on-chain smart contract state. Once confirmed, public
                verifiers querying this certificate will be shown a <strong>REVOKED</strong> status.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !certificateId.trim() || !reason.trim() || !confirmed}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-error text-white text-xs font-semibold hover:bg-red-800 transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting On-Chain Revocation...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Submit Immutable Revocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Revoked Certificates Audit Trail */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Revoked Credentials Audit Log</h2>
          <p className="text-xs text-brand-muted">
            Institutional records of certificates that have been formally invalidated.
          </p>
        </div>

        {loadingList ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-brand-muted">Loading audit records...</p>
          </div>
        ) : revokedCertificates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-brand-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-text">No Revoked Certificates</h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">
              All active certificates in this institutional registry remain valid and unrevoked.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg/75 border-b border-brand-border text-brand-muted font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Student & Award</th>
                    <th className="py-3 px-4">Revocation Reason</th>
                    <th className="py-3 px-4">Revoked At</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {revokedCertificates.map((cert) => (
                    <tr key={cert.certificateId} className="hover:bg-brand-bg/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-error whitespace-nowrap">
                        {cert.certificateId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-brand-text">{cert.studentName}</div>
                        <div className="text-[11px] text-brand-muted">{cert.award}</div>
                      </td>
                      <td className="py-3.5 px-4 text-brand-text max-w-xs">
                        {cert.revocationReason || "Administrative Revocation"}
                      </td>
                      <td className="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                        {cert.revokedAt ? new Date(cert.revokedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/verify/${cert.certificateId}`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-50 text-xs font-semibold text-brand-error hover:bg-red-100 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Check Status</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RevocationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-brand-muted">Loading...</div>}>
      <RevocationsContent />
    </Suspense>
  );
}
