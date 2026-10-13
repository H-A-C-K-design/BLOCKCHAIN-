import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateRequest(authHeader);

  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: authResult.status }
    );
  }

  return NextResponse.json({
    user: authResult.user,
    timestamp: new Date().toISOString(),
  });
}
