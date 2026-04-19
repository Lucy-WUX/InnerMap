import type { Config } from "tailwindcss"

const config: Config = {
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
        soft: "#86868b",
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
      },
      boxShadow: {
        "ds-card": "0 2px 12px rgba(0, 0, 0, 0.06)",
        "ds-card-hover": "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
      spacing: {
        "ds-xs": "8px",
        "ds-md": "16px",
        "ds-lg": "24px",
      },
      fontSize: {
        "ds-title": ["16px", { lineHeight: "1.5", fontWeight: "600" }],
        "ds-body": ["14px", { lineHeight: "1.55", fontWeight: "400" }],
        "ds-caption": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
}

export default config
