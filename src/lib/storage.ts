import { randomBytes } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

/**
 * Product image storage. Mirrors the sandbox/live provider split used elsewhere: when Supabase
 * Storage is configured (URL + service-role key) uploads go to the bucket and return its public
 * CDN URL; otherwise they are written under public/uploads/products so the admin can manage
 * images with zero external accounts. Local files are durable for a single long-lived host but
 * are lost on redeploy of an ephemeral container — configure Supabase for production.
 */

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "product-images";
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads", "products");
const LOCAL_URL_PREFIX = "/uploads/products";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export function supabaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface ImageValidationError {
  error: string;
}

/** Validates an uploaded file, returning the resolved extension or a user-facing error. */
export function validateImage(file: File): { extension: string } | ImageValidationError {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { error: "No image file was received" };
  }
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return { error: "Unsupported image type — use JPG, PNG, WEBP, AVIF or GIF" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `Image is too large — keep it under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB` };
  }
  if (file.size === 0) {
    return { error: "The image file is empty" };
  }
  return { extension };
}

/** Uploads a validated product image and returns the URL to store on Product.images. */
export async function uploadProductImage(file: File, extension: string): Promise<string> {
  const objectName = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (supabaseStorageConfigured()) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await client.storage
      .from(BUCKET)
      .upload(objectName, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    const { data } = client.storage.from(BUCKET).getPublicUrl(objectName);
    return data.publicUrl;
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, objectName), bytes);
  return `${LOCAL_URL_PREFIX}/${objectName}`;
}

/** Best-effort cleanup of a previously uploaded image. Never throws. */
export async function deleteProductImage(url: string): Promise<void> {
  try {
    if (url.startsWith(`${LOCAL_URL_PREFIX}/`)) {
      const objectName = path.basename(url);
      await unlink(path.join(LOCAL_DIR, objectName));
      return;
    }
    if (supabaseStorageConfigured() && url.includes(`/${BUCKET}/`)) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      const objectName = url.split(`/${BUCKET}/`).pop();
      if (objectName) await client.storage.from(BUCKET).remove([objectName]);
    }
  } catch {
    // Storage cleanup must never block a menu edit.
  }
}

/**
 * Accepts either an uploaded-file URL produced above or an admin-pasted external URL, rejecting
 * anything that isn't a safe, renderable image reference (blocks javascript:/data: injection).
 */
export function normalizeImageUrl(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
