import type { PresensiStatus } from "@/types/db";
import { STATUS_LABEL } from "@/types/db";

export const STATUS_TONE: Record<PresensiStatus, "green" | "red" | "amber" | "blue"> = {
  hadir: "green",
  tidak_hadir: "red",
  izin: "amber",
  sakit: "blue",
};

export const STATUS_COLOR: Record<PresensiStatus, string> = {
  hadir: "#16a34a",
  tidak_hadir: "#dc2626",
  izin: "#d97706",
  sakit: "#2563eb",
};

export function statusLabel(status: PresensiStatus | string | null | undefined): string {
  if (status === "hadir" || status === "tidak_hadir" || status === "izin" || status === "sakit") {
    return STATUS_LABEL[status];
  }
  return "Belum diisi";
}
