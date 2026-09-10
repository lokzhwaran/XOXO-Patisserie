import { z } from "zod";
import { DEFAULT_THEME, THEME_PRESETS, CURATED_FONTS } from "@/lib/theme";

export const themeSchema = z.object({
  colors: z.object({
    background: z.string(),
    foreground: z.string(),
    surface: z.string(),
    primary: z.string(),
    primaryForeground: z.string(),
    secondary: z.string(),
    secondaryForeground: z.string(),
    accent: z.string(),
    accentForeground: z.string(),
    muted: z.string(),
    mutedForeground: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  headingFont: z.string(),
  bodyFont: z.string(),
  baseFontSizePx: z.number().min(12).max(24),
  radiusBasePx: z.number().min(0).max(32),
  buttonStyle: z.enum(["rounded", "pill", "square"]),
  containerMaxWidthPx: z.number().min(960).max(1920),
  sectionSpacingPx: z.number().min(32).max(200),
});

export { DEFAULT_THEME, THEME_PRESETS, CURATED_FONTS };
