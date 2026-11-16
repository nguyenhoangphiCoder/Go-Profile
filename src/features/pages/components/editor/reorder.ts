/**
 * Di chuyển phần tử ở vị trí `from` tới điểm chèn `to` (0..length, tính theo danh sách gốc),
 * rồi đánh lại `position` liên tục từ 0. Trả về chính mảng cũ nếu vị trí không đổi.
 */
export function reorderByInsertion<T extends { position: number }>(
  items: T[],
  from: number,
  to: number
): T[] {
  if (from < 0 || from >= items.length || to < 0 || to > items.length) return items;
  if (from === to || from + 1 === to) return items;
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to > from ? to - 1 : to, 0, moved);
  return copy.map((item, i) => ({ ...item, position: i }));
}
