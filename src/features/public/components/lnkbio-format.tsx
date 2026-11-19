import { PhoneInlineLink } from "@/features/renderer/phone-action-sheet";
import { isRichTextHtml, sanitizeRichTextHtml } from "@/lib/rich-text";

/**
 * Hiển thị văn bản giàu định dạng theo phong cách Lnk.Bio (hophuonganh.gocafe)
 * hoặc HTML rich text đã được lọc an toàn (từ RichTextEditor).
 */
export function renderLnkBioFormattedText(
  content: string,
  defaultAlign: string = "center",
  accentColor: string = "#2563eb"
) {
  if (isRichTextHtml(content)) {
    const safeHtml = sanitizeRichTextHtml(content);
    const alignClass =
      defaultAlign === "left"
        ? "text-left"
        : defaultAlign === "right"
          ? "text-right"
          : "text-center";
    return (
      <div
        className={`gp-rich-text leading-[1.6] tracking-[0.5px] ${alignClass}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  const lines = content.split("\n");

  return lines.map((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      return <div key={idx} className="h-2.5" />;
    }

    // 1. Dòng bọc trong *...* -> In nghiêng màu chủ đạo Bio (giống <span style="color: #3598db;"><em>...</em></span>)
    if (line.startsWith("*") && line.endsWith("*") && line.length > 2) {
      const innerText = line.slice(1, -1);
      return (
        <p
          key={idx}
          className={`leading-[1.6] tracking-[0.6px] italic font-medium text-${defaultAlign}`}
          style={{ color: accentColor }}
        >
          {innerText}
        </p>
      );
    }

    // 2. Dòng "- Việc quan trọng: email ..." (căn trái trên Lnk.Bio)
    const emailMatch = line.match(
      /^(-\s*Việc quan trọng:\s*email\s+)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(.*)$/i
    );
    if (emailMatch) {
      const [, prefix, email, suffix] = emailMatch;
      return (
        <p key={idx} className="leading-[1.6] tracking-[0.6px] font-bold text-left">
          <span>{prefix}</span>
          <a
            href={`mailto:${email}`}
            className="italic hover:underline font-bold"
            style={{ color: accentColor }}
          >
            {email}
          </a>
          {suffix && <span>{suffix}</span>}
        </p>
      );
    }

    // 3. Dòng chứa số điện thoại dạng 0xxx.xx.xxxx hoặc 0xxx.xx.xx.xx kèm ghi chú
    const phoneMatch = line.match(/^(\d{3,4}(?:\.\d{2,4})+)(\s*\(.*\))?$/);
    if (phoneMatch) {
      const [, phone, note] = phoneMatch;
      return (
        <p key={idx} className={`leading-[1.6] tracking-[0.6px] font-bold text-${defaultAlign}`}>
          <PhoneInlineLink phoneText={phone} accentColor={accentColor} />
          {note && <span className="font-normal opacity-90 pl-1 text-current">{note}</span>}
        </p>
      );
    }

    // 4. Dòng bắt đầu bằng "- " (tiêu đề mục liên hệ)
    if (line.startsWith("- ")) {
      return (
        <p key={idx} className={`leading-[1.6] tracking-[0.6px] font-bold text-${defaultAlign}`}>
          {line}
        </p>
      );
    }

    // 5. Đoạn văn bản thông thường
    return (
      <p key={idx} className={`leading-[1.6] tracking-[0.6px] text-${defaultAlign}`}>
        {line}
      </p>
    );
  });
}
