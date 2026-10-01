import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { uploadProductImage, validateImage } from "@/lib/storage";

/** Uploads a product image and returns its public URL for storing on Product.images. */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send the image as multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file was received" }, { status: 400 });
  }

  const validated = validateImage(file);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(file, validated.extension);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("[menu/images] upload failed", error);
    return NextResponse.json({ error: "Could not upload the image. Please try again." }, { status: 500 });
  }
}
