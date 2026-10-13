"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  FileCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Camera,
  X,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { VerificationEvidence, CertificateStatus } from "@/lib/types/certificate";

interface VerificationViewProps {
  initialCertificateId?: string;
  autoFetch?: boolean;
}

export function VerificationView({
  initialCertificateId = "",
  autoFetch = false,
}: VerificationViewProps) {
  const [certId, setCertId] = useState(initialCertificateId);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [computedLocalHash, setComputedLocalHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<VerificationEvidence | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Camera QR Scanner Modal
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute local SHA-256 preview whenever PDF is selected
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      setComputedLocalHash(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a valid PDF document.");
      return;
    }

    setPdfFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setComputedLocalHash(hashHex);
    } catch {
      setComputedLocalHash(null);
    }
  };

  const executeVerification = React.useCallback(
    async (targetId: string, fileToVerify: File | null = pdfFile) => {
      const trimmedId = targetId.trim();
      if (!trimmedId) return;

      setLoading(true);
      setEvidence(null);

      try {
        let res: Response;
        if (fileToVerify) {
          const formData = new FormData();
          formData.append("file", fileToVerify);
          res = await fetch(`/api/verify/${encodeURIComponent(trimmedId)}`, {
            method: "POST",
            body: formData,
          });
        } else {
          res = await fetch(`/api/verify/${encodeURIComponent(trimmedId)}`);
        }

        const data: VerificationEvidence = await res.json();
        setEvidence(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setEvidence({
          status: "UNABLE_TO_VERIFY",
          message: `Failed to contact verification service: ${msg}. Check network or RPC configuration.`,
          certificateId: trimmedId,
          recordFound: false,
          chainChecked: false,
          pdfUploaded: Boolean(fileToVerify),
          checkedAt: new Date().toISOString(),
          configurationIssues: [msg],
        });
      } finally {
        setLoading(false);
      }
    },
    [pdfFile]
  );

  useEffect(() => {
    if (autoFetch && initialCertificateId) {
      executeVerification(initialCertificateId);
    }
  }, [autoFetch, initialCertificateId, executeVerification]);

  // Camera QR Code Scanner lifecycle
  const startScanner = async () => {
    setScannerOpen(true);
    setScannerError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser/device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // If BarcodeDetector is available in Chromium-based browsers
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const scanLoop = async () => {
          if (!mediaStreamRef.current || !videoRef.current) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                handleQrPayload(rawValue);
                stopScanner();
                return;
              }
            }
          } catch {
            // Scanner tick
          }
          requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to access camera";
      setScannerError(msg);
    }
  };

  const stopScanner = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setScannerOpen(false);
  };

  const handleQrPayload = (qrText: string) => {
    // Check if QR text is a full URL like http://.../verify/MC-2026-XYZ
    const match = qrText.match(/\/verify\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      setCertId(match[1]);
      executeVerification(match[1]);
    } else {
      setCertId(qrText.trim());
      executeVerification(qrText.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusBadge = (status: CertificateStatus) => {
    switch (status) {
      case "VALID":
        return (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-sm font-bold shadow-subtle">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>AUTHENTIC & VALID</span>
          </div>
        );
      case "INVALID":
        return (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 text-brand-error border border-red-300 text-sm font-bold shadow-subtle">
            <XCircle className="w-5 h-5 text-brand-error" />
            <span>INVALID / UNVERIFIED</span>
          </div>
        );
      case "REVOKED":
        return (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-sm font-bold shadow-subtle">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>REVOKED CREDENTIAL</span>
          </div>
        );
      case "UNABLE_TO_VERIFY":
      default:
        return (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm font-bold shadow-subtle">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>UNABLE TO VERIFY</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Verification Input Form */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-brand-text">Verify Academic Credential</h2>
            <p className="text-xs text-brand-muted">
              Enter the Certificate ID or scan the QR code to query the decentralized registry.
            </p>
          </div>
          <button
            type="button"
            onClick={startScanner}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-soft text-brand-deep border border-brand-border text-xs font-semibold hover:bg-brand-border/60 transition-colors shrink-0"
          >
            <Camera className="w-4 h-4 text-brand-primary" />
            <span>Scan QR Code</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeVerification(certId);
          }}
          className="space-y-5"
        >
          {/* Certificate ID Input */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">
              Certificate Identifier (ID) <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. MC-2026-8A39F1"
                className="w-full pl-10 pr-4 py-3 text-sm font-mono rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Optional PDF File Upload for Byte-level comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-text">
                Compare Original PDF File <span className="text-brand-muted font-normal">(Optional Byte-Level Hash Check)</span>
              </label>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    setComputedLocalHash(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-[11px] text-brand-error hover:underline"
                >
                  Remove File
                </button>
              )}
            </div>

            <div className="border border-dashed border-brand-border rounded-xl p-4 text-center hover:bg-brand-bg transition-colors relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center space-x-3 pointer-events-none">
                <UploadCloud className="w-5 h-5 text-brand-muted" />
                <div className="text-xs text-left">
                  {pdfFile ? (
                    <div>
                      <span className="font-semibold text-brand-deep">{pdfFile.name}</span>
                      <span className="text-brand-muted ml-2">({(pdfFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <span className="text-brand-muted">
                      Drop student certificate PDF here to compare exact cryptographic bytes
                    </span>
                  )}
                </div>
              </div>
            </div>

            {computedLocalHash && (
              <div className="text-[11px] font-mono text-brand-muted bg-brand-bg p-2 rounded-lg border border-brand-border break-all">
                Client SHA-256: {computedLocalHash}
              </div>
            )}
          </div>

          {/* Verification CTA */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading || !certId.trim()}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying on Blockchain...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* VERIFICATION EVIDENCE DISPLAY */}
      {evidence && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-6">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
            <div>
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                Cryptographic Evidence Report
              </span>
              <h3 className="text-xl font-bold text-brand-text mt-0.5 font-mono">{evidence.certificateId}</h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Checked at: {new Date(evidence.checkedAt).toLocaleString()}
              </p>
            </div>
            <div>{getStatusBadge(evidence.status)}</div>
          </div>

          {/* Explanation Message */}
          <div
            className={`p-4 rounded-xl text-xs leading-relaxed ${
              evidence.status === "VALID"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : evidence.status === "REVOKED"
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : evidence.status === "INVALID"
                ? "bg-red-50 text-brand-error border border-red-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <div className="font-semibold mb-0.5">Verification Determination:</div>
            {evidence.message}
          </div>

          {/* Verification Evidence Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
              <h4 className="text-xs font-bold text-brand-deep uppercase tracking-wider">
                Blockchain Record Verification
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">Smart Contract Queried:</span>
                  <span className="font-semibold text-brand-text">
                    {evidence.chainChecked ? "Yes (Live On-Chain)" : "Not Configured / Unreachable"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">On-Chain Record Exists:</span>
                  <span className="font-semibold text-brand-text">
                    {evidence.onChainRecord?.exists ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">Revocation Flag:</span>
                  <span
                    className={`font-semibold ${
                      evidence.onChainRecord?.revoked ? "text-brand-error" : "text-emerald-700"
                    }`}
                  >
                    {evidence.onChainRecord?.revoked ? "REVOKED" : "Active"}
                  </span>
                </div>
                {evidence.onChainRecord?.issuer && (
                  <div>
                    <span className="text-brand-muted block">Issuer Signer Address:</span>
                    <span className="font-mono text-[11px] text-brand-deep break-all select-all">
                      {evidence.onChainRecord.issuer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
              <h4 className="text-xs font-bold text-brand-deep uppercase tracking-wider">
                Document File Integrity (SHA-256)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">PDF Uploaded for Check:</span>
                  <span className="font-semibold text-brand-text">
                    {evidence.pdfUploaded ? "Yes" : "No file provided"}
                  </span>
                </div>
                {evidence.pdfUploaded && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted">Byte Hash Comparison:</span>
                    <span
                      className={`font-semibold ${
                        evidence.pdfHashMatch ? "text-emerald-700" : "text-brand-error"
                      }`}
                    >
                      {evidence.pdfHashMatch ? "Exact Match (100%)" : "Mismatch (Tampered/Different)"}
                    </span>
                  </div>
                )}
                {evidence.onChainHash && (
                  <div>
                    <span className="text-brand-muted block">On-Chain Stored Hash:</span>
                    <span className="font-mono text-[11px] text-brand-text break-all select-all block bg-white p-1.5 rounded border border-brand-border">
                      {evidence.onChainHash}
                    </span>
                  </div>
                )}
                {evidence.computedHash && (
                  <div>
                    <span className="text-brand-muted block">Uploaded PDF Hash:</span>
                    <span className="font-mono text-[11px] text-brand-text break-all select-all block bg-white p-1.5 rounded border border-brand-border">
                      {evidence.computedHash}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Institutional Metadata (if available and public) */}
          {evidence.metadata && (
            <div className="p-4 rounded-xl bg-brand-soft border border-brand-border/60 space-y-2 text-xs">
              <h4 className="font-bold text-brand-deep uppercase tracking-wider text-[11px]">
                Institutional Credential Metadata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {evidence.metadata.award && (
                  <div>
                    <span className="text-brand-muted block">Degree / Award:</span>
                    <span className="font-semibold text-brand-text">{evidence.metadata.award}</span>
                  </div>
                )}
                {evidence.metadata.course && (
                  <div>
                    <span className="text-brand-muted block">Program:</span>
                    <span className="font-semibold text-brand-text">{evidence.metadata.course}</span>
                  </div>
                )}
                {evidence.metadata.institutionName && (
                  <div>
                    <span className="text-brand-muted block">Granting Institution:</span>
                    <span className="font-semibold text-brand-text">{evidence.metadata.institutionName}</span>
                  </div>
                )}
                {evidence.metadata.issueDate && (
                  <div>
                    <span className="text-brand-muted block">Date Issued:</span>
                    <span className="font-semibold text-brand-text">{evidence.metadata.issueDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Block Explorer Link */}
          {evidence.blockExplorerUrl && (
            <div className="pt-2 flex justify-end">
              <a
                href={evidence.blockExplorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:text-brand-deep hover:underline"
              >
                <span>View Transaction on Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-brand-border shadow-elevated p-6 space-y-4 relative">
            <button
              onClick={stopScanner}
              className="absolute top-4 right-4 p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-soft"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-brand-text">Scan Certificate QR Code</h3>
              <p className="text-xs text-brand-muted">Point your camera at the QR code printed on the certificate.</p>
            </div>

            {scannerError ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">Camera Access Unavailable:</p>
                <p>{scannerError}</p>
                <p className="text-[11px] text-brand-muted">
                  You can type or paste the Certificate ID directly into the verification field.
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-brand-border">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 border-2 border-brand-primary/50 m-8 rounded-lg pointer-events-none" />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={stopScanner}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-soft"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
