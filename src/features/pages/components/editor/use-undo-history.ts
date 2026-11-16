"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UndoHistoryOptions {
  /** Số bước tối đa được lưu. */
  limit?: number;
  /** Gom các thay đổi liên tiếp trong khoảng thời gian này thành một bước (ví dụ khi đang gõ). */
  debounceMs?: number;
}

/**
 * Lịch sử hoàn tác / làm lại cho một giá trị trạng thái bất biến (immutable snapshot).
 *
 * Hook tự theo dõi `state`: mỗi khi snapshot đổi (so sánh tham chiếu) và đứng yên quá
 * `debounceMs`, trạng thái trước đó được đẩy vào lịch sử. Khi hoàn tác, hook gọi `apply`
 * để component khôi phục trạng thái và bỏ qua lần thay đổi do chính nó gây ra.
 */
export function useUndoHistory<T>(
  state: T,
  apply: (snapshot: T) => void,
  { limit = 50, debounceMs = 500 }: UndoHistoryOptions = {}
) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const committed = useRef<T>(state);
  const pending = useRef<T | null>(null);
  const skipNext = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyRef = useRef(apply);
  const [counts, setCounts] = useState({ past: 0, future: 0 });
  const bump = () => setCounts({ past: past.current.length, future: future.current.length });

  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const next = pending.current;
    pending.current = null;
    if (next === null || next === committed.current) return;
    past.current.push(committed.current);
    if (past.current.length > limit) past.current.shift();
    future.current = [];
    committed.current = next;
    bump();
  }, [limit]);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      committed.current = state;
      return;
    }
    if (state === committed.current) return;
    pending.current = state;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, debounceMs);
  }, [state, debounceMs, flush]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const undo = useCallback(() => {
    flush();
    const previous = past.current.pop();
    if (previous === undefined) return;
    future.current.push(committed.current);
    committed.current = previous;
    skipNext.current = true;
    applyRef.current(previous);
    bump();
  }, [flush]);

  const redo = useCallback(() => {
    flush();
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(committed.current);
    committed.current = next;
    skipNext.current = true;
    applyRef.current(next);
    bump();
  }, [flush]);

  return {
    undo,
    redo,
    canUndo: counts.past > 0,
    canRedo: counts.future > 0,
  };
}
