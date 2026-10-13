import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthorizedIssuer } from "@/lib/auth/authorization";
import { IssueCertificateSchema } from "@/lib/validation/certificate";
import { issueCertificateWorkflow } from "@/lib/certificates/service";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { CertificateRecord } from "@/lib/types/certificate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return NextResponse.json({
      certificates: [],
      total: 0,
      notice: "Firestore is not configured. Configure FIREBASE_ADMIN credentials to view stored records.",
    });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.toLowerCase().trim();

    const snapshot = await adminDb
      .collection("certificates")
      .where("institutionId", "==", authResult.user.institutionId || "institution-main")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    let certificates: CertificateRecord[] = snapshot.docs.map((doc) => doc.data() as CertificateRecord);

    if (query) {
      certificates = certificates.filter(
        (c) =>
          c.certificateId.toLowerCase().includes(query) ||
          c.studentIdRef.toLowerCase().includes(query) ||
          c.studentName.toLowerCase().includes(query) ||
          c.course.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      certificates,
      total: certificates.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database fetch error";
    return NextResponse.json({ error: message, certificates: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateRequest(authHeader);

  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status });
  }

  if (!isAuthorizedIssuer(authResult.user)) {
    return NextResponse.json(
      { error: "Forbidden: Only approved university staff can issue certificates" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const studentName = formData.get("studentName") as string;
    const studentIdRef = formData.get("studentIdRef") as string;
    const course = formData.get("course") as string;
    const award = formData.get("award") as string;
    const issueDate = formData.get("issueDate") as string;
    const expiryDate = (formData.get("expiryDate") as string) || undefined;
    const institutionName = (formData.get("institutionName") as string) || undefined;
    const privacyConfirmation = formData.get("privacyConfirmation") === "true";
    const file = formData.get("file") as File | null;

    // 1. Validate Input fields with Zod
    const validationResult = IssueCertificateSchema.safeParse({
      studentName,
      studentIdRef,
      course,
      award,
      issueDate,
      expiryDate,
      institutionName,
      privacyConfirmation,
    });

    if (!validationResult.success) {
      const issues = validationResult.error.errors.map((e) => e.message);
      return NextResponse.json({ error: "Validation failed", details: issues }, { status: 400 });
    }

    // 2. Validate PDF file
    if (!file) {
      return NextResponse.json({ error: "Certificate PDF file is required" }, { status: 400 });
    }

    const maxMb = parseInt(process.env.MAX_PDF_SIZE_MB || "10", 10);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File size exceeds the allowed limit of ${maxMb}MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify PDF Magic Bytes (%PDF-)
    if (buffer.length < 5 || buffer.toString("utf8", 0, 5) !== "%PDF-") {
      return NextResponse.json(
        { error: "Invalid file format. The uploaded file is not a valid PDF document." },
        { status: 400 }
      );
    }

    // 3. Execute Issuance Workflow
    const result = await issueCertificateWorkflow(
      {
        studentName,
        studentIdRef,
        course,
        award,
        issueDate,
        expiryDate,
        institutionName,
        pdfBuffer: buffer,
        pdfFileName: file.name || "certificate.pdf",
      },
      authResult.user
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Issuance failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      record: result.record,
      transactionHash: result.transactionHash,
      ipfsCid: result.ipfsCid,
      warnings: result.warnings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error during issuance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
