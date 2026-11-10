import { requireActiveAdmin } from "@/features/auth/queries";

export const instant = false;

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await requireActiveAdmin();
  return <>{children}</>;
}
