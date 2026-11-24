"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  BookmarkPlus,
  Download,
  FolderOpen,
  Layers,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { EditorBlockItem, PageKind, PageThemeConfig } from "../../types";

export interface SavedCustomTemplate {
  id: string;
  name: string;
  pageKind: PageKind;
  theme: PageThemeConfig;
  blocks: EditorBlockItem[];
  createdAt: string;
}

const STORAGE_KEY = "gp_custom_templates_v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedList: SavedCustomTemplate[] = [];

function emitChange() {
  listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): SavedCustomTemplate[] {
  if (typeof window === "undefined") return cachedList;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    if (!raw) {
      cachedList = [];
      return cachedList;
    }
    const parsed = JSON.parse(raw);
    cachedList = Array.isArray(parsed) ? (parsed as SavedCustomTemplate[]) : [];
    return cachedList;
  } catch {
    return cachedList;
  }
}

const EMPTY_SERVER: SavedCustomTemplate[] = [];
function getServerSnapshot(): SavedCustomTemplate[] {
  return EMPTY_SERVER;
}

function writeTemplates(next: SavedCustomTemplate[]) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedList = next;
  emitChange();
}

function cloneBlocksWithFreshIds(blocks: EditorBlockItem[], startPosition = 0): EditorBlockItem[] {
  return blocks.map((b, idx) => ({
    ...structuredClone(b),
    id: `tpl-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    position: startPosition + idx,
  }));
}

interface CustomTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  currentPageKind: PageKind;
  currentBlocks: EditorBlockItem[];
  currentTheme: PageThemeConfig;
  canEdit: boolean;
  onApplyTemplate: (
    blocks: EditorBlockItem[],
    mode: "replace" | "append",
    theme?: PageThemeConfig
  ) => void;
}

export function CustomTemplatesModal({
  open,
  onClose,
  currentPageKind,
  currentBlocks,
  currentTheme,
  canEdit,
  onApplyTemplate,
}: CustomTemplatesModalProps) {
  const templates = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [name, setName] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!open || typeof document === "undefined") return null;

  const handleSaveCurrent = () => {
    const clean = name.trim();
    if (!clean) return;
    const item: SavedCustomTemplate = {
      id: `ct-${Date.now()}`,
      name: clean,
      pageKind: currentPageKind,
      theme: structuredClone(currentTheme),
      blocks: structuredClone(currentBlocks),
      createdAt: new Date().toISOString(),
    };
    writeTemplates([item, ...templates].slice(0, 30));
    setName("");
    setStatusMsg(`Đã lưu mẫu "${clean}" (${currentBlocks.length} khối).`);
  };

  const handleDelete = (id: string) => {
    writeTemplates(templates.filter((t) => t.id !== id));
    setStatusMsg("Đã xóa mẫu.");
  };

  const handleExport = (tpl: SavedCustomTemplate) => {
    const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template-${tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SavedCustomTemplate>;
      if (!parsed.name || !Array.isArray(parsed.blocks)) {
        setStatusMsg("File JSON mẫu không đúng định dạng.");
        return;
      }
      const imported: SavedCustomTemplate = {
        id: `ct-${Date.now()}`,
        name: String(parsed.name).slice(0, 80),
        pageKind: parsed.pageKind === "landing" ? "landing" : "profile",
        theme: (parsed.theme as PageThemeConfig) || { preset: "go-original" },
        blocks: parsed.blocks as EditorBlockItem[],
        createdAt: new Date().toISOString(),
      };
      writeTemplates([imported, ...templates].slice(0, 30));
      setStatusMsg(`Đã nhập mẫu "${imported.name}" (${imported.blocks.length} khối).`);
    } catch {
      setStatusMsg("Không đọc được file JSON.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Mẫu thiết kế của tôi"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-bold">Mẫu thiết kế của tôi (Custom Templates)</h2>
              <p className="text-xs text-muted-foreground">
                Lưu toàn bộ bố cục &amp; giao diện trang hiện tại để tái sử dụng 1 click cho các
                trang khác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Lưu trang hiện tại làm mẫu */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2.5">
            <span className="text-xs font-bold block">
              Lưu trang hiện tại thành mẫu ({currentBlocks.length} khối)
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Landing Nhượng Quyền Chuẩn / Bio Cửa Hàng..."
                className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-input bg-background"
              />
              <button
                type="button"
                disabled={!name.trim() || currentBlocks.length === 0}
                onClick={handleSaveCurrent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Lưu mẫu
              </button>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Nhập JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleImportFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {statusMsg && <p className="text-xs text-emerald-600 font-medium">{statusMsg}</p>}
          </div>

          {/* Danh sách mẫu đã lưu */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Kho mẫu đã lưu ({templates.length})
            </h3>
            {templates.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-1.5">
                <FolderOpen className="w-7 h-7 text-muted-foreground/60 mx-auto" />
                <p className="text-sm font-medium">Chưa có mẫu riêng nào</p>
                <p className="text-xs text-muted-foreground">
                  Đặt tên và bấm <strong>Lưu mẫu</strong> ở trên để lưu lại bố cục bạn ưng ý.
                </p>
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-xl border border-border bg-background flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">{tpl.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
                        {tpl.pageKind}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      <span>{tpl.blocks.length} khối</span>
                      <span>·</span>
                      <span>{new Date(tpl.createdAt).toLocaleDateString("vi-VN")}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyTemplate(
                              cloneBlocksWithFreshIds(tpl.blocks, currentBlocks.length),
                              "append"
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                        >
                          Chèn thêm khối
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyTemplate(
                              cloneBlocksWithFreshIds(tpl.blocks, 0),
                              "replace",
                              structuredClone(tpl.theme)
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 cursor-pointer"
                        >
                          Thay thế toàn bộ
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExport(tpl)}
                      title="Xuất file JSON"
                      className="p-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl.id)}
                      title="Xóa mẫu"
                      className="p-1.5 rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
