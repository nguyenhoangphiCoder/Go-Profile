"use client";

import { useEffect, useState } from "react";
import { History, Loader2, RotateCcw, X, CheckCircle2 } from "lucide-react";
import {
  listPageRevisionsAction,
  restoreRevisionToDraftAction,
  type PageRevisionSummary,
} from "../../actions";

interface RevisionHistoryModalProps {
  open: boolean;
  pageId: string;
  canEdit: boolean;
  onClose: () => void;
  onRestored: () => void;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function RevisionHistoryModal({
  open,
  pageId,
  canEdit,
  onClose,
  onRestored,
}: RevisionHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<PageRevisionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await listPageRevisionsAction(pageId);
      if (cancelled) return;
      setLoading(false);
      if (res.success) {
        setRevisions(res.revisions);
      } else {
        setError(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, pageId]);

  if (!open) return null;

  const handleRestore = async (revId: string) => {
    setRestoringId(revId);
    setError(null);
    const res = await restoreRevisionToDraftAction(pageId, revId);
    setRestoringId(null);
    if (!res.success) {
      setError(res.error);
      return;
    }
    onRestored();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Lịch sử phiên bản"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Lịch sử phiên bản đã xuất bản</h2>
              <p className="text-[11px] text-muted-foreground">
                Khôi phục sẽ nạp nội dung cũ về bản nháp (chưa ảnh hưởng trang thật cho tới khi bạn
                bấm Xuất bản).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải lịch sử phiên bản...</span>
            </div>
          ) : revisions.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Trang này chưa có phiên bản nào được xuất bản trước đó.
            </div>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Phiên bản #{rev.revisionNo}
                    </span>
                    {rev.isPublished && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Đang chạy
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground/85 truncate">{rev.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Xuất bản: {formatTime(rev.sealedAt || rev.createdAt)} • {rev.blocksCount} khối
                  </div>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    disabled={restoringId !== null}
                    onClick={() => handleRestore(rev.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {restoringId === rev.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>Khôi phục</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
