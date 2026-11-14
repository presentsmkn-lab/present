export type Role = "admin" | "pic";

export type Session = {
  kind: Role;
  id: string;
  nama: string;
  username?: string;
  nis?: string;
};

export type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
};

export type PicRow = {
  id: string;
  nis: string;
  nama_lengkap: string;
  password_encrypted: string;
  foto_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type JurusanRow = {
  id: string;
  kode: string;
  nama_panjang: string;
  created_at?: string;
};

export type ExtraRow = {
  id: string;
  nama: string;
  created_at: string;
  updated_at?: string;
};

export type PicExtraRow = {
  id: string;
  pic_id: string;
  extra_id: string;
  peran: "utama" | "asisten";
};

export type SemesterRow = {
  id: string;
  tahun_ajaran: string;
  semester_ke: 1 | 2;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  is_active: boolean;
  created_at: string;
};

export type MemberRow = {
  id: string;
  nis: string;
  nama_lengkap: string;
  rombel: string;
  kelas: "X" | "XI" | "XII" | "LULUS";
  jurusan_id: string | null;
  status: "aktif" | "lulus" | "keluar";
  joined_at: string;
  lulus_at: string | null;
  created_at: string;
};

export type MemberExtraRow = {
  id: string;
  member_id: string;
  extra_id: string;
  semester_id: string;
  joined_at: string;
  status: "aktif" | "keluar";
};

export type PresensiStatus = "hadir" | "tidak_hadir" | "izin" | "sakit";

export type PresensiRow = {
  id: string;
  pertemuan_id: string;
  member_id: string;
  status: PresensiStatus;
  updated_by: string;
  updated_at: string;
};

export type PertemuanRow = {
  id: string;
  extra_id: string;
  semester_id: string;
  tanggal: string;
  created_at: string;
};

export type LiburRow = {
  id: string;
  extra_id: string;
  tanggal: string;
  alasan: string;
};

export type JadwalRow = {
  id: string;
  extra_id: string;
  hari: "senin" | "selasa" | "rabu" | "kamis" | "jumat";
  berlaku_mulai: string;
};

export type AppSettings = Record<string, string>;

export type MemberWithJurusan = MemberRow & {
  jurusan: Pick<JurusanRow, "kode" | "nama_panjang"> | null;
  member_extra_status?: "aktif" | "keluar";
  joined_extra_at?: string;
};

export const STATUS_LABEL: Record<PresensiStatus, string> = {
  hadir: "Hadir",
  tidak_hadir: "Tidak Hadir",
  izin: "Izin",
  sakit: "Sakit",
};

export const HARI = ["senin", "selasa", "rabu", "kamis", "jumat"] as const;
export type Hari = (typeof HARI)[number];
export const HARI_LABEL: Record<Hari, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};
