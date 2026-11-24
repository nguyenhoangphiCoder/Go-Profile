import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { PLAN_LABELS, type WorkspacePlan } from "@/features/workspace/types";

interface FeatureLockedNoticeProps {
  title: string;
  message: string;
  workspaceName: string;
  plan: WorkspacePlan;
}

export function FeatureLockedNotice({
  title,
  message,
  workspaceName,
  plan,
}: FeatureLockedNoticeProps) {
  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="p-8 rounded-2xl border border-border bg-card shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
          <span>Workspace: <strong className="text-foreground">{workspaceName}</strong></span>
          <span>·</span>
          <span>Gói: <strong className="text-foreground">{PLAN_LABELS[plan]}</strong></span>
        </div>
        <p className="text-xs text-muted-foreground">
          Liên hệ <strong>SuperAdmin</strong> để bật tính năng này hoặc nâng cấp gói cho Workspace.
        </p>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay về Bảng điều khiển
          </Link>
        </div>
      </div>
    </div>
  );
}
