/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/**
 * CareerBridge Design System — "Ink & Evergreen".
 *
 * A quiet-luxury enterprise palette. One shared token vocabulary for all four
 * portals. Semantic token NAMES are preserved so every existing page keeps
 * compiling; the VALUES define the look:
 *
 *   Canvas   warm porcelain (#F6F4F0) — paper, not cold slate
 *   Ink      warm near-black (#1B1A17) — softer/more premium than pure slate
 *   Brand    deep evergreen / petrol (#14453D) — trust, timeless, not generic blue
 *   Accent   bronze / champagne (#9C7B45) — the single warm "gold" note, used sparingly
 *   Status   muted emerald / ochre / brick / petrol-blue — never neon
 *
 * Borders are warm hairlines; shadows are warm-tinted and layered for a soft,
 * expensive elevation rather than hard gray lines.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Neutral surfaces (warm "porcelain / stone") --------------
        "surface": '#f6f4f0',
        "surface-dim": '#e8e4dc',
        "surface-bright": '#ffffff',
        "surface-container-lowest": '#ffffff',
        "surface-container-low": '#fbfaf7',
        "surface-container": '#f2efea',
        "surface-container-high": '#ece8e1',
        "surface-container-highest": '#e4dfd6',
        "on-surface": '#1b1a17',
        "on-surface-variant": '#5c574e',
        "inverse-surface": '#2a2823',
        "inverse-on-surface": '#f5f2ec',
        "outline": '#8a8377',
        "outline-variant": '#e2ddd3',
        "surface-tint": '#14453d',
        "surface-variant": '#ece8e1',
        "background": '#f6f4f0',
        "on-background": '#1b1a17',

        // --- Brand (deep evergreen / petrol) --------------------------
        "primary": '#14453d',
        "on-primary": '#fbfaf7',
        "primary-container": '#d8e7e1',
        "on-primary-container": '#0c332c',
        "inverse-primary": '#8fc4b6',
        "primary-fixed": '#d8e7e1',
        "primary-fixed-dim": '#a9cdc2',
        "on-primary-fixed": '#06231e',
        "on-primary-fixed-variant": '#285a50',

        // --- Secondary (quiet evergreen-gray, tonal chips) ------------
        "secondary": '#4a5a54',
        "on-secondary": '#ffffff',
        "secondary-container": '#e7edea',
        "on-secondary-container": '#24332e',
        "secondary-fixed": '#dce4e0',
        "secondary-fixed-dim": '#c0ccc6',
        "on-secondary-fixed": '#0c1b16',
        "on-secondary-fixed-variant": '#3a4a44',

        // --- Tertiary / Accent (bronze / champagne) -------------------
        "tertiary": '#9c7b45',
        "on-tertiary": '#ffffff',
        "tertiary-container": '#f1e7d5',
        "on-tertiary-container": '#5a4321',
        "tertiary-fixed": '#f1e7d5',
        "tertiary-fixed-dim": '#dec8a0',
        "on-tertiary-fixed": '#2e2008',
        "on-tertiary-fixed-variant": '#7a5e30',

        // Explicit accent aliases (bronze) for intentional premium touches
        "accent": '#9c7b45',
        "on-accent": '#ffffff',
        "accent-container": '#f1e7d5',
        "on-accent-container": '#5a4321',

        // --- Status (muted, enterprise) -------------------------------
        "error": '#b23b32',
        "on-error": '#ffffff',
        "error-container": '#f7e3e0',
        "on-error-container": '#7a241d',
        "success": '#1f7a54',
        "on-success": '#ffffff',
        "success-container": '#dfefe7',
        "on-success-container": '#0f4a31',
        "warning": '#b07a1e',
        "on-warning": '#ffffff',
        "warning-container": '#f6ebd5',
        "on-warning-container": '#6b4a0f',
        "info": '#2c6e8f',
        "on-info": '#ffffff',
        "info-container": '#e1edf3',
        "on-info-container": '#123e53',
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        // Warm-tinted (ink) elevation — soft and layered, never hard gray
        "card": "0 1px 2px rgba(28, 26, 22, 0.04), 0 1px 3px rgba(28, 26, 22, 0.05)",
        "card-hover": "0 6px 12px rgba(28, 26, 22, 0.05), 0 14px 30px rgba(28, 26, 22, 0.09)",
        "pop": "0 16px 40px rgba(28, 26, 22, 0.16)",
        "focus-brand": "0 0 0 3px rgba(20, 69, 61, 0.18)",
        "inset-hair": "inset 0 0 0 1px rgba(28, 26, 22, 0.06)"
      },
      spacing: {
        "unit": "8px",
        "section-gap": "80px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "gutter": "24px",
        "container-max": "1280px"
      },
      fontFamily: {
        "sans": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        "display": ["Inter", "system-ui", "sans-serif"],
        "label-md": ["Inter", "system-ui", "sans-serif"],
        "headline-lg-mobile": ["Inter", "system-ui", "sans-serif"],
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-md": ["Inter", "system-ui", "sans-serif"],
        "headline-lg": ["Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.01em", "fontWeight": "500"}],
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0", "fontWeight": "600"}],
        "body-md": ["15px", {"lineHeight": "24px", "fontWeight": "400"}],
        "body-lg": ["17px", {"lineHeight": "28px", "fontWeight": "400"}],
        "headline-md": ["22px", {"lineHeight": "30px", "letterSpacing": "-0.015em", "fontWeight": "600"}],
        "headline-lg": ["30px", {"lineHeight": "38px", "letterSpacing": "-0.022em", "fontWeight": "700"}],
        "headline-lg-mobile": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.015em", "fontWeight": "600"}],
        "display": ["44px", {"lineHeight": "52px", "letterSpacing": "-0.03em", "fontWeight": "800"}]
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "shimmer": {
          from: { backgroundPosition: "-400px 0" },
          to: { backgroundPosition: "400px 0" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "rise-in": "rise-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.2s ease-out both",
        "shimmer": "shimmer 1.4s linear infinite"
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
