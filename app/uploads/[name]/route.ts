import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
};

/** Serves locally uploaded catalogue media (Cloudinary is used when configured). */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|heic|heif|mp4)$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const file = await readFile(path.join(process.cwd(), ".uploads", name));
    return new NextResponse(file, {
      headers: {
        "content-type": TYPES[name.split(".").pop()!] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
