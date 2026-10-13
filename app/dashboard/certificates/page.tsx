"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { CertificateRecord } from "@/lib/types/certificate";
import {
  Files,
  Search,
  Filter,
  FilePlus,
  ShieldCheck,
  AlertTriangle,
  QrCode as QrIcon,
  ExternalLink,
  Copy,
  Check,
  X,
  Calendar,
  User,
  GraduationCap,
  Clock,
} from "lucide-react";
import QRCode from "qrcode";

export default function CertificatesListPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");

  // Selected certificate for detail modal
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchCertificates() {
      if (!user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const url = searchQuery.trim()
          ? `/api/certificates?q=${encodeURIComponent(searchQuery.trim())}`
          : "/api/certificates";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCertificates(data.certificates || []);
        }
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCertificates();
    }, 250);

    return () => clearTimeout(timer);
  }, [user, searchQuery]);

  // Open certificate detail modal and generate QR
  const openDetailModal = async (cert: CertificateRecord) => {
    setSelectedCert(cert);
    setCopiedLink(false);
    try {
      const appUrl = window.location.origin;
      const verifyUrl = `${appUrl}/verify/${cert.certificateId}`;
      const qr = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#214B39", light: "#FFFFFF" },
      });
      setModalQrUrl(qr);
    } catch {
      setModalQrUrl(null);
    }
  };

  const copyVerifyLink = (certId: string) => {
    const url = `${window.location.origin}/verify/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredCertificates = certificates.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">Certificate Registry</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Institutional credential records anchored with cryptographic proof and smart contract verification.
          </p>
        </div>
        <Link
          href="/dashboard/issue"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-deep transition-all shadow-subtle text-xs sm:text-sm shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          <span>Issue Certificate</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Certificate ID, Student Name, Student ID, or Degree..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-brand-bg/50"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-brand-muted hidden sm:inline">Status:</span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-brand-deep text-white shadow-subtle"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            All ({certificates.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-brand-primary text-white shadow-subtle"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            Active ({certificates.filter((c) => c.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setStatusFilter("REVOKED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "REVOKED"
                ? "bg-brand-error text-white shadow-subtle"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            Revoked ({certificates.filter((c) => c.status === "REVOKED").length})
          </button>
        </div>
      </div>

      {/* Main Table / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-muted font-medium">Querying institutional records...</p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        /* Genuine Empty State */
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-4 shadow-subtle">
          <div className="w-14 h-14 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center mx-auto">
            <Files className="w-7 h-7" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-brand-text">
            {searchQuery ? "No certificates match your query" : "No certificates have been issued yet"}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
            {searchQuery
              ? "Try adjusting your search terms or clearing the filter to find the desired credential record."
              : "Institutional credential registry is clean. Issue your first tamper-evident certificate with SHA-256 integrity and blockchain anchoring."}
          </p>
          <div className="pt-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-text hover:bg-brand-soft"
              >
                Clear Search Query
              </button>
            ) : (
              <Link
                href="/dashboard/issue"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all shadow-subtle"
              >
                <FilePlus className="w-4 h-4" />
                <span>Issue First Certificate</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Certificates Table */
        <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-brand-bg/75 border-b border-brand-border text-brand-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Certificate ID</th>
                  <th className="py-3.5 px-4">Student & Reference</th>
                  <th className="py-3.5 px-4">Program / Award</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.certificateId} className="hover:bg-brand-bg/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-brand-deep whitespace-nowrap">
                      {cert.certificateId}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-brand-text">{cert.studentName}</div>
                      <div className="text-[11px] font-mono text-brand-muted">{cert.studentIdRef}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-brand-text truncate max-w-xs">{cert.award}</div>
                      <div className="text-[11px] text-brand-muted truncate max-w-xs">{cert.course}</div>
                    </td>
                    <td className="py-4 px-4 text-brand-muted whitespace-nowrap">
                      {cert.issueDate}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {cert.status === "ACTIVE" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-brand-error border border-red-200">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => openDetailModal(cert)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-soft transition-colors"
                      >
                        <QrIcon className="w-3.5 h-3.5 text-brand-primary" />
                        <span>View QR</span>
                      </button>

                      <Link
                        href={`/verify/${cert.certificateId}`}
                        target="_blank"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-soft text-xs font-medium text-brand-deep hover:bg-brand-border transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Verify</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-brand-border shadow-elevated p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-soft"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                Credential Verification Card
              </span>
              <h2 className="text-xl font-bold text-brand-text mt-0.5">{selectedCert.studentName}</h2>
              <p className="text-xs text-brand-muted">{selectedCert.award}</p>
            </div>

            {/* QR Code and Verification link */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-brand-soft border border-brand-border/60 text-center space-y-3">
              {modalQrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={modalQrUrl}
                  alt={`QR code for ${selectedCert.certificateId}`}
                  className="w-48 h-48 rounded-lg shadow-sm border border-brand-border"
                />
              ) : (
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border border-brand-border">
                  <QrIcon className="w-12 h-12 text-brand-muted" />
                </div>
              )}
              <div className="text-xs font-mono font-bold text-brand-deep select-all">
                {selectedCert.certificateId}
              </div>
              <button
                onClick={() => copyVerifyLink(selectedCert.certificateId)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-semibold text-brand-text hover:bg-brand-bg transition-colors shadow-subtle"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-brand-primary" /> : <Copy className="w-3.5 h-3.5 text-brand-muted" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Public Verification URL"}</span>
              </button>
            </div>

            {/* Cryptographic & Record Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-brand-bg border border-brand-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Student Reference:</span>
                  <span className="font-mono font-semibold text-brand-text">{selectedCert.studentIdRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Issue Date:</span>
                  <span className="font-semibold text-brand-text">{selectedCert.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Registry Status:</span>
                  <span
                    className={`font-semibold ${
                      selectedCert.status === "ACTIVE" ? "text-emerald-700" : "text-brand-error"
                    }`}
                  >
                    {selectedCert.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1">
                  SHA-256 PDF Hash:
                </div>
                <div className="font-mono text-[11px] p-2 rounded-lg bg-brand-bg border border-brand-border break-all select-all text-brand-deep">
                  {selectedCert.pdfHash}
                </div>
              </div>

              {selectedCert.transactionHash && (
                <div>
                  <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1">
                    On-Chain Transaction:
                  </div>
                  <div className="font-mono text-[11px] p-2 rounded-lg bg-brand-bg border border-brand-border break-all select-all text-brand-primary">
                    {selectedCert.transactionHash}
                  </div>
                </div>
              )}

              {selectedCert.ipfsCid && (
                <div>
                  <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1">
                    IPFS CID:
                  </div>
                  <div className="font-mono text-[11px] p-2 rounded-lg bg-brand-bg border border-brand-border break-all select-all text-brand-text">
                    {selectedCert.ipfsCid}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-brand-border">
              {selectedCert.status === "ACTIVE" && (
                <Link
                  href={`/dashboard/revocations?certId=${selectedCert.certificateId}`}
                  className="text-xs font-semibold text-brand-error hover:underline flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Revoke Certificate</span>
                </Link>
              )}
              <div className="flex items-center space-x-3 ml-auto">
                <Link
                  href={`/verify/${selectedCert.certificateId}`}
                  target="_blank"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all shadow-subtle"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Verifier</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
