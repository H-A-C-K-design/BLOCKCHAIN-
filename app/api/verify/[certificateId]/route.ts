import { NextRequest, NextResponse } from "next/server";
import { verifyCertificateWorkflow } from "@/lib/certificates/service";
import { VerifyParamsSchema } from "@/lib/validation/certificate";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  const paramValidation = VerifyParamsSchema.safeParse({ certificateId: params.certificateId });
  if (!paramValidation.success) {
    return NextResponse.json(
      {
        status: "INVALID",
        message: "Invalid Certificate ID format provided.",
        certificateId: params.certificateId,
        recordFound: false,
        chainChecked: false,
        pdfUploaded: false,
        checkedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  try {
    const evidence = await verifyCertificateWorkflow(params.certificateId, null);
    return NextResponse.json(evidence);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal verification error";
    return NextResponse.json(
      {
        status: "UNABLE_TO_VERIFY",
        message: `System error while verifying certificate: ${message}`,
        certificateId: params.certificateId,
        recordFound: false,
        chainChecked: false,
        pdfUploaded: false,
        checkedAt: new Date().toISOString(),
        configurationIssues: [message],
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  const paramValidation = VerifyParamsSchema.safeParse({ certificateId: params.certificateId });
  if (!paramValidation.success) {
    return NextResponse.json(
      {
        status: "INVALID",
        message: "Invalid Certificate ID format provided.",
        certificateId: params.certificateId,
        recordFound: false,
        chainChecked: false,
        pdfUploaded: false,
        checkedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  try {
    let pdfBuffer: Buffer | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      }
    } else if (contentType.includes("application/pdf")) {
      const arrayBuffer = await request.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    const evidence = await verifyCertificateWorkflow(params.certificateId, pdfBuffer);
    return NextResponse.json(evidence);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying file bytes";
    return NextResponse.json(
      {
        status: "UNABLE_TO_VERIFY",
        message: `Error verifying uploaded PDF: ${message}`,
        certificateId: params.certificateId,
        recordFound: false,
        chainChecked: false,
        pdfUploaded: true,
        checkedAt: new Date().toISOString(),
        configurationIssues: [message],
      },
      { status: 500 }
    );
  }
}
