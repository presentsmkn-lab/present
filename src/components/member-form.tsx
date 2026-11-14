import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { MemberWithJurusan } from "@/types/db";

export function MemberForm({
  action,
  extraId,
  jurusan,
  member,
  joinedAt,
  submitLabel = "Simpan Anggota",
}: {
  action: (formData: FormData) => void | Promise<void>;
  extraId: string;
  jurusan: Array<{ id: string; kode: string; nama_panjang: string }>;
  member?: MemberWithJurusan | null;
  joinedAt?: string;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="extra_id" value={extraId} />
      {member ? <input type="hidden" name="id" value={member.id} /> : null}

      <div className="field-grid">
        <Field label="NIS" htmlFor="nis">
          <input
            id="nis"
            name="nis"
            className="input"
            defaultValue={member?.nis ?? ""}
            required
            minLength={2}
            maxLength={30}
            placeholder="Contoh: 2024001"
            inputMode="text"
            autoCapitalize="none"
          />
        </Field>
        <Field label="Nama Lengkap" htmlFor="nama_lengkap">
          <input
            id="nama_lengkap"
            name="nama_lengkap"
            className="input"
            defaultValue={member?.nama_lengkap ?? ""}
            required
            maxLength={120}
            placeholder="Nama lengkap siswa"
            autoComplete="name"
          />
        </Field>
        <Field label="Rombel" htmlFor="rombel" hint="Bebas diisi, contoh: 1, 2, 3.">
          <input
            id="rombel"
            name="rombel"
            className="input"
            defaultValue={member?.rombel ?? ""}
            required
            maxLength={20}
            placeholder="Contoh: 1"
          />
        </Field>
        <Field label="Kelas" htmlFor="kelas">
          <select id="kelas" name="kelas" className="input" defaultValue={member?.kelas ?? "X"} required>
            <option value="X">X</option>
            <option value="XI">XI</option>
            <option value="XII">XII</option>
          </select>
        </Field>
        <Field label="Jurusan" htmlFor="jurusan_id">
          <select
            id="jurusan_id"
            name="jurusan_id"
            className="input"
            defaultValue={member?.jurusan_id ?? ""}
            required
          >
            <option value="" disabled>
              Pilih jurusan
            </option>
            {jurusan.map((j) => (
              <option key={j.id} value={j.id}>
                {j.kode} — {j.nama_panjang}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bergabung sejak" htmlFor="joined_at" hint="Opsional, default hari ini.">
          <input
            id="joined_at"
            name="joined_at"
            type="date"
            className="input"
            defaultValue={joinedAt ?? member?.joined_extra_at ?? ""}
          />
        </Field>
      </div>

      <SubmitButton className="w-full">{submitLabel}</SubmitButton>
    </form>
  );
}
