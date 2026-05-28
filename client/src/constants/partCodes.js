export const PART_CODES = [
  { code: "MB", label: "Mainboard" },
  { code: "SCR", label: "Màn hình" },
  { code: "BAT", label: "Pin" },
  { code: "HSG", label: "Vỏ máy" },
  { code: "CAM-R", label: "Camera Sau" },
  { code: "CAM-F", label: "Camera Trước" },
  { code: "CPT", label: "Cụm chân sạc" },
  { code: "SPK", label: "Loa ngoài" },
  { code: "FGL", label: "Mặt kính" },
  { code: "BGL", label: "Kính lưng" },
  { code: "OTH", label: "Khác" },
];

export const getPartLabel = (code) =>
  PART_CODES.find((p) => p.code === code)?.label || code;
