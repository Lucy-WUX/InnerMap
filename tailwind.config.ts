import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#faf8f5",
        paper: "#faf8f5",
        ink: "#795548",
        /** 次级说明文字：需满足浅底上的可读对比度 */
        soft: "#5e4f44",
        /** 能量正向 / 成功提示（辅助色，与主色棕色搭配） */
        "energy-positive": "#2d7a4a",
        /** 预警与危险操作强调 */
        "energy-alert": "#b42318",
        /** 中性辅助（暖灰，避免冷色 slate） */
        muted: "#8a7d72",
        "land-border": "#e9e2d8",
        "land-input-border": "#ddcfbe",
        "land-error": "#a64432",
        "warm-base": "#e7dbc9",
        "warm-soft": "#e9dfd0",
        "warm-strong": "#d8c9b8",
        "surface-warm-soft": "#fdfbf8",
        "surface-warm-elevated": "#fffdf9",
        "surface-warm-hover": "#fbf5eb",
      },
      borderRadius: {
        ds: "12px",
        "btn-ds": "8px",
        "landing-card": "28px",
      },
      boxShadow: {
        "ds-card": "0 2px 12px rgba(0, 0, 0, 0.06)",
        "ds-card-hover": "0 4px 20px rgba(0, 0, 0, 0.08)",
        landing: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        "landing-hover": "0 16px 32px -8px rgba(0, 0, 0, 0.08)",
        "landing-hero-img": "0 12px 32px -8px rgba(93, 64, 55, 0.12)",
      },
      spacing: {
        "ds-xs": "8px",
        "ds-md": "16px",
        "ds-lg": "24px",
      },
      fontSize: {
        "ds-title": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "ds-body": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "ds-caption": ["12px", { lineHeight: "1.6", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
}

export default config
