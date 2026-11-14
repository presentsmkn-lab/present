-- Menambahkan periode tanggal pada semester.
-- Kolom nullable agar semester lama tetap valid; admin dapat mengisinya
-- melalui halaman Kelola Semester.

alter table public.semesters
  add column if not exists tanggal_mulai date,
  add column if not exists tanggal_selesai date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'semesters_tanggal_valid'
      and conrelid = 'public.semesters'::regclass
  ) then
    alter table public.semesters
      add constraint semesters_tanggal_valid
      check (
        tanggal_selesai is null
        or tanggal_mulai is null
        or tanggal_selesai >= tanggal_mulai
      );
  end if;
end $$;

-- Isi tanggal bawaan untuk semester yang sudah ada agar langsung tampil
-- di halaman Kelola Semester. Admin tetap dapat mengubahnya.
update public.semesters
set
  tanggal_mulai = coalesce(
    tanggal_mulai,
    make_date(
      substring(tahun_ajaran from 1 for 4)::int,
      case when semester_ke = 1 then 7 else 1 end,
      1
    )
  ),
  tanggal_selesai = coalesce(
    tanggal_selesai,
    make_date(
      substring(tahun_ajaran from 1 for 4)::int
        + case when semester_ke = 2 then 1 else 0 end,
      case when semester_ke = 1 then 12 else 6 end,
      case when semester_ke = 1 then 31 else 30 end
    )
  )
where tanggal_mulai is null or tanggal_selesai is null;
