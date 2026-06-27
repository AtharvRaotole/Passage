import { NextRequest, NextResponse } from "next/server";
import {
  generateAppleWalletPass,
  getServerAppUrl,
  isWalletPassConfigured,
} from "@/lib/walletPass";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWalletPassConfigured()) {
    return NextResponse.json(
      {
        error: "wallet_pass_not_configured",
        pulseUrl: `${getServerAppUrl()}/pulse`,
      },
      { status: 503 }
    );
  }

  try {
    const profileResponse = await fetch(`${getApiBase()}/api/users/me`, {
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileResponse.json();

    const passBuffer = await generateAppleWalletPass({
      privyUserId: profile.privyUserId,
      walletAddress: profile.walletAddress,
      email: profile.email,
      displayName: profile.displayName,
    });

    return new NextResponse(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="passage-checkin.pkpass"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate pass";

    if (message === "wallet_pass_not_configured") {
      return NextResponse.json(
        {
          error: "wallet_pass_not_configured",
          pulseUrl: `${getServerAppUrl()}/pulse`,
        },
        { status: 503 }
      );
    }

    console.error("Wallet pass generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
