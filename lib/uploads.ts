import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 20 * 1024 * 1024;

export type StoredMedia = { url: string; width?: number; height?: number; isVideo: boolean; alt?: string };

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
};

/**
 * Stores an uploaded photo/video. Cloudinary is used when CLOUDINARY_URL is
 * configured (4:5 crop + CDN); otherwise development writes into public/uploads.
 */
export async function storeMedia(file: File): Promise<StoredMedia> {
  if (!file.size) throw new Error("Empty file");
  const isVideo = file.type === "video/mp4";
  if (isVideo && file.size > MAX_VIDEO) throw new Error("Video must be 20MB or smaller");
  if (!isVideo && !IMAGE_TYPES.has(file.type)) throw new Error("Use a JPG, PNG, WebP or HEIC photo");
  if (!isVideo && file.size > MAX_IMAGE) throw new Error("Photo must be 8MB or smaller");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (process.env.CLOUDINARY_URL) {
    const upload = await new Promise<{ secure_url: string; width?: number; height?: number }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "resin-by-ash",
            resource_type: isVideo ? "video" : "image",
            ...(isVideo ? {} : { width: 1200, height: 1500, crop: "fill" }),
          },
          (error, result) => (error || !result ? reject(error ?? new Error("Upload failed")) : resolve(result)),
        )
        .end(buffer);
    });
    return { url: upload.secure_url, width: upload.width, height: upload.height, isVideo };
  }

  const ext = EXT[file.type] ?? "bin";
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), ".uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}`, isVideo };
}
