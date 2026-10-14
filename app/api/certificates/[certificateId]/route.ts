import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthorizedIssuer } from "@/lib/auth/authorization";
import { getCertificateRecord } from "@/lib/db/certificateStore";
import { readOnChainCertificate } from "@/lib/blockchain/contract";
import { getBlockExplorerTxUrl } from "@/lib/blockchain/client";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateRequest(authHeader);

  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status });
  }

  if (!isAuthorizedIssuer(authResult.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const certificateId = params.certificateId;
  const record = await getCertificateRecord(certificateId);

  // Also query on-chain status
  const chainResult = await readOnChainCertificate(certificateId);

  if (!record && !chainResult.record) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Generate QR code data URL pointing to verification page
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify/${certificateId}`;
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#214B39",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
  }

  const explorerUrl = record?.transactionHash ? getBlockExplorerTxUrl(record.transactionHash) : null;

  return NextResponse.json({
    certificateId,
    record,
    onChainRecord: chainResult.record,
    verifyUrl,
    qrCodeDataUrl,
    explorerUrl,
  });
}
