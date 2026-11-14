import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { decryptPassword } from "@/lib/auth/password";
import { resetPicPasswordAction, updatePicAction } from "@/actions/admin";
import { Avatar, Badge, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { PasswordReveal } from "@/components/password-reveal";
import { SubmitButton } from "@/components/submit-button";
import { ArrowRightIcon, LockIcon } from "@/components/icons";
import type { PicRow } from "@/types/db";

export const metadata = { title: "Detail PIC" };

export default async function DetailPicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: picData }, { data: assignments }] = await Promise.all([
    db().from("pics").select("*").eq("id", id).maybeSingle(),
    db()
      .from("pic_extra")
      .select("peran, extra:extrakurikuler(id, nama)")
      .eq("pic_id", id),
  ]);
  const pic = picData as PicRow | null;
  if (!pic) notFound();

  let password = "";
  try {
    password = decryptPassword(pic.password_encrypted);
  } catch {
    password = "(tidak dapat didekripsi)";
  }
  const extras = ((assignments ?? []) as unknown as Array<{
    peran: "utama" | "asisten";
    extra: { id: string; nama: string } | Array<{ id: string; nama: string }> | null;
  }>).map((row) => ({
    peran: row.peran,
    extra: (Array.isArray(row.extra) ? row.extra[0] : row.extra) as { id: string; nama: string } | null,
  }));

  return (
    <main className="page">
      <PageHeader title="Detail PIC" subtitle={pic.nama_lengkap} back="/admin/pic" />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-4">
        <div className="flex items-center gap-3">
          <Avatar name={pic.nama_lengkap} src={pic.foto_url} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{pic.nama_lengkap}</p>
            <p className="muted text-xs">NIS {pic.nis}</p>
          </div>
          <Badge tone={pic.is_active ? "green" : "red"}>{pic.is_active ? "Aktif" : "Nonaktif"}</Badge>
        </div>

        <div className="mt-4">
          <p className="label flex items-center gap-1.5">
            <LockIcon size={14} /> Password PIC saat ini
          </p>
          <PasswordReveal value={password} />
          <p className="muted mt-1 text-[11px]">
            Hanya admin yang dapat melihat halaman ini. Password disimpan terenkripsi, bukan teks
            biasa.
          </p>
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Edit data PIC</h2>
        <form action={updatePicAction} className="space-y-3">
          <input type="hidden" name="id" value={pic.id} />
          <Field label="NIS" htmlFor="nis">
            <input id="nis" name="nis" className="input" defaultValue={pic.nis} required />
          </Field>
          <Field label="Nama lengkap" htmlFor="nama">
            <input id="nama" name="nama" className="input" defaultValue={pic.nama_lengkap} required />
          </Field>
          <Field label="Password baru (opsional)" htmlFor="password" hint="Kosongkan jika tidak ingin mengganti.">
            <input
              id="password"
              name="password"
              type="text"
              className="input"
              placeholder="Biarkan kosong"
              minLength={6}
              autoComplete="off"
            />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={pic.is_active}
              className="h-5 w-5 rounded border-slate-300 accent-navy-800"
            />
            Akun aktif (dapat login)
          </label>
          <SubmitButton className="w-full">Simpan Perubahan</SubmitButton>
        </form>
      </section>

      <section className="card mt-4">
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Reset password</h2>
        <form action={resetPicPasswordAction} className="space-y-3">
          <input type="hidden" name="id" value={pic.id} />
          <Field label="Password baru" htmlFor="reset_password">
            <input
              id="reset_password"
              name="password"
              type="text"
              className="input"
              minLength={6}
              required
              placeholder="Minimal 6 karakter"
              autoComplete="off"
            />
          </Field>
          <SubmitButton variant="secondary" className="w-full">
            Reset Password
          </SubmitButton>
        </form>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ekstrakurikuler yang dikelola
        </h2>
        {extras.length === 0 ? (
          <p className="muted text-sm">Belum ditugaskan ke ekstrakurikuler mana pun.</p>
        ) : (
          <div className="space-y-2">
            {extras.map((row) =>
              row.extra ? (
                <Link
                  key={row.extra.id}
                  href={`/admin/ekstrakurikuler/${row.extra.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
                >
                  <span className="flex-1 text-sm font-medium">{row.extra.nama}</span>
                  <Badge tone={row.peran === "utama" ? "navy" : "blue"}>
                    {row.peran === "utama" ? "PIC Utama" : "Asisten"}
                  </Badge>
                  <ArrowRightIcon size={16} className="text-slate-400" />
                </Link>
              ) : null,
            )}
          </div>
        )}
      </section>
    </main>
  );
}
