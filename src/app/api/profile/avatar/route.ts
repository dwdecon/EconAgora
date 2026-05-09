import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return badRequest("No file provided.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
    }

    if (file.size > MAX_SIZE) {
      return badRequest("File too large. Maximum size is 5MB.");
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const timestamp = Date.now();
    const filename = `avatars/${auth.user.id}_${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadToCloudBaseStorage(
      filename,
      buffer,
      file.type,
      auth.accessToken as string,
    );

    if (!uploadResult.success) {
      return serverError(uploadResult.error ?? "Failed to upload avatar.");
    }

    return NextResponse.json({ url: uploadResult.url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return badRequest("Invalid request.");
  }
}

async function uploadToCloudBaseStorage(
  filename: string,
  data: Buffer,
  contentType: string,
  accessToken: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
  const uploadUrl = `https://${envId}.api.tcloudbasegateway.com/v1/storage/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
        "x-cos-meta-fileid": filename,
      },
      body: data as unknown as BodyInit,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("CloudBase storage upload failed:", response.status, text);
      return { success: false, error: "Failed to upload file." };
    }

    const json = await response.json() as any;
    const cdnUrl = json.data?.access_url ?? json.access_url ?? json.url ?? "";
    const fileId = json.data?.file_id ?? json.file_id ?? "";

    // If we got a file_id but no CDN URL, construct it
    if (fileId && !cdnUrl) {
      return {
        success: true,
        url: `https://${envId}.tcloudbasecloudbase.com/${filename}`,
      };
    }

    return { success: true, url: cdnUrl };
  } catch (error) {
    console.error("Storage upload error:", error);
    return { success: false, error: "Storage service unavailable." };
  }
}
