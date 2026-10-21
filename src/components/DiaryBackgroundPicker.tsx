"use client";

import type { DiaryBackground } from "@/lib/types";

export const DIARY_BACKGROUNDS: { value: DiaryBackground; label: string }[] = [
  { value: "paper", label: "シンプル" },
  { value: "sakura", label: "さくら" },
  { value: "mint", label: "ミント" },
  { value: "lemon", label: "レモン" },
  { value: "sky", label: "そら" },
  { value: "flower", label: "花もよう" },
  { value: "dots", label: "水玉" },
  { value: "gingham", label: "チェック" },
  { value: "stripe", label: "ストライプ" },
];

type DiaryBackgroundPickerProps = {
  value: DiaryBackground;
  onChange: (value: DiaryBackground) => void;
  label?: string;
  hasIllustration?: boolean;
};

export default function DiaryBackgroundPicker({
  value,
  onChange,
  label = "背景",
  hasIllustration = false,
}: DiaryBackgroundPickerProps) {
  const backgrounds = hasIllustration
    ? [...DIARY_BACKGROUNDS, { value: "illustration" as const, label: "選んだイラスト" }]
    : DIARY_BACKGROUNDS;

  return (
    <label className="diary-background-picker">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          const background = backgrounds.find((option) => option.value === event.target.value);
          if (background) onChange(background.value);
        }}
        aria-label={label}
      >
        {backgrounds.map((background) => (
          <option key={background.value} value={background.value}>
            {background.label}
          </option>
        ))}
      </select>
    </label>
  );
}
