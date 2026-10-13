"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { CertificateRecord } from "@/lib/types/certificate";
import {
  FilePlus,
  Files,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();

        // 1. Fetch real certificates
        const certsRes = await fetch("/api/certificates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (certsRes.ok) {
          const data = await certsRes.json();
          setCertificates(data.certificates || []);
        }

        // 2. Fetch system health
        const healthRes = await fetch("/api/health");
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setSystemHealth(healthData.services);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Derive genuine stats from actual records
  const totalIssued = certificates.length;
  const validCount = certificates.filter((c) => c.status === "ACTIVE").length;
  const revokedCount = certificates.filter((c) => c.status === "REVOKED").length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">Institution Overview</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Real-time verification telemetry and credential registry status.
          </p>
        </div>
        <Link
          href="/dashboard/issue"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-deep transition-all shadow-subtle text-sm shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          <span>Issue New Certificate</span>
        </Link>
      </div>

      {/* System Integration Status Pills */}
      {systemHealth && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-brand-border flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                systemHealth.blockchain?.configured ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-semibold text-brand-text">Blockchain Registry</div>
              <div className="text-[11px] text-brand-muted">
                {systemHealth.blockchain?.configured ? "Connected & Configured" : "Missing RPC / Contract"}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-brand-border flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                systemHealth.ipfs?.configured ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-semibold text-brand-text">IPFS Provider</div>
              <div className="text-[11px] text-brand-muted">
                {systemHealth.ipfs?.configured ? `Configured (${systemHealth.ipfs.provider})` : "Unconfigured"}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-brand-border flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                systemHealth.firebaseAdmin?.configured ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-semibold text-brand-text">Firestore Database</div>
              <div className="text-[11px] text-brand-muted">
                {systemHealth.firebaseAdmin?.configured ? "Connected" : "Unconfigured"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row - Only real counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider">
            <span>Total Issued</span>
            <Files className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-3xl font-extrabold text-brand-text">{loading ? "—" : totalIssued}</div>
          <p className="text-[11px] text-brand-muted">Verified institutional records</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider">
            <span>Active & Valid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-800">{loading ? "—" : validCount}</div>
          <p className="text-[11px] text-brand-muted">Active unrevoked credentials</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider">
            <span>Revoked</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-800">{loading ? "—" : revokedCount}</div>
          <p className="text-[11px] text-brand-muted">Officially retracted on-chain</p>
        </div>
      </div>

      {/* Recent Issuance Records & Genuine Empty State */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-subtle p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-text">Recent Certificate Activity</h2>
          {certificates.length > 0 && (
            <Link
              href="/dashboard/certificates"
              className="text-xs font-semibold text-brand-primary hover:text-brand-deep flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-brand-muted text-sm">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading records...
          </div>
        ) : certificates.length === 0 ? (
          /* GENUINE EMPTY STATE */
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center mx-auto">
              <Files className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-text">No certificates have been issued yet.</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              When university staff upload student certificates, their SHA-256 digests and blockchain records
              will be listed here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/issue"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep shadow-subtle"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Issue First Certificate</span>
              </Link>
            </div>
          </div>
        ) : (
          /* REAL CERTIFICATES LIST */
          <div className="divide-y divide-brand-border">
            {certificates.slice(0, 5).map((cert) => (
              <div
                key={cert.certificateId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-brand-deep">
                      {cert.certificateId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cert.status === "ACTIVE"
                          ? "bg-brand-soft text-brand-deep"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </div>
                  <div className="text-xs text-brand-muted">
                    {cert.studentName} ({cert.studentIdRef}) — {cert.course} ({cert.award})
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-brand-muted text-[11px]">
                    Issued {new Date(cert.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    className="text-brand-primary hover:underline font-medium"
                  >
                    Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
