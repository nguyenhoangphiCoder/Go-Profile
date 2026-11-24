import { describe, it, expect } from "vitest";
import {
  extractLatLngFromMapsUrl,
  normalizeViSearch,
  parseBranchesCsv,
} from "@/features/branches/geo-utils";

describe("Branches geo-utils & CSV parser (Phase 4A)", () => {
  it("normalizeViSearch chuẩn hóa tiếng Việt không dấu chính xác", () => {
    expect(normalizeViSearch("320 Ấp Bắc, Quận Tân Phú")).toBe("320 ap bac, quan tan phu");
    expect(normalizeViSearch("Đường Điện Biên Phủ")).toBe("duong dien bien phu");
  });

  it("extractLatLngFromMapsUrl tách đúng tọa độ từ các dạng link Google Maps", () => {
    expect(
      extractLatLngFromMapsUrl(
        "https://www.google.com/maps/place/Go+Cafe/@10.801234,106.641234,17z/data=!3m1!4b1"
      )
    ).toEqual({ lat: 10.801234, lng: 106.641234 });

    expect(
      extractLatLngFromMapsUrl(
        "https://www.google.com/maps/place/Go+Cafe/@10.77,106.69,15z/data=!4m6!3m5!1s0x0!8m2!3d10.776889!4d106.700806"
      )
    ).toEqual({ lat: 10.776889, lng: 106.700806 });

    expect(extractLatLngFromMapsUrl("https://maps.google.com/?q=10.762622,106.660172")).toEqual({
      lat: 10.762622,
      lng: 106.660172,
    });

    expect(extractLatLngFromMapsUrl("https://maps.google.com/?q=999,106.66")).toBeNull();
  });

  it("parseBranchesCsv đọc CSV, tự tách tọa độ từ link Maps và báo lỗi dòng sai", () => {
    const csv = [
      "Tên chi nhánh,Địa chỉ,Quận,SĐT,Giờ mở cửa,Link Maps,Lat,Lng",
      '"Gờ Café Ấp Bắc","320 Ấp Bắc, P.13",Tân Bình,0779200020,06:30 - 22:00,"https://maps.google.com/?q=10.8021,106.6412",,',
      "Gờ Café Lỗi Tọa Độ,123 Lê Lợi,Quận 1,,, ,120,106.7",
      ",Thiếu tên quán,Quận 3,,,,,",
    ].join("\n");

    const rows = parseBranchesCsv(csv);
    expect(rows).toHaveLength(3);

    expect(rows[0].error).toBeUndefined();
    expect(rows[0].name).toBe("Gờ Café Ấp Bắc");
    expect(rows[0].lat).toBe(10.8021);
    expect(rows[0].lng).toBe(106.6412);

    expect(rows[1].error).toContain("Vĩ độ");
    expect(rows[2].error).toContain("Thiếu tên chi nhánh");
  });
});
