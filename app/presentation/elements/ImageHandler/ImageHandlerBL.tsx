import { DateTime } from "luxon";
import type { Area } from "react-easy-crop";
import {
  uploadStorageFile,
  getStoragePublicUrl,
  QUARANTINE_BUCKET,
} from "~/database/Storage";
import { supabase } from "~/database/SupabaseClient";

/*****************************************
 * ModerationFn
 * Optional moderation hook — pass to `uploadImage` to gate uploads through a
 * server-side check. Should resolve to `{ approved: false, reason }` to reject,
 * or `{ approved: true, publicUrl }` to accept and surface the destination URL.
 * Wire to the `moderate-image` edge function in `database/Functions.tsx`.
 */
export type ModerationFn = (args: {
  quarantinePath: string;
  destinationBucket: string;
  destinationPath: string;
}) => Promise<{ approved: boolean; publicUrl?: string; reason?: string }>;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/*****************************************
 * ModerationRejectionError
 * Thrown by uploadImage when the server-side moderation check rejects the file.
 * Callers can distinguish this from generic upload errors to surface the right message.
 */
export class ModerationRejectionError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "ModerationRejectionError";
  }
}


/*****************************************
 * compressImage
 * Resizes and compresses an image file using the Canvas API.
 * Outputs JPEG regardless of input format.
 */
export async function compressImage (
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<File> {
  const { maxWidth, maxHeight, quality = 0.82 } = options ?? {};

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.src = url;
  });
}

/*****************************************
 * validateMimeType
 * Fast client-side check — not a security boundary (the server re-validates
 * magic bytes), but catches accidental wrong-format uploads early.
 */
export function validateMimeType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/*****************************************
 * uploadImage
 * 1. Uploads the file to the private quarantine_images bucket.
 * 2. Invokes the moderate-image edge function which validates MIME/size/SafeSearch
 *    server-side and, on approval, moves the file to the destination bucket.
 * 3. Returns the approved public URL.
 * Throws ModerationRejectionError if the server rejects the image.
 */
export async function uploadImage(
  bucket: string,
  filePath: string,
  file: File,
  moderationFn?: ModerationFn,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  if (!moderationFn) {
    // No moderation requested — upload directly to the destination bucket.
    await uploadStorageFile(bucket, filePath, file, { upsert: true });
    return { url: getStoragePublicUrl(bucket, filePath), path: filePath };
  }

  const quarantinePath = `${session.user.id}/${filePath}`;
  await uploadStorageFile(QUARANTINE_BUCKET, quarantinePath, file);

  const result = await moderationFn({
    quarantinePath,
    destinationBucket: bucket,
    destinationPath: filePath,
  });

  if (!result.approved) {
    throw new ModerationRejectionError(result.reason ?? "Image was rejected");
  }

  return { url: result.publicUrl, path: filePath };
}


/******************
 * Get the public url of a file
 */
export function fetchPublicUrl (
  bucket: string,
  name: string
) {
  return getStoragePublicUrl(bucket, name);
}

export const createImage = (url: string) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

export function getRadianAngle (degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/*****************************************
 * getDefaultCropArea
 * Computes the centred "cover" crop rectangle (in original-image pixel
 * coordinates) for a target aspect ratio, without rendering the cropper.
 * Matches react-easy-crop's default (zoom 1, centred, objectFit cover) so an
 * auto-crop and a manually-unchanged crop produce the same result.
 */
export async function getDefaultCropArea (
  imageSrc: string,
  aspect: number
): Promise<Area> {
  const image = (await createImage(imageSrc)) as HTMLImageElement;
  const { width: W, height: H } = image;

  if (W / H > aspect) {
    const w = H * aspect;
    return { x: (W - w) / 2, y: 0, width: w, height: H };
  }

  const h = W / aspect;
  return { x: 0, y: (H - h) / 2, width: W, height: h };
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize (
  width: number,
  height: number,
  rotation: number
) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) +
      Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) +
      Math.abs(Math.cos(rotRad) * height),
  };
}



/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg (
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = (await createImage(imageSrc)) as HTMLImageElement;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");

  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<File | null>((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], "crop.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}
