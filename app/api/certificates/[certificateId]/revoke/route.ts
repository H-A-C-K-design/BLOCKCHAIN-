import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthorizedIssuer } from "@/lib/auth/authorization";
import { RevokeCertificateSchema } from "@/lib/validation/certificate";
import { revokeCertificateWorkflow } from "@/lib/certificates/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateRequest(authHeader);

  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status });
  }

  if (!isAuthorizedIssuer(authResult.user)) {
    return NextResponse.json(
      { error: "Forbidden: Authorized university staff role required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = RevokeCertificateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid revocation payload", details: validation.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { reason } = validation.data;
    const result = await revokeCertificateWorkflow(params.certificateId, reason, authResult.user);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Revocation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificateId: params.certificateId,
      txHash: result.txHash,
      message: "Certificate was successfully revoked on-chain and in system records.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error processing revocation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
