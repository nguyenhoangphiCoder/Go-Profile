"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions<T> {
  /** Chỉ bật tự động lưu cho trang đã tồn tại và người dùng có quyền chỉnh sửa. */
  enabled: boolean;
  /** Trạng thái đã có thay đổi chưa lưu trong editor. */
  isDirty: boolean;
  /** Snapshot dữ liệu cần theo dõi (mỗi khi thay đổi sẽ tăng sequence và đặt lại debounce). */
  snapshot: T;
  /** Thời gian chờ sau thao tác cuối (mặc định 2000ms). */
  delayMs?: number;
  /** Hàm thực hiện lưu nháp lên server. */
  onSave: () => Promise<{ ok: boolean; error?: string }>;
  /** Gọi khi auto-save hoàn tất mà không còn thay đổi mới phát sinh trong lúc lưu. */
  onClean?: () => void;
}

export interface UseAutoSaveResult {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  cancel: () => void;
  waitForIdle: () => Promise<void>;
  markSaved: () => void;
  retryNow: () => void;
}

/**
 * Hook tự động lưu nháp an toàn với Optimistic Locking:
 * - Debounce sau lần thao tác cuối (`delayMs`).
 * - Single-flight queue: không bao giờ gửi 2 request lưu nháp song song (tránh DRAFT_CONFLICT_ERROR).
 * - Theo dõi bằng sequence counter: nếu người dùng tiếp tục gõ trong lúc đang lưu,
 *   lượt lưu xong sẽ không xoá nhầm trạng thái dirty mà tự nối tiếp lượt lưu mới.
 * - Tự động flush khi tab chuyển sang nền (`visibilitychange`).
 */
export function useAutoSave<T>({
  enabled,
  isDirty,
  snapshot,
  delayMs = 2000,
  onSave,
  onClean,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const latestSeqRef = useRef(0);
  const savedSeqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  const onSaveRef = useRef(onSave);
  const onCleanRef = useRef(onClean);

  useEffect(() => {
    enabledRef.current = enabled;
    onSaveRef.current = onSave;
    onCleanRef.current = onClean;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runSaveLoop = useCallback(async () => {
    if (!enabledRef.current) return;
    if (inFlightRef.current) return;
    if (latestSeqRef.current <= savedSeqRef.current) return;

    const promise = (async () => {
      while (
        mountedRef.current &&
        enabledRef.current &&
        latestSeqRef.current > savedSeqRef.current
      ) {
        const targetSeq = latestSeqRef.current;
        setStatus("saving");
        setErrorMessage(null);

        try {
          const res = await onSaveRef.current();
          if (!mountedRef.current) return;

          if (res.ok) {
            savedSeqRef.current = targetSeq;
            if (latestSeqRef.current === targetSeq) {
              setStatus("saved");
              setLastSavedAt(new Date());
              setErrorMessage(null);
              onCleanRef.current?.();
              break;
            }
            // Người dùng đã tiếp tục chỉnh sửa trong lúc đang lưu -> vòng lặp chạy nối tiếp
          } else {
            setStatus("error");
            setErrorMessage(res.error || "Không thể tự động lưu nháp");
            break;
          }
        } catch {
          if (!mountedRef.current) return;
          setStatus("error");
          setErrorMessage("Mất kết nối khi tự động lưu nháp");
          break;
        }
      }
    })();

    inFlightRef.current = promise;
    try {
      await promise;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    cancel();
    if (!enabledRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSaveLoop();
    }, delayMs);
  }, [cancel, delayMs, runSaveLoop]);

  // Mỗi lần snapshot thay đổi khi đang dirty -> tăng sequence & đặt lại debounce
  useEffect(() => {
    if (!enabled || !isDirty) return;
    latestSeqRef.current += 1;
    if (!inFlightRef.current) {
      setStatus("dirty");
    }
    schedule();
  }, [enabled, isDirty, snapshot, schedule]);

  // Nếu người dùng chuyển sang tab khác hoặc thu nhỏ trình duyệt khi còn thay đổi -> lưu ngay
  useEffect(() => {
    if (!enabled) return;
    const onVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        latestSeqRef.current > savedSeqRef.current &&
        !inFlightRef.current
      ) {
        cancel();
        void runSaveLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled, cancel, runSaveLoop]);

  const waitForIdle = useCallback(async () => {
    cancel();
    if (inFlightRef.current) {
      await inFlightRef.current;
    }
  }, [cancel]);

  const markSaved = useCallback(() => {
    cancel();
    savedSeqRef.current = latestSeqRef.current;
    setStatus("saved");
    setLastSavedAt(new Date());
    setErrorMessage(null);
  }, [cancel]);

  const retryNow = useCallback(() => {
    cancel();
    if (latestSeqRef.current <= savedSeqRef.current) {
      latestSeqRef.current += 1;
    }
    void runSaveLoop();
  }, [cancel, runSaveLoop]);

  return {
    status,
    lastSavedAt,
    errorMessage,
    cancel,
    waitForIdle,
    markSaved,
    retryNow,
  };
}
