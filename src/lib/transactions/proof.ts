// Helper unggah bukti transaksi (dipakai sisi klien).

export const BUKTI_BUCKET = "bukti";
export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/** Validasi tipe & ukuran. Kembalikan pesan error atau null bila valid. */
export function validateProofFile(file: File): string | null {
  if (!ALLOWED_PROOF_TYPES.includes(file.type as (typeof ALLOWED_PROOF_TYPES)[number])) {
    return "Tipe file harus JPG, PNG, WEBP, atau PDF.";
  }
  if (file.size > MAX_PROOF_BYTES) {
    return "Ukuran file maksimal 5MB.";
  }
  return null;
}

export function extForFile(file: File): string {
  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

/** Path objek storage: {department_id}/{transaction_id}/bukti.{ext} */
export function proofPath(
  departmentId: string,
  transactionId: string,
  ext: string,
): string {
  return `${departmentId}/${transactionId}/bukti.${ext}`;
}

/**
 * Kompres/perkecil gambar di klien (best-effort). PDF & non-gambar dikembalikan
 * apa adanya; jika gagal, kembalikan file asli.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size <= MAX_PROOF_BYTES) return file;

    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}
