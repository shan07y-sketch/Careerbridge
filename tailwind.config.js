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
        // Semantic color tokens are CSS variables (RGB channels) defined in
        // src/index.css (:root = light, .dark = dark). Tailwind opacity
        // modifiers (e.g. bg-surface/70) work via the <alpha-value> channel.
        "surface": "rgb(var(--c-surface) / <alpha-value>)",
        "surface-dim": "rgb(var(--c-surface-dim) / <alpha-value>)",
        "surface-bright": "rgb(var(--c-surface-bright) / <alpha-value>)",
        "surface-container-lowest": "rgb(var(--c-surface-container-lowest) / <alpha-value>)",
        "surface-container-low": "rgb(var(--c-surface-container-low) / <alpha-value>)",
        "surface-container": "rgb(var(--c-surface-container) / <alpha-value>)",
        "surface-container-high": "rgb(var(--c-surface-container-high) / <alpha-value>)",
        "surface-container-highest": "rgb(var(--c-surface-container-highest) / <alpha-value>)",
        "on-surface": "rgb(var(--c-on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--c-on-surface-variant) / <alpha-value>)",
        "inverse-surface": "rgb(var(--c-inverse-surface) / <alpha-value>)",
        "inverse-on-surface": "rgb(var(--c-inverse-on-surface) / <alpha-value>)",
        "outline": "rgb(var(--c-outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--c-outline-variant) / <alpha-value>)",
        "surface-tint": "rgb(var(--c-surface-tint) / <alpha-value>)",
        "surface-variant": "rgb(var(--c-surface-variant) / <alpha-value>)",
        "background": "rgb(var(--c-background) / <alpha-value>)",
        "on-background": "rgb(var(--c-on-background) / <alpha-value>)",
        "primary": "rgb(var(--c-primary) / <alpha-value>)",
        "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",
        "primary-container": "rgb(var(--c-primary-container) / <alpha-value>)",
        "on-primary-container": "rgb(var(--c-on-primary-container) / <alpha-value>)",
        "inverse-primary": "rgb(var(--c-inverse-primary) / <alpha-value>)",
        "primary-fixed": "rgb(var(--c-primary-fixed) / <alpha-value>)",
        "primary-fixed-dim": "rgb(var(--c-primary-fixed-dim) / <alpha-value>)",
        "on-primary-fixed": "rgb(var(--c-on-primary-fixed) / <alpha-value>)",
        "on-primary-fixed-variant": "rgb(var(--c-on-primary-fixed-variant) / <alpha-value>)",
        "secondary": "rgb(var(--c-secondary) / <alpha-value>)",
        "on-secondary": "rgb(var(--c-on-secondary) / <alpha-value>)",
        "secondary-container": "rgb(var(--c-secondary-container) / <alpha-value>)",
        "on-secondary-container": "rgb(var(--c-on-secondary-container) / <alpha-value>)",
        "secondary-fixed": "rgb(var(--c-secondary-fixed) / <alpha-value>)",
        "secondary-fixed-dim": "rgb(var(--c-secondary-fixed-dim) / <alpha-value>)",
        "on-secondary-fixed": "rgb(var(--c-on-secondary-fixed) / <alpha-value>)",
        "on-secondary-fixed-variant": "rgb(var(--c-on-secondary-fixed-variant) / <alpha-value>)",
        "tertiary": "rgb(var(--c-tertiary) / <alpha-value>)",
        "on-tertiary": "rgb(var(--c-on-tertiary) / <alpha-value>)",
        "tertiary-container": "rgb(var(--c-tertiary-container) / <alpha-value>)",
        "on-tertiary-container": "rgb(var(--c-on-tertiary-container) / <alpha-value>)",
        "tertiary-fixed": "rgb(var(--c-tertiary-fixed) / <alpha-value>)",
        "tertiary-fixed-dim": "rgb(var(--c-tertiary-fixed-dim) / <alpha-value>)",
        "on-tertiary-fixed": "rgb(var(--c-on-tertiary-fixed) / <alpha-value>)",
        "on-tertiary-fixed-variant": "rgb(var(--c-on-tertiary-fixed-variant) / <alpha-value>)",
        "accent": "rgb(var(--c-accent) / <alpha-value>)",
        "on-accent": "rgb(var(--c-on-accent) / <alpha-value>)",
        "accent-container": "rgb(var(--c-accent-container) / <alpha-value>)",
        "on-accent-container": "rgb(var(--c-on-accent-container) / <alpha-value>)",
        "error": "rgb(var(--c-error) / <alpha-value>)",
        "on-error": "rgb(var(--c-on-error) / <alpha-value>)",
        "error-container": "rgb(var(--c-error-container) / <alpha-value>)",
        "on-error-container": "rgb(var(--c-on-error-container) / <alpha-value>)",
        "success": "rgb(var(--c-success) / <alpha-value>)",
        "on-success": "rgb(var(--c-on-success) / <alpha-value>)",
        "success-container": "rgb(var(--c-success-container) / <alpha-value>)",
        "on-success-container": "rgb(var(--c-on-success-container) / <alpha-value>)",
        "warning": "rgb(var(--c-warning) / <alpha-value>)",
        "on-warning": "rgb(var(--c-on-warning) / <alpha-value>)",
        "warning-container": "rgb(var(--c-warning-container) / <alpha-value>)",
        "on-warning-container": "rgb(var(--c-on-warning-container) / <alpha-value>)",
        "info": "rgb(var(--c-info) / <alpha-value>)",
        "on-info": "rgb(var(--c-on-info) / <alpha-value>)",
        "info-container": "rgb(var(--c-info-container) / <alpha-value>)",
        "on-info-container": "rgb(var(--c-on-info-container) / <alpha-value>)",
        white: "#ffffff",
        black: "#000000",
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
