-- ============================================================================
-- Pencatatan Ekstrakurikuler SMKN 10 Semarang
-- Migration awal: skema, index, RLS, storage bucket
-- Jalankan di Supabase SQL Editor (atau `supabase db push`).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper: updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pics (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  nama_lengkap text not null,
  password_encrypted text not null,
  foto_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jurusan (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama_panjang text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extrakurikuler (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Riwayat hari latihan. Baris lama TIDAK diubah saat jadwal diganti.
-- Jadwal yang berlaku pada suatu tanggal = kelompok baris dengan
-- berlaku_mulai terbesar yang <= tanggal.
create table if not exists public.extra_hari_jadwal (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extrakurikuler(id) on delete cascade,
  hari text not null check (hari in ('senin', 'selasa', 'rabu', 'kamis', 'jumat')),
  berlaku_mulai date not null,
  created_at timestamptz not null default now(),
  unique (extra_id, hari, berlaku_mulai)
);

create table if not exists public.pic_extra (
  id uuid primary key default gen_random_uuid(),
  pic_id uuid not null references public.pics(id) on delete cascade,
  extra_id uuid not null references public.extrakurikuler(id) on delete cascade,
  peran text not null check (peran in ('utama', 'asisten')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pic_id, extra_id)
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  tahun_ajaran text not null check (tahun_ajaran ~ '^\d{4}/\d{4}$'),
  semester_ke smallint not null check (semester_ke in (1, 2)),
  tanggal_mulai date,
  tanggal_selesai date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint semesters_tanggal_valid check (
    tanggal_selesai is null
    or tanggal_mulai is null
    or tanggal_selesai >= tanggal_mulai
  ),
  unique (tahun_ajaran, semester_ke)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  nama_lengkap text not null,
  rombel text not null,
  kelas text not null check (kelas in ('X', 'XI', 'XII', 'LULUS')),
  jurusan_id uuid references public.jurusan(id) on delete restrict,
  status text not null default 'aktif' check (status in ('aktif', 'lulus', 'keluar')),
  joined_at date not null default current_date,
  lulus_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_extra (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  extra_id uuid not null references public.extrakurikuler(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  joined_at date not null default current_date,
  status text not null default 'aktif' check (status in ('aktif', 'keluar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, extra_id, semester_id)
);

create table if not exists public.libur (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extrakurikuler(id) on delete cascade,
  tanggal date not null,
  alasan text not null,
  created_at timestamptz not null default now(),
  unique (extra_id, tanggal)
);

create table if not exists public.pertemuan (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extrakurikuler(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  tanggal date not null,
  created_at timestamptz not null default now(),
  unique (extra_id, tanggal)
);

create table if not exists public.presensi (
  id uuid primary key default gen_random_uuid(),
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null check (status in ('hadir', 'tidak_hadir', 'izin', 'sakit')),
  updated_by text not null,
  updated_at timestamptz not null default now(),
  unique (pertemuan_id, member_id)
);

create table if not exists public.presensi_log (
  id uuid primary key default gen_random_uuid(),
  presensi_id uuid not null references public.presensi(id) on delete cascade,
  status_lama text,
  status_baru text not null,
  diubah_oleh text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.kenaikan_jadwal (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.kenaikan_log (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  dari_kelas text not null,
  ke_kelas text not null,
  member_id uuid references public.members(id) on delete set null,
  member_nis text,
  member_nama text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------
create index if not exists idx_pics_nis on public.pics (nis);
create index if not exists idx_pic_extra_pic on public.pic_extra (pic_id);
create index if not exists idx_pic_extra_extra on public.pic_extra (extra_id);
create index if not exists idx_extra_hari_extra on public.extra_hari_jadwal (extra_id, berlaku_mulai desc);
create index if not exists idx_members_nis on public.members (nis);
create index if not exists idx_members_status_lulus on public.members (status, lulus_at);
create index if not exists idx_member_extra_extra on public.member_extra (extra_id);
create index if not exists idx_member_extra_semester on public.member_extra (semester_id);
create index if not exists idx_member_extra_member on public.member_extra (member_id);
create index if not exists idx_pertemuan_extra on public.pertemuan (extra_id);
create index if not exists idx_pertemuan_semester on public.pertemuan (semester_id);
create index if not exists idx_pertemuan_tanggal on public.pertemuan (tanggal);
create index if not exists idx_presensi_pertemuan on public.presensi (pertemuan_id);
create index if not exists idx_presensi_member on public.presensi (member_id);
create index if not exists idx_presensi_log_presensi on public.presensi_log (presensi_id, created_at desc);
create index if not exists idx_libur_extra_tanggal on public.libur (extra_id, tanggal);
create index if not exists idx_semesters_aktif on public.semesters (is_active);
create index if not exists idx_kenaikan_log_tanggal on public.kenaikan_log (tanggal);
create index if not exists idx_kenaikan_log_member on public.kenaikan_log (member_id);

-- Hanya boleh ada satu semester aktif.
create unique index if not exists uniq_semester_aktif
  on public.semesters (is_active) where is_active = true;

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists trg_admins_updated on public.admins;
create trigger trg_admins_updated before update on public.admins
for each row execute function public.set_updated_at();

drop trigger if exists trg_pics_updated on public.pics;
create trigger trg_pics_updated before update on public.pics
for each row execute function public.set_updated_at();

drop trigger if exists trg_jurusan_updated on public.jurusan;
create trigger trg_jurusan_updated before update on public.jurusan
for each row execute function public.set_updated_at();

drop trigger if exists trg_extra_updated on public.extrakurikuler;
create trigger trg_extra_updated before update on public.extrakurikuler
for each row execute function public.set_updated_at();

drop trigger if exists trg_pic_extra_updated on public.pic_extra;
create trigger trg_pic_extra_updated before update on public.pic_extra
for each row execute function public.set_updated_at();

drop trigger if exists trg_semesters_updated on public.semesters;
create trigger trg_semesters_updated before update on public.semesters
for each row execute function public.set_updated_at();

drop trigger if exists trg_members_updated on public.members;
create trigger trg_members_updated before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists trg_member_extra_updated on public.member_extra;
create trigger trg_member_extra_updated before update on public.member_extra
for each row execute function public.set_updated_at();

drop trigger if exists trg_app_settings_updated on public.app_settings;
create trigger trg_app_settings_updated before update on public.app_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: aktif di semua tabel, TIDAK ada policy untuk anon.
-- Semua akses aplikasi memakai service role key dari server (bypass RLS).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'admins', 'pics', 'jurusan', 'extrakurikuler', 'extra_hari_jadwal',
    'pic_extra', 'semesters', 'members', 'member_extra', 'libur',
    'pertemuan', 'presensi', 'presensi_log', 'kenaikan_jadwal',
    'kenaikan_log', 'app_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket "branding" (public read, tulis hanya lewat service role)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read"
  on storage.objects for select
  using (bucket_id = 'branding');

-- Tidak ada policy insert/update/delete untuk anon/authenticated.
-- Server memakai service role yang melewati RLS.

-- ---------------------------------------------------------------------------
-- Nilai awal pengaturan
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('logo_sekolah_url', ''),
  ('logo_pembuat_url', ''),
  ('link_pembuat', ''),
  ('nama_pembuat', ''),
  ('kenaikan_selesai', '')
on conflict (key) do nothing;
