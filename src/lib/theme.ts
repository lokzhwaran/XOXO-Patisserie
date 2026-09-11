import type { Prisma } from "@prisma/client";

/**
 * The shape stored in SiteSettings.theme (Json). Kept separate from the DB row's
 * flat branding fields so admins can swap entire palettes/typography atomically.
 */
export interface ThemeTokens {
  colors: {
    background: string;
    foreground: string;
    surface: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  headingFont: string;
  bodyFont: string;
  baseFontSizePx: number;
  radiusBasePx: number;
  buttonStyle: "rounded" | "pill" | "square";
  containerMaxWidthPx: number;
  sectionSpacingPx: number;
}

export const DEFAULT_THEME: ThemeTokens = {
  colors: {
    background: "#F7F1E8",
    foreground: "#241811",
    surface: "#FFFFFF",
    primary: "#241811",
    primaryForeground: "#FFFFFF",
    secondary: "#F1D8D2",
    secondaryForeground: "#241811",
    accent: "#D98A8F",
    accentForeground: "#FFFFFF",
    muted: "#EFE7DA",
    mutedForeground: "#6B5B4D",
    border: "#E6DCCB",
    success: "#4C8A5E",
    warning: "#C08A2E",
    danger: "#B23B3B",
  },
  headingFont: "Fraunces",
  bodyFont: "Inter",
  baseFontSizePx: 16,
  radiusBasePx: 12,
  buttonStyle: "pill",
  containerMaxWidthPx: 1280,
  sectionSpacingPx: 96,
};

export const THEME_PRESETS: Record<string, ThemeTokens> = {
  "Warm Cocoa": DEFAULT_THEME,
  "Cream & Sage": {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      background: "#F7F6F0",
      foreground: "#2E3324",
      primary: "#7C8F6A",
      secondary: "#E4E2D4",
      accent: "#C98A5E",
    },
  },
  "Midnight Bakery": {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      background: "#191512",
      foreground: "#F3EEE7",
      surface: "#241E19",
      primary: "#D8A05C",
      secondary: "#332A23",
      secondaryForeground: "#F3EEE7",
      accent: "#8FA37C",
      muted: "#2B241F",
      mutedForeground: "#C9C0B4",
      border: "#3A312A",
    },
  },
  "Blush Pastel": {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      background: "#FDF3F1",
      foreground: "#4A2E2A",
      primary: "#D98A8F",
      secondary: "#F6DDD8",
      accent: "#A8C1B8",
    },
  },
  "Monochrome": {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      background: "#FAFAFA",
      foreground: "#1A1A1A",
      surface: "#FFFFFF",
      primary: "#1A1A1A",
      primaryForeground: "#FFFFFF",
      secondary: "#E5E5E5",
      secondaryForeground: "#1A1A1A",
      accent: "#4D4D4D",
      muted: "#F0F0F0",
      mutedForeground: "#666666",
      border: "#DDDDDD",
    },
  },
};

/** Curated Google Fonts appropriate for a bakery brand (serif display + clean sans pairings). */
export const CURATED_FONTS = [
  "Fraunces", "Playfair Display", "Cormorant Garamond", "Lora", "Prata",
  "DM Serif Display", "Libre Baskerville", "Marcellus", "Bodoni Moda",
  "Cardo", "Inter", "Poppins", "Nunito Sans", "Work Sans", "Sora",
  "Manrope", "Karla", "Outfit", "Jost", "Mulish",
];

export function themeToCssVars(theme: ThemeTokens): string {
  const c = theme.colors;
  const radiusBase = theme.radiusBasePx || 12;
  const radiusSm = Math.round(radiusBase * 0.5);
  const radiusLg = Math.round(radiusBase * 1.5);
  return `
    --color-background: ${c.background};
    --color-foreground: ${c.foreground};
    --color-surface: ${c.surface};
    --color-primary: ${c.primary};
    --color-primary-foreground: ${c.primaryForeground};
    --color-secondary: ${c.secondary};
    --color-secondary-foreground: ${c.secondaryForeground};
    --color-accent: ${c.accent};
    --color-accent-foreground: ${c.accentForeground};
    --color-muted: ${c.muted};
    --color-muted-foreground: ${c.mutedForeground};
    --color-border: ${c.border};
    --color-success: ${c.success};
    --color-warning: ${c.warning};
    --color-danger: ${c.danger};
    --font-heading: "${theme.headingFont}", serif;
    --font-body: "${theme.bodyFont}", sans-serif;
    --radius-base: ${theme.buttonStyle === "square" ? "0px" : `${radiusBase}px`};
    --radius-sm: ${theme.buttonStyle === "square" ? "0px" : `${radiusSm}px`};
    --radius-lg: ${theme.buttonStyle === "square" ? "0px" : `${radiusLg}px`};
    --container-max: ${theme.containerMaxWidthPx}px;
    --section-spacing: ${theme.sectionSpacingPx}px;
    font-size: ${theme.baseFontSizePx}px;
  `.trim();
}

export function googleFontsHref(theme: ThemeTokens): string {
  const families = Array.from(new Set([theme.headingFont, theme.bodyFont]))
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** WCAG contrast ratio check between two hex colors (simple relative-luminance formula). */
export function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const rgb = hex
      .replace("#", "")
      .match(/.{1,2}/g)!
      .map((h) => parseInt(h, 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1);
  const l2 = lum(hex2);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseThemeJson(json: Prisma.JsonValue): ThemeTokens {
  try {
    return { ...DEFAULT_THEME, ...(json as object) } as ThemeTokens;
  } catch {
    return DEFAULT_THEME;
  }
}
