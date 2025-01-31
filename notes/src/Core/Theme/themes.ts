export type ThemeColors = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  ring: string;
};

export const themes = {
  default: {
    light: {
      background: '252 62% 99%',
      foreground: '252 67% 2%',
      muted: '72 22% 94%',
      mutedForeground: '72 1% 39%',
      popover: '252 62% 98%',
      popoverForeground: '252 67% 1%',
      card: '252 62% 98%',
      cardForeground: '252 67% 1%',
      border: '252 3% 94%',
      input: '252 3% 94%',
      primary: '252 11% 35%',
      primaryForeground: '252 11% 95%',
      secondary: '72 11% 35%',
      secondaryForeground: '0 0% 100%',
      accent: '72 11% 35%',
      accentForeground: '0 0% 100%',
      destructive: '15 99% 31%',
      destructiveForeground: '15 99% 91%',
      ring: '252 11% 35%',
    },
    dark: {
      background: '240 13.73% 10%',
      foreground: '229.76 31.78% 74.71%',
      muted: '232.5 15.44% 18.32%',
      mutedForeground: '233.79 11.37% 50%',
      popover: '234.55 17.46% 12.35%',
      popoverForeground: '234 12.4% 52.55%',
      card: '234.55 17.46% 12.35%',
      cardForeground: '229.76 31.78% 74.71%',
      border: '232.5 15.38% 30.59%',
      input: '232 20% 14.71%',
      primary: '0 0% 82.75%',
      primaryForeground: '0 0% 20%',
      secondary: '225.45 71.22% 72.75%',
      secondaryForeground: '234.55 17.46% 12.35%',
      accent: '234.55 17.83% 9.47%',
      accentForeground: '0 0% 82.75%',
      destructive: '1.58 47.5% 52.94%',
      destructiveForeground: '210 40% 98.04%',
      ring: '225.45 71.22% 72.75%',
    },
  },
  forest: {
    light: {
      background: '120 25% 95%',
      foreground: '120 40% 10%',
      muted: '120 15% 90%',
      mutedForeground: '120 10% 40%',
      popover: '120 25% 98%',
      popoverForeground: '120 40% 10%',
      card: '120 25% 98%',
      cardForeground: '120 40% 10%',
      border: '120 20% 85%',
      input: '120 20% 85%',
      primary: '120 40% 35%',
      primaryForeground: '120 40% 98%',
      secondary: '120 30% 40%',
      secondaryForeground: '0 0% 100%',
      accent: '120 30% 40%',
      accentForeground: '0 0% 100%',
      destructive: '0 85% 40%',
      destructiveForeground: '0 85% 97%',
      ring: '120 40% 35%',
    },
    dark: {
      background: '120 15% 8%',
      foreground: '120 10% 85%',
      muted: '120 15% 15%',
      mutedForeground: '120 10% 60%',
      popover: '120 15% 12%',
      popoverForeground: '120 10% 80%',
      card: '120 15% 12%',
      cardForeground: '120 10% 85%',
      border: '120 15% 25%',
      input: '120 15% 25%',
      primary: '120 40% 60%',
      primaryForeground: '120 40% 10%',
      secondary: '120 30% 55%',
      secondaryForeground: '120 15% 12%',
      accent: '120 30% 55%',
      accentForeground: '120 40% 10%',
      destructive: '0 75% 50%',
      destructiveForeground: '0 85% 97%',
      ring: '120 40% 60%',
    },
  },
  ocean: {
    light: {
      background: '200 25% 98%',
      foreground: '200 50% 10%',
      muted: '200 20% 93%',
      mutedForeground: '200 15% 40%',
      popover: '200 25% 98%',
      popoverForeground: '200 50% 10%',
      card: '200 25% 98%',
      cardForeground: '200 50% 10%',
      border: '200 20% 88%',
      input: '200 20% 88%',
      primary: '200 60% 40%',
      primaryForeground: '200 60% 98%',
      secondary: '200 40% 45%',
      secondaryForeground: '0 0% 100%',
      accent: '200 40% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 85% 40%',
      destructiveForeground: '0 85% 97%',
      ring: '200 60% 40%',
    },
    dark: {
      background: '200 50% 8%',
      foreground: '200 20% 85%',
      muted: '200 40% 15%',
      mutedForeground: '200 20% 60%',
      popover: '200 45% 12%',
      popoverForeground: '200 20% 80%',
      card: '200 45% 12%',
      cardForeground: '200 20% 85%',
      border: '200 40% 25%',
      input: '200 40% 25%',
      primary: '200 60% 60%',
      primaryForeground: '200 60% 10%',
      secondary: '200 40% 55%',
      secondaryForeground: '200 45% 12%',
      accent: '200 40% 55%',
      accentForeground: '200 60% 10%',
      destructive: '0 75% 50%',
      destructiveForeground: '0 85% 97%',
      ring: '200 60% 60%',
    },
  },
} as const;

export type ThemeName = keyof typeof themes; 