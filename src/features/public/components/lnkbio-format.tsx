/**
 * Hiển thị văn bản giàu định dạng theo phong cách Lnk.Bio (hophuonganh.gocafe):
 * - Dòng bọc trong *...* được hiển thị in nghiêng theo màu chủ đạo Bio (accentColor)
 * - Dòng "- Việc quan trọng: email ..." căn trái, in đậm kèm link email theo màu chủ đạo
 * - Các dòng liên hệ "- Liên hệ..." và số điện thoại được tô đậm & làm nổi bật số điện thoại theo màu chủ đạo
 */
export function renderLnkBioFormattedText(
  content: string,
  defaultAlign: string = "center",
  accentColor: string = "#2563eb"
) {
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
          className={`text-[14px] sm:text-[15px] leading-[1.6] tracking-[0.6px] italic font-medium text-${defaultAlign}`}
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
        <p
          key={idx}
          className="text-[14px] leading-[1.6] tracking-[0.6px] font-bold text-left"
        >
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
    const phoneMatch = line.match(/^(\d{4}\.\d{2}\.\d{2}(?:\.\d{2}|\d{2}))(\s*\(.*\))?$/);
    if (phoneMatch) {
      const [, phone, note] = phoneMatch;
      const cleanTel = phone.replace(/\./g, "");
      return (
        <p
          key={idx}
          className={`text-[14px] leading-[1.6] tracking-[0.6px] font-bold text-${defaultAlign}`}
        >
          <a
            href={`tel:${cleanTel}`}
            className="hover:underline font-bold"
            style={{ color: accentColor }}
          >
            {phone}
          </a>
          {note && (
            <span className="font-bold" style={{ color: accentColor }}>
              {note}
            </span>
          )}
        </p>
      );
    }

    // 4. Dòng bắt đầu bằng "- " (tiêu đề mục liên hệ)
    if (line.startsWith("- ")) {
      return (
        <p
          key={idx}
          className={`text-[14px] leading-[1.6] tracking-[0.6px] font-bold text-${defaultAlign}`}
        >
          {line}
        </p>
      );
    }

    // 5. Đoạn văn bản thông thường
    return (
      <p
        key={idx}
        className={`text-[14px] leading-[1.6] tracking-[0.6px] text-${defaultAlign}`}
      >
        {line}
      </p>
    );
  });
}

