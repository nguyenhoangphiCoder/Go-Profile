import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const activePath = resolve(root, ".env.local");
const localPath = resolve(root, ".env.docker.local");
const cloudPath = resolve(root, ".env.cloud.local");

function getCurrentTarget() {
  if (!existsSync(activePath)) return { mode: "MISSING", url: "(không có .env.local)" };
  const text = readFileSync(activePath, "utf8");
  const match = text.match(/^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)\s*$/m);
  const url = match ? match[1].trim().replace(/^["']|["']$/g, "") : "(không rõ)";
  const isLocal = url.includes("127.0.0.1") || url.includes("localhost");
  return { mode: isLocal ? "LOCAL DOCKER" : "CLOUD PRODUCTION", url };
}

const arg = (process.argv[2] ?? "status").toLowerCase();

if (arg === "local") {
  if (!existsSync(localPath)) {
    console.error("Không tìm thấy .env.docker.local");
    process.exit(1);
  }
  copyFileSync(localPath, activePath);
  const { mode, url } = getCurrentTarget();
  console.log(`Đã chuyển sang [${mode}] (${url})`);
  console.log("Lưu ý: Nếu đang chạy `pnpm dev`, hãy khởi động lại dev server để nhận env mới.");
} else if (arg === "cloud") {
  if (!existsSync(cloudPath)) {
    console.error("Không tìm thấy .env.cloud.local");
    process.exit(1);
  }
  copyFileSync(cloudPath, activePath);
  const { mode, url } = getCurrentTarget();
  console.log(`Đã chuyển sang [${mode}] (${url})`);
  console.log("CẨN THẬN: Mọi thay đổi dữ liệu sẽ tác động trực tiếp lên Production DB!");
} else if (arg === "status") {
  const { mode, url } = getCurrentTarget();
  console.log(`DB hiện tại: [${mode}] -> ${url}`);
} else {
  console.error("Cách dùng: node scripts/switch-db.mjs <local|cloud|status>");
  process.exit(1);
}
