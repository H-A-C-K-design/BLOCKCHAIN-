"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Terminal,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { user, role, institutionName } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error("Failed to load system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = healthData?.services;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">Institution Settings & Telemetry</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Service integration health, smart contract connectivity, and cryptographic infrastructure status.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-brand-soft transition-colors shadow-subtle shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Staff Account & Institution Info */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-brand-text flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-brand-primary" />
          <span>Authenticated Staff Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-muted font-medium block">Institution Name</span>
            <span className="font-bold text-brand-text mt-0.5 block">{institutionName || "Institutional Registry"}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-muted font-medium block">Signed In As</span>
            <span className="font-bold text-brand-text mt-0.5 block truncate">{user?.email || "—"}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-muted font-medium block">Assigned Role</span>
            <span className="font-mono font-bold text-brand-primary mt-0.5 block uppercase">{role}</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Services Health */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-brand-text">Service Integration Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blockchain Card */}
          <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-brand-primary" />
                  <span className="font-bold text-xs sm:text-sm text-brand-text">EVM Blockchain</span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    services?.blockchain?.configured
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {services?.blockchain?.configured ? "Connected" : "Unconfigured"}
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">
                {services?.blockchain?.message || "Validating blockchain RPC connectivity..."}
              </p>
            </div>
            {services?.blockchain?.configured && (
              <div className="text-[11px] font-mono bg-brand-bg p-2.5 rounded-xl border border-brand-border space-y-1">
                <div>Chain ID: {services.blockchain.chainId}</div>
                <div className="truncate">Contract: {services.blockchain.contractAddress}</div>
                {services?.issuerSigner?.address && (
                  <div className="truncate text-brand-primary">
                    Signer: {services.issuerSigner.address}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IPFS Card */}
          <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-brand-primary" />
                  <span className="font-bold text-xs sm:text-sm text-brand-text">IPFS Provider</span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    services?.ipfs?.configured
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {services?.ipfs?.configured ? "Configured" : "Unconfigured"}
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">
                {services?.ipfs?.message || "Checking IPFS provider token..."}
              </p>
            </div>
            {services?.ipfs?.configured && (
              <div className="text-[11px] font-mono bg-brand-bg p-2.5 rounded-xl border border-brand-border">
                Provider: {services.ipfs.provider}
              </div>
            )}
          </div>

          {/* Firestore Card */}
          <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-brand-primary" />
                  <span className="font-bold text-xs sm:text-sm text-brand-text">Firebase Admin</span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    services?.firebaseAdmin?.configured
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {services?.firebaseAdmin?.configured ? "Active" : "Unconfigured"}
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">
                {services?.firebaseAdmin?.message || "Validating Firestore administrative access..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Operator Guide */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex items-center space-x-3 text-brand-deep">
          <Terminal className="w-5 h-5 text-brand-primary" />
          <h2 className="text-base font-bold text-brand-text">Operator Setup & Deployment Reference</h2>
        </div>

        <div className="space-y-4 text-xs text-brand-muted">
          <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
            <div className="font-bold text-brand-text flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-brand-primary" />
              <span>Smart Contract Deployment</span>
            </div>
            <p>
              To compile and deploy the Solidity smart contract (`MemoCheckCertificates.sol`) to your EVM network
              (e.g. Sepolia or local Hardhat/Anvil):
            </p>
            <pre className="p-3 bg-brand-deep text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              npm run compile:contracts
              <br />
              node contracts/scripts/deploy.cjs
            </pre>
            <p>
              Set the output address in your environment as <code className="font-bold text-brand-text">CONTRACT_ADDRESS</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
            <div className="font-bold text-brand-text flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-brand-primary" />
              <span>Staff Role Bootstrapping</span>
            </div>
            <p>
              To grant a staff member the university administrator role securely without client-side permission
              escalation:
            </p>
            <pre className="p-3 bg-brand-deep text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              node scripts/bootstrap-admin.cjs &lt;FIREBASE_UID&gt; university_admin
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
