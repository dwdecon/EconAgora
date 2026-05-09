import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";

/**
 * POST /api/profile/email/send - Send OTP to new email
 * Body: { email: string }
 *
 * POST /api/profile/email/verify - Verify OTP and update email
 * Body: { email: string; token: string }
 */

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid request body.");
  }

  const { email, token } = body as { email?: string; token?: string };

  if (token && email) {
    // Step 2: Verify OTP and complete email change
    return verifyAndUpdateEmail(email, token, auth.accessToken as string);
  } else if (email) {
    // Step 1: Send OTP to new email
    return sendEmailChangeOtp(email, auth.accessToken as string);
  } else {
    return badRequest("Email is required.");
  }
}

async function sendEmailChangeOtp(email: string, accessToken: string) {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/user/update/email/send`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-client-id": envId,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Email change send failed:", response.status, text);
      return serverError("Failed to send verification code.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email change send error:", error);
    return serverError("Failed to send verification code.");
  }
}

async function verifyAndUpdateEmail(email: string, token: string, accessToken: string) {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/user/update/email/verify`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-client-id": envId,
      },
      body: JSON.stringify({ email, token }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Email change verify failed:", response.status, text);
      return serverError("Failed to update email.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email change verify error:", error);
    return serverError("Failed to update email.");
  }
}
