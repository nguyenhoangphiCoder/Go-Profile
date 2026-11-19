import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  adjustOffsetForZoom,
  buildCroppedFilename,
  clampCropOffset,
  computeCoverScale,
  computeCropBoxSize,
  computeSourceCropRect,
  defaultAspectForHint,
  isCroppableMimeType,
  isCroppableUrl,
} from "@/lib/image-crop";
import { ImageCropModal } from "@/components/admin/image-crop-modal";
import { MediaPickerField } from "@/components/admin/media-picker-field";

const uploadMediaDirectMock = vi.fn();

vi.mock("@/features/media/actions", () => ({
  uploadMediaDirectAction: (...args: unknown[]) => uploadMediaDirectMock(...args),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest.fill;
    delete rest.unoptimized;
    delete rest.priority;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

describe("image-crop math helpers", () => {
  it("chọn tỉ lệ mặc định đúng cho từng aspectHint", () => {
    expect(defaultAspectForHint("circle")).toBe("1:1");
    expect(defaultAspectForHint("banner")).toBe("2:1");
    expect(defaultAspectForHint("standard")).toBe("1:1");
  });

  it("phân biệt đúng định dạng cắt được và không cắt (GIF/SVG)", () => {
    expect(isCroppableMimeType("image/jpeg")).toBe(true);
    expect(isCroppableMimeType("image/png")).toBe(true);
    expect(isCroppableMimeType("image/webp")).toBe(true);
    expect(isCroppableMimeType("image/gif")).toBe(false);
    expect(isCroppableMimeType("image/svg+xml")).toBe(false);

    expect(isCroppableUrl("https://cdn.example.com/photo.jpg?v=1")).toBe(true);
    expect(isCroppableUrl("https://cdn.example.com/anim.gif")).toBe(false);
    expect(isCroppableUrl("https://cdn.example.com/logo.svg")).toBe(false);
  });

  it("tính khung cắt vừa khít vùng sân khấu theo tỉ lệ", () => {
    expect(computeCropBoxSize(1, 400, 300)).toEqual({ width: 300, height: 300 });
    expect(computeCropBoxSize(2, 400, 300)).toEqual({ width: 400, height: 200 });
    expect(computeCropBoxSize(4 / 5, 400, 300)).toEqual({ width: 240, height: 300 });
  });

  it("tính cover scale và kẹp offset để không bao giờ hở viền", () => {
    const natural = { width: 1000, height: 2000 };
    const cropBox = { width: 280, height: 280 };
    expect(computeCoverScale(natural, cropBox)).toBeCloseTo(0.28, 5);

    // Ở zoom 1: displayW = 280 (maxX = 0), displayH = 560 (maxY = 140)
    expect(clampCropOffset({ x: 50, y: 200 }, natural, cropBox, 1)).toEqual({
      x: 0,
      y: 140,
    });
    expect(clampCropOffset({ x: -50, y: -200 }, natural, cropBox, 1)).toEqual({
      x: 0,
      y: -140,
    });
  });

  it("tính vùng cắt chính xác trên ảnh dọc khi kéo lên đầu và xuống cuối", () => {
    const natural = { width: 1000, height: 2000 };
    const cropBox = { width: 280, height: 280 };

    // Giữa ảnh
    const mid = computeSourceCropRect(natural, cropBox, { x: 0, y: 0 }, 1);
    expect(mid.x).toBeCloseTo(0, 5);
    expect(mid.y).toBeCloseTo(500, 5);
    expect(mid.width).toBeCloseTo(1000, 5);
    expect(mid.height).toBeCloseTo(1000, 5);

    // Kéo ảnh xuống (+140px) -> lấy phần đỉnh ảnh [0..1000]
    const top = computeSourceCropRect(natural, cropBox, { x: 0, y: 140 }, 1);
    expect(top.x).toBeCloseTo(0, 5);
    expect(top.y).toBeCloseTo(0, 5);
    expect(top.width).toBeCloseTo(1000, 5);
    expect(top.height).toBeCloseTo(1000, 5);

    // Kéo ảnh lên (-140px) -> lấy phần đáy ảnh [1000..2000]
    const bottom = computeSourceCropRect(natural, cropBox, { x: 0, y: -140 }, 1);
    expect(bottom.x).toBeCloseTo(0, 5);
    expect(bottom.y).toBeCloseTo(1000, 5);
    expect(bottom.width).toBeCloseTo(1000, 5);
    expect(bottom.height).toBeCloseTo(1000, 5);

    // Zoom 2x ở giữa ảnh -> cắt hình vuông 500x500 ở chính giữa
    const zoomed = computeSourceCropRect(natural, cropBox, { x: 0, y: 0 }, 2);
    expect(zoomed.x).toBeCloseTo(250, 5);
    expect(zoomed.y).toBeCloseTo(750, 5);
    expect(zoomed.width).toBeCloseTo(500, 5);
    expect(zoomed.height).toBeCloseTo(500, 5);
  });

  it("giữ nguyên điểm tâm khi thay đổi zoom", () => {
    const natural = { width: 1000, height: 1000 };
    const cropBox = { width: 200, height: 200 };
    // Ở zoom 2: display = 400, maxOffset = 100. Offset hiện tại = (50, 0).
    // Tăng lên zoom 4: display = 800, maxOffset = 300 -> offset tỉ lệ thành (100, 0).
    expect(adjustOffsetForZoom({ x: 50, y: 0 }, 2, 4, natural, cropBox)).toEqual({
      x: 100,
      y: 0,
    });
    // Thu về zoom 1 -> bị kẹp về (0, 0)
    expect(adjustOffsetForZoom({ x: 50, y: 0 }, 2, 1, natural, cropBox)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("tạo tên file sạch sau khi cắt", () => {
    expect(buildCroppedFilename("Ho Phuong Anh.PNG", "image/png")).toBe(
      "Ho_Phuong_Anh-cropped.png"
    );
    expect(buildCroppedFilename("avatar-cropped.jpg", "image/jpeg")).toBe("avatar-cropped.jpg");
    expect(buildCroppedFilename(null, "image/webp")).toBe("image-cropped.webp");
  });
});

describe("ImageCropModal & MediaPickerField", () => {
  beforeEach(() => {
    uploadMediaDirectMock.mockReset();
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => "blob:mock-url");
    } else {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    }
  });

  it("hiển thị modal cắt ảnh với nút đổi tỉ lệ, zoom và dùng ảnh gốc", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onUseOriginal = vi.fn();
    const file = new File(["abc"], "portrait.jpg", { type: "image/jpeg" });

    render(
      <ImageCropModal
        isOpen
        source={{ file, filename: file.name, mimeType: file.type }}
        aspectHint="circle"
        allowUseOriginal
        onCancel={onCancel}
        onConfirm={onConfirm}
        onUseOriginal={onUseOriginal}
      />
    );

    expect(screen.getByText("1:1 Tròn (Avatar)")).toBeInTheDocument();
    expect(screen.getByText("2:1 Banner")).toBeInTheDocument();
    expect(screen.getByText("Dùng ảnh gốc (không cắt)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dùng ảnh gốc (không cắt)"));
    expect(onUseOriginal).toHaveBeenCalledTimes(1);
  });

  it("MediaPickerField hiển thị nút Cắt ảnh khi đã chọn ảnh và mở modal cắt khi tải JPEG", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MediaPickerField
        label="Ảnh đại diện (Avatar)"
        mediaId="m-1"
        mediaUrl="https://cdn.example.com/avatar.jpg"
        onChange={onChange}
        availableMedia={[
          {
            id: "m-1",
            originalFilename: "avatar.jpg",
            publicUrl: "https://cdn.example.com/avatar.jpg",
          },
        ]}
        aspectHint="circle"
      />
    );

    // Nút Cắt ảnh phải hiển thị cho ảnh đang chọn
    expect(screen.getByRole("button", { name: /Cắt ảnh/i })).toBeInTheDocument();

    // Tải file JPEG -> không gọi upload trực tiếp ngay mà mở modal cắt
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const jpegFile = new File(["dummy"], "tall-photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [jpegFile] } });

    expect(uploadMediaDirectMock).not.toHaveBeenCalled();

    // Tải file SVG -> tải trực tiếp bỏ qua cắt
    uploadMediaDirectMock.mockResolvedValueOnce({
      success: true,
      asset: {
        id: "m-svg",
        originalFilename: "icon.svg",
        publicUrl: "https://cdn.example.com/icon.svg",
      },
    });
    const svgFile = new File(["<svg/>"], "icon.svg", { type: "image/svg+xml" });
    fireEvent.change(fileInput, { target: { files: [svgFile] } });

    await waitFor(() => {
      expect(uploadMediaDirectMock).toHaveBeenCalledTimes(1);
    });
  });
});
