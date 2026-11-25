"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  HelpCircle,
  Keyboard,
  Layers,
  Lightbulb,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  BLOCK_CATALOG,
  EDITOR_SHORTCUTS,
  FAQ_ITEMS,
  MENU_GUIDES,
  QUICK_START_STEPS,
} from "../guide-data";

interface GuideClientProps {
  workspaceName: string;
  isPlatformAdmin?: boolean;
}

const STORAGE_KEY = "gp_guide_checklist_v2";
const checklistListeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedDone: string[] = [];

function emitChecklistChange() {
  checklistListeners.forEach((fn) => fn());
}

function subscribeChecklist(cb: () => void) {
  checklistListeners.add(cb);
  return () => {
    checklistListeners.delete(cb);
  };
}

function getChecklistSnapshot(): string[] {
  if (typeof window === "undefined") return cachedDone;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedDone;
    cachedRaw = raw;
    if (!raw) {
      cachedDone = [];
      return cachedDone;
    }
    const parsed = JSON.parse(raw);
    cachedDone = Array.isArray(parsed) ? (parsed as string[]) : [];
    return cachedDone;
  } catch {
    return cachedDone;
  }
}

const EMPTY_SERVER: string[] = [];
function getServerChecklistSnapshot(): string[] {
  return EMPTY_SERVER;
}

function toggleChecklistId(id: string) {
  if (typeof window === "undefined") return;
  const current = getChecklistSnapshot();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedDone = next;
  emitChecklistChange();
}

export function GuideClient({ workspaceName, isPlatformAdmin = false }: GuideClientProps) {
  const doneIds = useSyncExternalStore(
    subscribeChecklist,
    getChecklistSnapshot,
    getServerChecklistSnapshot
  );
  const [query, setQuery] = useState("");
  const [blockGroup, setBlockGroup] = useState<"all" | "bio" | "landing" | "conversion">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  const filteredMenus = useMemo(() => {
    if (!q) return MENU_GUIDES;
    return MENU_GUIDES.filter((sec) => {
      const hay = [
        sec.menuName,
        sec.summary,
        sec.audience,
        ...sec.steps.map((s) => `${s.title} ${s.detail}`),
        ...sec.forms.map(
          (f) =>
            `${f.formName} ${f.purpose} ${f.fields
              .map((fl) => `${fl.field} ${fl.meaning} ${fl.example || ""}`)
              .join(" ")}`
        ),
        ...sec.tips,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [q]);

  const filteredBlocks = useMemo(() => {
    return BLOCK_CATALOG.filter((b) => {
      if (blockGroup !== "all" && b.group !== blockGroup) return false;
      if (!q) return true;
      return `${b.name} ${b.type} ${b.desc} ${b.whenToUse}`.toLowerCase().includes(q);
    });
  }, [blockGroup, q]);

  const filteredFaq = useMemo(() => {
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(q));
  }, [q]);

  const completedCount = QUICK_START_STEPS.filter((s) => doneIds.includes(s.id)).length;
  const progressPct = Math.round((completedCount / QUICK_START_STEPS.length) * 100);

  return (
    <div className="space-y-8 pb-16">
      {/* HERO HEADER + SEARCH */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cẩm nang hướng dẫn sử dụng chi tiết — {workspaceName}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Hướng dẫn sử dụng từng Menu, Chức năng &amp; Form nhập liệu
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tài liệu viết bằng ngôn ngữ dễ hiểu cho cả người không rành kỹ thuật: đi từ bước khởi
              tạo website đầu tiên đến giải thích chi tiết từng ô nhập liệu, 26 loại khối thiết kế,
              phân quyền thành viên và vận hành Đa Tenant cho SuperAdmin.
            </p>
          </div>
          {isPlatformAdmin && (
            <Link
              href="/admin/system"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:opacity-90 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              Mở Trung tâm SuperAdmin
            </Link>
          )}
        </div>

        {/* Ô tìm kiếm toàn văn */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh bất kỳ chức năng, tên form hoặc lỗi nào (VD: Telegram, CSV, tên miền, anchor, popup...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Mục lục nhảy nhanh */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {MENU_GUIDES.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
            >
              {sec.order}. {sec.menuName.split(" (")[0].split(" —")[0]}
            </a>
          ))}
          <a
            href="#tu-dien-khoi"
            className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
          >
            26 Loại khối
          </a>
          <a
            href="#phim-tat"
            className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
          >
            Phím tắt
          </a>
          <a
            href="#hoi-dap"
            className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
          >
            Hỏi đáp (FAQ)
          </a>
        </div>
      </section>

      {/* CHECKLIST KHỞI ĐỘNG NHANH 7 BƯỚC */}
      {!q && (
        <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  Lộ trình khởi động nhanh 7 bước cho người mới
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tích vào từng bước sau khi bạn đã làm thử — tiến độ tự lưu trên trình duyệt của
                  bạn.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono">
                {completedCount}/{QUICK_START_STEPS.length} ({progressPct}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {QUICK_START_STEPS.map((step) => {
              const done = doneIds.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${
                    done
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : "border-border bg-background/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleChecklistId(step.id)}
                    aria-label={`Đánh dấu ${step.title}`}
                    className="mt-0.5 shrink-0 cursor-pointer text-muted-foreground hover:text-emerald-600"
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={`text-xs font-bold ${
                        done ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-0.5"
                    >
                      <span>{step.cta}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* HƯỚNG DẪN CHI TIẾT TỪNG MENU & TỪNG FORM */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Hướng dẫn chi tiết từng Menu &amp; Form ({filteredMenus.length} mục)</span>
          </h2>
        </div>

        {filteredMenus.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            Không tìm thấy mục menu nào khớp với từ khóa &ldquo;{query}&rdquo;.
          </div>
        ) : (
          filteredMenus.map((sec) => (
            <article
              key={sec.id}
              id={sec.id}
              className="scroll-mt-20 rounded-3xl border border-border bg-card p-5 md:p-7 space-y-5 shadow-2xs"
            >
              {/* Header của từng Menu */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/70">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-foreground text-background font-mono text-xs font-bold">
                      {sec.order}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-foreground">
                      {sec.menuName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                      {sec.audience}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {sec.summary}
                  </p>
                </div>
                <Link
                  href={sec.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted shrink-0"
                >
                  <span>Mở mục này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Các bước thao tác */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quy trình thao tác chi tiết
                </h4>
                <ol className="space-y-2.5">
                  {sec.steps.map((st, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-foreground">{st.title}</p>
                        <p className="text-muted-foreground leading-relaxed">{st.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Giải thích chi tiết từng Form & Ô nhập liệu */}
              {sec.forms.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Giải thích chi tiết từng Form &amp; Ô nhập liệu ({sec.forms.length} form)
                  </h4>
                  <div className="space-y-2.5">
                    {sec.forms.map((form, fIdx) => {
                      const key = `${sec.id}-f-${fIdx}`;
                      const isOpen = q ? true : expandedForms[key] !== false;
                      return (
                        <div
                          key={key}
                          className="rounded-2xl border border-border/80 bg-background overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedForms((prev) => ({ ...prev, [key]: !isOpen }))
                            }
                            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/30 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground">{form.formName}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Vị trí: <span className="text-foreground/80">{form.where}</span> —{" "}
                                {form.purpose}
                              </p>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isOpen && (
                            <div className="border-t border-border/60 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                                  <tr>
                                    <th className="py-2 px-3.5 font-semibold w-[28%]">
                                      Tên ô / Nút bấm
                                    </th>
                                    <th className="py-2 px-3.5 font-semibold">
                                      Ý nghĩa &amp; Cách điền chuẩn
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {form.fields.map((fl, i) => (
                                    <tr key={i} className="align-top">
                                      <td className="py-2.5 px-3.5 font-semibold text-foreground">
                                        {fl.field}
                                        {fl.required && (
                                          <span className="ml-1 text-[10px] font-bold text-red-600">
                                            *Bắt buộc
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-muted-foreground leading-relaxed">
                                        <span>{fl.meaning}</span>
                                        {fl.example && (
                                          <span className="block mt-1 text-[11px] font-mono text-foreground/80 bg-muted/50 px-2 py-0.5 rounded w-fit">
                                            VD: {fl.example}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mẹo & Lưu ý */}
              {sec.tips.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-1.5">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>Mẹo hay &amp; Lưu ý quan trọng</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {sec.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      {/* TỪ ĐIỂN 26 LOẠI KHỐI */}
      <section
        id="tu-dien-khoi"
        className="scroll-mt-20 rounded-3xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Từ điển toàn bộ các Khối nội dung (Bio Link &amp; Landing Page)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn đúng loại khối cho từng mục đích để trang vừa đẹp vừa chuyển đổi khách tốt nhất.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["all", "Tất cả"],
                ["bio", "Bio Link / Cơ bản"],
                ["landing", "Landing Page"],
                ["conversion", "Chuyển đổi & Bán hàng"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBlockGroup(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  blockGroup === key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBlocks.map((b) => (
            <div
              key={b.type}
              className="p-3.5 rounded-2xl border border-border/80 bg-background space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground">{b.name}</h3>
                <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-muted-foreground">
                  {b.type}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{b.desc}</p>
              <p className="text-[11px] text-primary/90 font-medium pt-0.5 flex items-start gap-1">
                <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{b.whenToUse}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PHÍM TẮT & THAO TÁC NHANH */}
      <section
        id="phim-tat"
        className="scroll-mt-20 rounded-3xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-primary" />
          <span>Phím tắt &amp; Mẹo thao tác nhanh trong Trình thiết kế</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EDITOR_SHORTCUTS.map((sc, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl border border-border/70 bg-background flex items-center justify-between gap-3"
            >
              <span className="text-xs text-muted-foreground">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-muted border border-border font-mono text-[11px] font-bold text-foreground shrink-0">
                {sc.keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* HỎI ĐÁP & XỬ LÝ LỖI THƯỜNG GẶP */}
      <section
        id="hoi-dap"
        className="scroll-mt-20 rounded-3xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span>Hỏi đáp &amp; Xử lý sự cố thường gặp ({filteredFaq.length})</span>
        </h2>

        <div className="space-y-2">
          {filteredFaq.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-background overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 cursor-pointer"
                >
                  <span className="text-xs md:text-sm font-bold text-foreground">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
