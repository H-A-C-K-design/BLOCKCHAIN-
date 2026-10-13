"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import {
  FilePlus,
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  QrCode as QrIcon,
} from "lucide-react";
import QRCode from "qrcode";

export default function IssueCertificatePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studentName, setStudentName] = useState("");
  const [studentIdRef, setStudentIdRef] = useState("");
  const [course, setCourse] = useState("");
  const [award, setAward] = useState("Bachelor of Science");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHashPreview, setFileHashPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    certificateId: string;
    record?: any;
    transactionHash?: string;
    ipfsCid?: string;
    qrCodeDataUrl?: string;
    warnings?: string[];
  } | null>(null);

  // Calculate SHA-256 in browser for immediate UI feedback
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileHashPreview(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Selected file must be a valid PDF document.");
      setSelectedFile(null);
      setFileHashPreview(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds maximum allowed size of 10MB.");
      setSelectedFile(null);
      setFileHashPreview(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setFileHashPreview(hashHex);
    } catch {
      setFileHashPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be signed in to issue certificates.");
      return;
    }
    if (!selectedFile) {
      setErrorMessage("Please select a PDF certificate document.");
      return;
    }
    if (!privacyConfirmed) {
      setErrorMessage("Please confirm institutional privacy consent before submission.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("studentName", studentName.trim());
      formData.append("studentIdRef", studentIdRef.trim());
      formData.append("course", course.trim());
      formData.append("award", award.trim());
      formData.append("issueDate", issueDate);
      if (expiryDate.trim()) formData.append("expiryDate", expiryDate.trim());
      formData.append("privacyConfirmation", "true");
      formData.append("file", selectedFile);

      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Certificate issuance failed on the server.");
      }

      const appUrl = window.location.origin;
      const verifyUrl = `${appUrl}/verify/${data.certificateId}`;
      let qrCodeUrl = "";
      try {
        qrCodeUrl = await QRCode.toDataURL(verifyUrl, {
          width: 250,
          margin: 2,
          color: { dark: "#214B39", light: "#FFFFFF" },
        });
      } catch {
        // QR fallback
      }

      setResult({
        certificateId: data.certificateId,
        record: data.record,
        transactionHash: data.transactionHash,
        ipfsCid: data.ipfsCid,
        qrCodeDataUrl: qrCodeUrl,
        warnings: data.warnings,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error during issuance";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentName("");
    setStudentIdRef("");
    setCourse("");
    setAward("Bachelor of Science");
    setExpiryDate("");
    setPrivacyConfirmed(false);
    setSelectedFile(null);
    setFileHashPreview(null);
    setErrorMessage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="border-b border-brand-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">Issue Certificate</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Register academic credential with SHA-256 cryptographic proof, IPFS anchoring, and smart contract audit trail.
          </p>
        </div>
      </div>

      {result ? (
        /* SUCCESS CONFIRMATION STATE */
        <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center space-x-3 text-brand-primary">
            <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text">Certificate Issued Successfully</h2>
              <p className="text-xs text-brand-muted">
                Cryptographic integrity registered and saved to institutional records.
              </p>
            </div>
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice Regarding External Providers:</span>
              </div>
              {result.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Left 2 cols: Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                    Certificate ID
                  </div>
                  <div className="font-mono text-base font-bold text-brand-deep select-all">
                    {result.certificateId}
                  </div>
                </div>

                {fileHashPreview && (
                  <div>
                    <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                      SHA-256 PDF Hash (32 bytes)
                    </div>
                    <div className="font-mono text-xs text-brand-text break-all select-all bg-white p-2 rounded-lg border border-brand-border">
                      {fileHashPreview}
                    </div>
                  </div>
                )}

                {result.transactionHash && (
                  <div>
                    <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                      On-Chain Transaction
                    </div>
                    <div className="font-mono text-xs text-brand-primary break-all select-all">
                      {result.transactionHash}
                    </div>
                  </div>
                )}

                {result.ipfsCid && (
                  <div>
                    <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                      IPFS Content CID
                    </div>
                    <div className="font-mono text-xs text-brand-text break-all select-all">
                      {result.ipfsCid}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/verify/${result.certificateId}`}
                  target="_blank"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all shadow-subtle"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Public Verification Page</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                </Link>

                <Link
                  href="/dashboard/certificates"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-brand-border text-brand-text text-xs font-semibold hover:bg-brand-soft transition-all"
                >
                  <FileText className="w-4 h-4 text-brand-muted" />
                  <span>View All Certificates</span>
                </Link>
              </div>
            </div>

            {/* Right col: QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-brand-soft border border-brand-border/60 text-center space-y-3">
              {result.qrCodeDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={result.qrCodeDataUrl}
                  alt={`QR code for ${result.certificateId}`}
                  className="w-40 h-40 rounded-lg shadow-sm border border-brand-border"
                />
              ) : (
                <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center border border-brand-border">
                  <QrIcon className="w-12 h-12 text-brand-muted" />
                </div>
              )}
              <div className="text-[11px] font-medium text-brand-deep">
                Scan to verify credential authenticity on-chain
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-soft transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Issue Another Certificate</span>
            </button>
          </div>
        </div>
      ) : (
        /* ISSUANCE FORM */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Student & Course Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Student Full Name <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex M. Chen"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Student ID / Institutional Reference <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                required
                value={studentIdRef}
                onChange={(e) => setStudentIdRef(e.target.value)}
                placeholder="e.g. STU-2024-8842"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Degree / Program of Study <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Computer Science & Software Engineering"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Award / Qualification Title <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                required
                value={award}
                onChange={(e) => setAward(e.target.value)}
                placeholder="e.g. Bachelor of Science with First Class Honours"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Date of Issuance <span className="text-brand-error">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Expiration Date <span className="text-brand-muted font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Certificate PDF Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-brand-text">
              Official Certificate PDF File <span className="text-brand-error">*</span>
            </label>
            <div className="border-2 border-dashed border-brand-border rounded-2xl p-6 text-center hover:bg-brand-bg transition-colors relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-brand-deep">{selectedFile.name}</p>
                    <p className="text-xs text-brand-muted">
                      {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      Click to choose or drag & drop certificate PDF
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">Maximum size: 10MB • Must be valid PDF bytes</p>
                  </div>
                )}
              </div>
            </div>

            {fileHashPreview && (
              <div className="p-3 rounded-xl bg-brand-soft border border-brand-border/60 text-xs">
                <span className="font-semibold text-brand-deep">Calculated SHA-256 (Client-side preview):</span>{" "}
                <span className="font-mono text-brand-muted break-all">{fileHashPreview}</span>
              </div>
            )}
          </div>

          {/* Privacy & Compliance Notice */}
          <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
            <div className="flex items-start space-x-3">
              <input
                id="privacyCheck"
                type="checkbox"
                required
                checked={privacyConfirmed}
                onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="privacyCheck" className="text-xs text-brand-muted leading-relaxed cursor-pointer">
                <strong>Privacy & Cryptographic Anchor Notice:</strong> By submitting, only the SHA-256 hash of the certificate
                bytes and the unique Certificate ID will be recorded to the public blockchain registry. Student personal details (name, student ID) are
                retained exclusively within institutional records in accordance with student privacy regulations.
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-4 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-soft transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !selectedFile || !privacyConfirmed}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Issuance...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Issue & Anchor Certificate</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
