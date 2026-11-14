import "server-only";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { db } from "@/lib/supabase";
import { getStats } from "@/lib/queries/stats";
import { formatTanggal, todayISO } from "@/lib/date";
import { slugify, truncate } from "@/lib/utils";
import type { ExtraRow, PresensiStatus, SemesterRow } from "@/types/db";

const NAVY = "FF0B1F3A";
const BLUE = "FF1D4ED8";
const LIGHT = "FFEFF4FF";

const STATUS_COLORS: Record<PresensiStatus, string> = {
  hadir: "#16a34a",
  tidak_hadir: "#dc2626",
  izin: "#d97706",
  sakit: "#2563eb",
};
const STATUS_LABELS: Record<PresensiStatus, string> = {
  hadir: "Hadir",
  tidak_hadir: "Tidak Hadir",
  izin: "Izin",
  sakit: "Sakit",
};

const imageCache = new Map<string, Buffer>();

function svgEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function piePath(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function pieSvg(values: Record<PresensiStatus, number>): string {
  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const cx = 130;
  const cy = 135;
  const r = 92;
  let angle = -Math.PI / 2;
  let slices = "";
  if (total === 0) {
    slices = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e2e8f0" />`;
  } else {
    for (const status of Object.keys(STATUS_COLORS) as PresensiStatus[]) {
      const value = values[status];
      if (value <= 0) continue;
      const sweep = (value / total) * Math.PI * 2;
      slices += `<path d="${piePath(cx, cy, r, angle, angle + sweep)}" fill="${STATUS_COLORS[status]}" stroke="#ffffff" stroke-width="2" />`;
      angle += sweep;
    }
  }
  const legend = (Object.keys(STATUS_COLORS) as PresensiStatus[])
    .map((status, i) => {
      const y = 52 + i * 34;
      const pct = total > 0 ? Math.round((values[status] / total) * 100) : 0;
      return `<rect x="270" y="${y - 13}" width="16" height="16" rx="3" fill="${STATUS_COLORS[status]}" />
        <text x="294" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#0f172a">${STATUS_LABELS[status]}</text>
        <text x="438" y="${y}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${values[status]} (${pct}%)</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="280" viewBox="0 0 460 280">
    <rect width="460" height="280" fill="#ffffff" />
    <text x="20" y="26" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#0b1f3a">Komposisi Presensi</text>
    ${slices}${legend}
  </svg>`;
}

function barSvg(monthly: Array<{ label: string; persentase: number }>): string {
  const data = monthly.slice(-6);
  const width = 460;
  const height = 280;
  const left = 44;
  const bottom = 232;
  const chartWidth = 396;
  const chartHeight = 170;
  const gap = data.length > 0 ? 16 : 0;
  const barWidth = data.length > 0 ? Math.max(18, (chartWidth - gap * (data.length - 1)) / data.length) : 40;
  let bars = "";
  let labels = "";
  data.forEach((item, i) => {
    const x = left + i * (barWidth + gap);
    const barHeight = Math.max(2, (Math.min(100, item.persentase) / 100) * chartHeight);
    bars += `<rect x="${x}" y="${bottom - barHeight}" width="${barWidth}" height="${barHeight}" rx="5" fill="${BLUE}" />`;
    bars += `<text x="${x + barWidth / 2}" y="${bottom - barHeight - 6}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">${item.persentase}%</text>`;
    labels += `<text x="${x + barWidth / 2}" y="${bottom + 22}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#334155">${svgEscape(truncate(item.label, 12))}</text>`;
  });
  const grid = [0, 25, 50, 75, 100]
    .map((v) => {
      const y = bottom - (v / 100) * chartHeight;
      return `<line x1="${left}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${left - 8}" y="${y + 4}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#64748b">${v}%</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <text x="20" y="26" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#0b1f3a">Kehadiran per Bulan</text>
    ${grid}${bars}${labels}
  </svg>`;
}

async function renderSvg(svg: string): Promise<Buffer> {
  const cached = imageCache.get(svg);
  if (cached) return cached;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  imageCache.set(svg, buffer);
  return buffer;
}

function sheetName(extraName: string, semester: SemesterRow, used: Set<string>): string {
  const base = `${extraName} ${semester.tahun_ajaran.replace("/", "-")} S${semester.semester_ke}`
    .replace(/[\\/?*[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let name = truncate(base, 31);
  let i = 2;
  while (used.has(name)) {
    const suffix = ` (${i})`;
    name = `${truncate(base, 31 - suffix.length)}${suffix}`;
    i += 1;
  }
  used.add(name);
  return name;
}

async function semestersWithData(extraId: string, all: SemesterRow[]): Promise<SemesterRow[]> {
  const [{ data: me }, { data: pt }] = await Promise.all([
    db().from("member_extra").select("semester_id").eq("extra_id", extraId),
    db().from("pertemuan").select("semester_id").eq("extra_id", extraId),
  ]);
  const used = new Set<string>([
    ...((me ?? []) as Array<{ semester_id: string }>).map((r) => r.semester_id),
    ...((pt ?? []) as Array<{ semester_id: string }>).map((r) => r.semester_id),
  ]);
  const filtered = all.filter((s) => used.has(s.id));
  if (filtered.length > 0) return filtered;
  return all.filter((s) => s.is_active);
}

function styleSheet(sheet: ExcelJS.Worksheet, extraName: string, semester: SemesterRow): number {
  sheet.columns = [
    { key: "nama", width: 30 },
    { key: "nis", width: 14 },
    { key: "kelas", width: 8 },
    { key: "rombel", width: 9 },
    { key: "jurusan", width: 11 },
    { key: "hadir", width: 12 },
    { key: "tidak", width: 14 },
    { key: "izin", width: 8 },
    { key: "sakit", width: 8 },
    { key: "persen", width: 15 },
  ];
  sheet.mergeCells("A1:J1");
  const title = sheet.getCell("A1");
  title.value = "PENCATATAN EKSTRAKURIKULER — SMKN 10 SEMARANG";
  title.font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  title.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 30;

  sheet.mergeCells("A2:J2");
  const subtitle = sheet.getCell("A2");
  subtitle.value = `${extraName} • ${semester.tahun_ajaran} • Semester ${semester.semester_ke}`;
  subtitle.font = { bold: true, size: 12, color: { argb: NAVY } };
  subtitle.alignment = { vertical: "middle" };

  sheet.mergeCells("A3:J3");
  const generated = sheet.getCell("A3");
  generated.value = `Diekspor ${formatTanggal(todayISO())}`;
  generated.font = { size: 10, color: { argb: "FF64748B" } };

  const header = sheet.getRow(4);
  header.values = [
    "Nama Lengkap",
    "NIS",
    "Kelas",
    "Rombel",
    "Jurusan",
    "Jumlah Hadir",
    "Jumlah Tidak Hadir",
    "Izin",
    "Sakit",
    "Persentase Kehadiran",
  ];
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 30;
  sheet.autoFilter = "A4:J4";
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1 };
  return 5;
}

export type ExportInput = {
  extras: ExtraRow[];
  semesters: SemesterRow[];
  activeSemester: SemesterRow | null;
};

export async function buildWorkbook(input: ExportInput): Promise<{ buffer: Buffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Pencatatan Ekstrakurikuler SMKN 10 Semarang";
  workbook.created = new Date();
  const usedNames = new Set<string>();

  for (const extra of input.extras) {
    const semesters = await semestersWithData(extra.id, input.semesters);
    const fallback = input.activeSemester ?? input.semesters[input.semesters.length - 1] ?? null;
    const list = semesters.length > 0 ? semesters : fallback ? [fallback] : [];

    for (const semester of list) {
      const sheet = workbook.addWorksheet(sheetName(extra.nama, semester, usedNames));
      let rowIndex = styleSheet(sheet, extra.nama, semester);
      const stats = await getStats(extra.id, [semester]);

      if (stats.students.length === 0) {
        const row = sheet.getRow(rowIndex);
        row.getCell(1).value = "Belum ada anggota pada semester ini.";
        row.getCell(1).font = { italic: true, color: { argb: "FF64748B" } };
        rowIndex += 1;
      }

      stats.students.forEach((student, i) => {
        const row = sheet.getRow(rowIndex + i);
        row.values = [
          student.nama_lengkap,
          student.nis,
          student.kelas,
          student.rombel,
          student.jurusan,
          student.hadir,
          student.tidak_hadir,
          student.izin,
          student.sakit,
          student.persentase / 100,
        ];
        row.getCell(10).numFmt = "0.0%";
        row.alignment = { vertical: "middle" };
        if (i % 2 === 1) {
          for (let c = 1; c <= 10; c++) {
            row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
          }
        }
        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          if (col >= 6) cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      });

      const summaryRow = rowIndex + stats.students.length + 1;
      sheet.getCell(`A${summaryRow}`).value = "Rata-rata kehadiran";
      sheet.getCell(`A${summaryRow}`).font = { bold: true };
      sheet.getCell(`J${summaryRow}`).value = stats.averageAttendance / 100;
      sheet.getCell(`J${summaryRow}`).numFmt = "0.0%";
      sheet.getCell(`J${summaryRow}`).font = { bold: true, color: { argb: "FF16A34A" } };
      sheet.getCell(`F${summaryRow}`).value = `${stats.totalMeetings} pertemuan`;
      sheet.getCell(`F${summaryRow}`).font = { bold: true };

      try {
        const pie = await renderSvg(pieSvg(stats.composition));
        const bar = await renderSvg(
          barSvg(stats.monthly.map((m) => ({ label: m.label, persentase: m.persentase }))),
        );
        const pieId = workbook.addImage({
          buffer: pie as unknown as NonNullable<ExcelJS.Image["buffer"]>,
          extension: "png",
        });
        const barId = workbook.addImage({
          buffer: bar as unknown as NonNullable<ExcelJS.Image["buffer"]>,
          extension: "png",
        });
        sheet.addImage(pieId, {
          tl: { col: 11.2, row: 3.4 },
          ext: { width: 420, height: 256 },
          editAs: "oneCell",
        });
        sheet.addImage(barId, {
          tl: { col: 11.2, row: 16.5 },
          ext: { width: 420, height: 256 },
          editAs: "oneCell",
        });
      } catch {
        // Grafik gagal dirender tidak boleh menggagalkan export data.
      }
    }
  }

  if (workbook.worksheets.length === 0) {
    const sheet = workbook.addWorksheet("Data");
    sheet.getCell("A1").value = "Belum ada data untuk diekspor.";
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, filename: exportFilename(input) };
}

export function exportFilename(input: ExportInput): string {
  const semester = input.activeSemester ?? input.semesters[input.semesters.length - 1] ?? null;
  const suffix = semester
    ? `${semester.tahun_ajaran.replace("/", "-")}_Sem${semester.semester_ke}`
    : "Tanpa-Semester";
  if (input.extras.length === 1) {
    return `Ekstrakurikuler_${slugify(input.extras[0].nama)}_${suffix}.xlsx`;
  }
  return `Ekstrakurikuler_Semua_${suffix}.xlsx`;
}
