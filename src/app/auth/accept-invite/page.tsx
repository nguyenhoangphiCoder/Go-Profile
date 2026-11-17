import type { Metadata } from "next";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata: Metadata = {
  title: "Nhận lời mời | Gờ Cafe",
  robots: { index: false, follow: false },
};

/** Đích của link trong email mời (Supabase inviteUserByEmail, redirectTo). */
export default function AcceptInvitePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50/60">
      <AcceptInviteForm />
    </main>
  );
}
