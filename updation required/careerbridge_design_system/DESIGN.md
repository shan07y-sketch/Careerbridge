---
name: CareerBridge Design System
colors:
  surface: '#f9faf7'
  surface-dim: '#d9dad8'
  surface-bright: '#f9faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f1'
  surface-container: '#edeeeb'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#404945'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#f0f1ee'
  outline: '#717975'
  outline-variant: '#c0c8c3'
  surface-tint: '#3a6757'
  primary: '#001f16'
  on-primary: '#ffffff'
  primary-container: '#023629'
  on-primary-container: '#72a08e'
  inverse-primary: '#a1d1be'
  secondary: '#655e4c'
  on-secondary: '#ffffff'
  secondary-container: '#e9dfc8'
  on-secondary-container: '#696250'
  tertiary: '#0b1e16'
  on-tertiary: '#ffffff'
  tertiary-container: '#20332b'
  on-tertiary-container: '#879b91'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcedd9'
  primary-fixed-dim: '#a1d1be'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#214f40'
  secondary-fixed: '#ece2cb'
  secondary-fixed-dim: '#cfc6b0'
  on-secondary-fixed: '#201b0d'
  on-secondary-fixed-variant: '#4c4635'
  tertiary-fixed: '#d2e8db'
  tertiary-fixed-dim: '#b6ccc0'
  on-tertiary-fixed: '#0c1f18'
  on-tertiary-fixed-variant: '#384b42'
  background: '#f9faf7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e0'
typography:
  display:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 80px
---

## Brand & Style
The design system is rooted in the intersection of traditional institutional trust and modern technological precision. It targets a sophisticated audience of high-achieving students, top-tier recruiters, and university administrators who value efficiency and professional gravitas.

The aesthetic follows a **Premium Corporate Minimalism** approach. It avoids the fleeting trends of neon gradients or heavy transparency in favor of structural clarity, generous whitespace, and a high-fidelity tactile feel. The emotional response should be one of "calm confidence"—the interface stays out of the way of the user’s career trajectory while providing a sturdy, elegant framework for growth. Inspiration is drawn from the editorial precision of premium SaaS tools like Linear and the material quality of physical stationery.

## Colors
The palette is organic and grounded, moving away from the typical "tech blue" to establish a unique, premium identity. 

- **Primary (Deep Forest Green):** Used for core branding, primary actions, and high-level headings. It represents stability and growth.
- **Secondary (Warm Sand):** Used for subtle highlights, secondary buttons, and decorative structural elements. It softens the interface and adds a "human" academic feel.
- **Background & Surface:** The `Warm Off White` background reduces eye strain and provides a sophisticated canvas, while `Pure White` is reserved for elevated cards and input areas to create a clear visual hierarchy.
- **Neutrals:** Use varying opacities of the Primary Green for text (85% for body, 60% for captions) rather than pure black to maintain a cohesive, high-end look.

## Typography
Manrope is utilized across all levels to maintain a systematic, modern feel. The typography relies on generous line heights and tight letter-spacing on larger headings to achieve a "designed" editorial look.

Headlines should always use the Primary color. Body text should maintain high legibility with the `body-md` role for the majority of interface text. `Label-sm` should be used sparingly for metadata, often in all-caps with slight letter spacing to differentiate it from interactive text elements.

## Layout & Spacing
The layout philosophy is a **Fixed Grid with Fluid Margins**. Content is contained within a 1280px max-width container to ensure readability on ultra-wide monitors.

A 12-column grid is used for desktop, 8 columns for tablet, and 4 columns for mobile. This design system prioritizes vertical rhythm, using a strict 8px base unit. Sections are separated by significant gaps (80px+) to emphasize the "Minimalist" brand personality and allow the user to focus on one task at a time. Elements within a card or module should use the `stack-md` (16px) spacing for consistent grouping.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Level 0 (Background):** `Warm Off White`. Used for the main canvas.
- **Level 1 (Surface):** `White`. Used for cards, containers, and navigation bars. These should feature a very soft, diffused shadow: `0 4px 20px rgba(2, 54, 41, 0.04)`.
- **Level 2 (Interaction):** When a user interacts with a card or opens a menu, the shadow increases in spread and the element may lift slightly (1-2px).
- **Outlines:** Use a 1px stroke of `Primary Green` at 8% opacity for containers to provide definition without looking "heavy."

## Shapes
The shape language is consistently rounded to evoke a modern, approachable feel. The standard corner radius for primary containers and cards is **16px** (`rounded-lg`). 

Buttons and input fields follow an **8px** radius to feel more precise and functional. Small tags or chips may use a fully rounded "pill" shape to distinguish them from interactive buttons. Avoid any sharp 0px corners, as they conflict with the "warm" and "welcoming" brand promise.

## Components
- **Buttons:** Primary buttons use a solid `Primary Green` fill with white text. Secondary buttons use a `Warm Sand` fill with `Primary Green` text. Ghost buttons use only text with a subtle hover state.
- **Cards:** White surfaces with 16px corner radius and ambient shadows. Header areas within cards should have a subtle bottom border (1px, 8% Primary Green).
- **Inputs:** Background should be slightly off-white or transparent with a 1px `Primary Green` (15% opacity) border. On focus, the border becomes 100% Primary Green with a soft outer glow.
- **Chips/Tags:** Used for skills or job categories. These should have a `Warm Sand` background at 40% opacity to remain secondary to the main content.
- **Lists:** High-density lists (like job boards) should use generous vertical padding (16px-20px) between items and subtle dividers.
- **AI Features:** Any AI-powered component (like resume suggestions) should be designated by a subtle `Secondary` color border or a small, elegant spark icon—never a heavy gradient.