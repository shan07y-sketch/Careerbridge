/**
 * CareerBridge brand mark.
 *
 * The mark is a bridge: a suspension arch spanning a deck, with a single node
 * rising at the apex — students crossing from education to career. It is drawn
 * degrades cleanly to a 16px favicon (the arch + deck alone still read as a
 * bridge once the hangers disappear).
 *
 * The mark's own colors are fixed brand values rather than theme tokens: a logo
 * should be one constant asset across light and dark, and it must stay byte-for-
 * byte consistent with `public/favicon.svg` and the Android launcher icon. It
 * also avoids a real contrast failure — under the inverted dark palette the
 * tertiary arch landed on the light primary badge at ~1.2:1 and disappeared.
 * Only the wordmark beside it follows the theme.
 */

/** Fixed brand palette. Keep in sync with public/favicon.svg + ic_launcher_foreground.xml. */
const BRAND_GREEN = '#14453D';
const BRAND_GOLD = '#E8B44A';

type BrandMarkProps = {
  /** Rendered size of the square mark, in pixels. */
  size?: number;
  className?: string;
};

export function BrandMark({ size = 36, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="CareerBridge"
      className={`shrink-0 ${className}`}
    >
      <rect width="48" height="48" rx="12" fill={BRAND_GREEN} />
      <path
        d="M10 33Q24 11 38 33"
        stroke={BRAND_GOLD}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M8 33h32" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
      <path
        d="M15.5 26.4V33M32.5 26.4V33"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".55"
      />
      <circle cx="24" cy="16.4" r="3.6" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * The bridge glyph alone, with no badge behind it — for placement on an
 * already-colored surface (the auth hero, a splash screen). Inherits
 * `currentColor`, so the caller controls the color via text utilities.
 */
export function BrandGlyph({ size = 30, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="CareerBridge"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M5 28Q20 7 35 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity=".65"
      />
      <path d="M3 28h34" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M11 21.5V28M29 21.5V28"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity=".5"
      />
      <circle cx="20" cy="12.2" r="3.3" fill="currentColor" />
    </svg>
  );
}

type BrandLogoProps = BrandMarkProps & {
  /** Small uppercase label under the wordmark, e.g. the active portal name. */
  subtitle?: string;
};

/** The mark paired with the CareerBridge wordmark. */
export function BrandLogo({ size = 36, subtitle, className = '' }: BrandLogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} />
      <span className="text-left leading-tight">
        <span className="block text-body-md font-bold text-on-surface tracking-tight">
          CareerBridge
        </span>
        {subtitle && (
          <span className="block text-[11px] font-semibold text-tertiary uppercase tracking-wider">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}

export default BrandLogo;
