import { requirePic } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function PicLayout({ children }: { children: React.ReactNode }) {
  await requirePic();
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
