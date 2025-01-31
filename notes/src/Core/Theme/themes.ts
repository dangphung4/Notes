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
      secondary: '200 20% 45%',
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
  monokai: {
    light: {
      background: '0 0% 100%',
      foreground: '280 20% 25%',
      muted: '280 10% 95%',
      mutedForeground: '280 20% 50%',
      popover: '0 0% 100%',
      popoverForeground: '280 20% 25%',
      card: '0 0% 100%',
      cardForeground: '280 20% 25%',
      border: '280 10% 85%',
      input: '280 10% 85%',
      primary: '280 65% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '158 64% 40%',
      secondaryForeground: '0 0% 100%',
      accent: '22 100% 60%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '280 65% 45%',
    },
    dark: {
      background: '280 15% 15%',
      foreground: '280 10% 90%',
      muted: '280 15% 20%',
      mutedForeground: '280 10% 70%',
      popover: '280 15% 15%',
      popoverForeground: '280 10% 90%',
      card: '280 15% 15%',
      cardForeground: '280 10% 90%',
      border: '280 15% 25%',
      input: '280 15% 25%',
      primary: '280 65% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '158 64% 40%',
      secondaryForeground: '0 0% 100%',
      accent: '22 100% 60%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '280 65% 60%',
    }
  },
  dracula: {
    light: {
      background: '230 15% 100%',
      foreground: '230 25% 25%',
      muted: '230 15% 95%',
      mutedForeground: '230 25% 50%',
      popover: '230 15% 100%',
      popoverForeground: '230 25% 25%',
      card: '230 15% 100%',
      cardForeground: '230 25% 25%',
      border: '230 15% 85%',
      input: '230 15% 85%',
      primary: '265 89% 78%',
      primaryForeground: '230 25% 25%',
      secondary: '135 94% 65%',
      secondaryForeground: '230 25% 25%',
      accent: '326 100% 74%',
      accentForeground: '230 25% 25%',
      destructive: '0 100% 67%',
      destructiveForeground: '230 25% 25%',
      ring: '265 89% 78%',
    },
    dark: {
      background: '230 15% 15%',
      foreground: '60 30% 96%',
      muted: '230 15% 20%',
      mutedForeground: '60 30% 76%',
      popover: '230 15% 15%',
      popoverForeground: '60 30% 96%',
      card: '230 15% 15%',
      cardForeground: '60 30% 96%',
      border: '230 15% 25%',
      input: '230 15% 25%',
      primary: '265 89% 78%',
      primaryForeground: '230 15% 15%',
      secondary: '135 94% 65%',
      secondaryForeground: '230 15% 15%',
      accent: '326 100% 74%',
      accentForeground: '230 15% 15%',
      destructive: '0 100% 67%',
      destructiveForeground: '230 15% 15%',
      ring: '265 89% 78%',
    }
  },
  nord: {
    light: {
      background: '220 16% 100%',
      foreground: '220 16% 20%',
      muted: '220 16% 95%',
      mutedForeground: '220 16% 45%',
      popover: '220 16% 100%',
      popoverForeground: '220 16% 20%',
      card: '220 16% 100%',
      cardForeground: '220 16% 20%',
      border: '220 16% 85%',
      input: '220 16% 85%',
      primary: '213 32% 52%',
      primaryForeground: '220 16% 100%',
      secondary: '193 43% 67%',
      secondaryForeground: '220 16% 20%',
      accent: '179 25% 65%',
      accentForeground: '220 16% 20%',
      destructive: '354 42% 56%',
      destructiveForeground: '220 16% 100%',
      ring: '213 32% 52%',
    },
    dark: {
      background: '220 16% 22%',
      foreground: '218 27% 94%',
      muted: '220 16% 27%',
      mutedForeground: '218 27% 74%',
      popover: '220 16% 22%',
      popoverForeground: '218 27% 94%',
      card: '220 16% 22%',
      cardForeground: '218 27% 94%',
      border: '220 16% 32%',
      input: '220 16% 32%',
      primary: '213 32% 52%',
      primaryForeground: '220 16% 100%',
      secondary: '193 43% 67%',
      secondaryForeground: '220 16% 20%',
      accent: '179 25% 65%',
      accentForeground: '220 16% 20%',
      destructive: '354 42% 56%',
      destructiveForeground: '220 16% 100%',
      ring: '213 32% 52%',
    }
  },
  github: {
    light: {
      background: '0 0% 100%',
      foreground: '210 12% 16%',
      muted: '210 14% 97%',
      mutedForeground: '215 14% 45%',
      popover: '0 0% 100%',
      popoverForeground: '210 12% 16%',
      card: '0 0% 100%',
      cardForeground: '210 12% 16%',
      border: '216 12% 84%',
      input: '216 12% 84%',
      primary: '212 92% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '212 92% 90%',
      secondaryForeground: '212 92% 45%',
      accent: '215 14% 34%',
      accentForeground: '0 0% 100%',
      destructive: '0 80% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '212 92% 45%',
    },
    dark: {
      background: '215 14% 10%',
      foreground: '210 14% 89%',
      muted: '215 14% 15%',
      mutedForeground: '215 14% 65%',
      popover: '215 14% 10%',
      popoverForeground: '210 14% 89%',
      card: '215 14% 10%',
      cardForeground: '210 14% 89%',
      border: '215 14% 25%',
      input: '215 14% 25%',
      primary: '212 92% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '212 92% 90%',
      secondaryForeground: '212 92% 45%',
      accent: '215 14% 34%',
      accentForeground: '0 0% 100%',
      destructive: '0 80% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '212 92% 45%',
    }
  },
  catppuccin: {
    light: {
      background: '220 27% 98%',
      foreground: '230 14% 20%',
      muted: '220 27% 93%',
      mutedForeground: '230 14% 45%',
      popover: '220 27% 98%',
      popoverForeground: '230 14% 20%',
      card: '220 27% 98%',
      cardForeground: '230 14% 20%',
      border: '220 27% 88%',
      input: '220 27% 88%',
      primary: '316 72% 69%',
      primaryForeground: '230 14% 20%',
      secondary: '183 47% 47%',
      secondaryForeground: '230 14% 20%',
      accent: '249 37% 69%',
      accentForeground: '230 14% 20%',
      destructive: '343 81% 75%',
      destructiveForeground: '230 14% 20%',
      ring: '316 72% 69%',
    },
    dark: {
      background: '230 14% 10%',
      foreground: '220 27% 88%',
      muted: '230 14% 15%',
      mutedForeground: '220 27% 68%',
      popover: '230 14% 10%',
      popoverForeground: '220 27% 88%',
      card: '230 14% 10%',
      cardForeground: '220 27% 88%',
      border: '230 14% 20%',
      input: '230 14% 20%',
      primary: '316 72% 69%',
      primaryForeground: '230 14% 10%',
      secondary: '183 47% 47%',
      secondaryForeground: '230 14% 10%',
      accent: '249 37% 69%',
      accentForeground: '230 14% 10%',
      destructive: '343 81% 75%',
      destructiveForeground: '230 14% 10%',
      ring: '316 72% 69%',
    }
  },
  rosePine: {
    light: {
      background: '350 30% 96%',
      foreground: '350 25% 10%',
      muted: '350 20% 90%',
      mutedForeground: '350 20% 40%',
      popover: '350 30% 96%',
      popoverForeground: '350 25% 10%',
      card: '350 30% 96%',
      cardForeground: '350 25% 10%',
      border: '350 20% 85%',
      input: '350 20% 85%',
      primary: '350 65% 50%',
      primaryForeground: '350 65% 98%',
      secondary: '350 30% 45%',
      secondaryForeground: '0 0% 100%',
      accent: '350 30% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 85% 40%',
      destructiveForeground: '0 85% 97%',
      ring: '350 65% 50%',
    },
    dark: {
      background: '350 30% 10%',
      foreground: '350 25% 90%',
      muted: '350 30% 15%',
      mutedForeground: '350 25% 60%',
      popover: '350 30% 12%',
      popoverForeground: '350 25% 85%',
      card: '350 30% 12%',
      cardForeground: '350 25% 90%',
      border: '350 30% 25%',
      input: '350 30% 25%',
      primary: '350 65% 60%',
      primaryForeground: '350 65% 10%',
      secondary: '350 30% 55%',
      secondaryForeground: '350 30% 12%',
      accent: '350 30% 55%',
      accentForeground: '350 65% 10%',
      destructive: '0 75% 50%',
      destructiveForeground: '0 85% 97%',
      ring: '350 65% 60%',
    }
  },
  gruvbox: {
    light: {
      background: '50 30% 96%',
      foreground: '50 30% 10%',
      muted: '50 20% 90%',
      mutedForeground: '50 20% 40%',
      popover: '50 30% 96%',
      popoverForeground: '50 30% 10%',
      card: '50 30% 96%',
      cardForeground: '50 30% 10%',
      border: '50 20% 85%',
      input: '50 20% 85%',
      primary: '25 75% 45%',
      primaryForeground: '50 30% 96%',
      secondary: '50 30% 45%',
      secondaryForeground: '50 30% 96%',
      accent: '340 65% 45%',
      accentForeground: '50 30% 96%',
      destructive: '0 85% 40%',
      destructiveForeground: '50 30% 96%',
      ring: '25 75% 45%',
    },
    dark: {
      background: '50 10% 15%',
      foreground: '50 10% 90%',
      muted: '50 10% 20%',
      mutedForeground: '50 10% 60%',
      popover: '50 10% 17%',
      popoverForeground: '50 10% 85%',
      card: '50 10% 17%',
      cardForeground: '50 10% 90%',
      border: '50 10% 25%',
      input: '50 10% 25%',
      primary: '25 75% 55%',
      primaryForeground: '50 10% 15%',
      secondary: '50 10% 55%',
      secondaryForeground: '50 10% 15%',
      accent: '340 65% 55%',
      accentForeground: '50 10% 15%',
      destructive: '0 75% 50%',
      destructiveForeground: '50 10% 15%',
      ring: '25 75% 55%',
    }
  },
  solarized: {
    light: {
      background: '44 87% 94%',
      foreground: '196 100% 20%',
      muted: '44 50% 88%',
      mutedForeground: '196 50% 40%',
      popover: '44 87% 94%',
      popoverForeground: '196 100% 20%',
      card: '44 87% 94%',
      cardForeground: '196 100% 20%',
      border: '44 50% 85%',
      input: '44 50% 85%',
      primary: '196 100% 40%',
      primaryForeground: '44 87% 94%',
      secondary: '44 50% 45%',
      secondaryForeground: '44 87% 94%',
      accent: '44 50% 45%',
      accentForeground: '44 87% 94%',
      destructive: '0 85% 40%',
      destructiveForeground: '44 87% 94%',
      ring: '196 100% 40%',
    },
    dark: {
      background: '192 100% 5%',
      foreground: '44 87% 80%',
      muted: '192 50% 10%',
      mutedForeground: '44 50% 60%',
      popover: '192 100% 7%',
      popoverForeground: '44 87% 75%',
      card: '192 100% 7%',
      cardForeground: '44 87% 80%',
      border: '192 50% 15%',
      input: '192 50% 15%',
      primary: '196 100% 50%',
      primaryForeground: '192 100% 5%',
      secondary: '44 50% 55%',
      secondaryForeground: '192 100% 5%',
      accent: '44 50% 55%',
      accentForeground: '192 100% 5%',
      destructive: '0 75% 50%',
      destructiveForeground: '192 100% 5%',
      ring: '196 100% 50%',
    }
  },
  synthwave: {
    light: {
      background: '0 0% 100%',
      foreground: '285 50% 25%',
      muted: '285 30% 95%',
      mutedForeground: '285 30% 50%',
      popover: '0 0% 100%',
      popoverForeground: '285 50% 25%',
      card: '0 0% 100%',
      cardForeground: '285 50% 25%',
      border: '285 30% 85%',
      input: '285 30% 85%',
      primary: '325 90% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '245 80% 65%',
      secondaryForeground: '0 0% 100%',
      accent: '285 80% 65%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 65%',
      destructiveForeground: '0 0% 100%',
      ring: '325 90% 60%',
    },
    dark: {
      background: '285 50% 8%',
      foreground: '285 10% 90%',
      muted: '285 50% 15%',
      mutedForeground: '285 10% 70%',
      popover: '285 50% 10%',
      popoverForeground: '285 10% 85%',
      card: '285 50% 10%',
      cardForeground: '285 10% 90%',
      border: '285 50% 20%',
      input: '285 50% 20%',
      primary: '325 90% 70%',
      primaryForeground: '285 50% 8%',
      secondary: '245 80% 75%',
      secondaryForeground: '285 50% 8%',
      accent: '285 80% 75%',
      accentForeground: '285 50% 8%',
      destructive: '0 100% 75%',
      destructiveForeground: '285 50% 8%',
      ring: '325 90% 70%',
    }
  },
  cyberpunk: {
    light: {
      background: '0 0% 100%',
      foreground: '220 80% 25%',
      muted: '220 30% 95%',
      mutedForeground: '220 30% 50%',
      popover: '0 0% 100%',
      popoverForeground: '220 80% 25%',
      card: '0 0% 100%',
      cardForeground: '220 80% 25%',
      border: '220 30% 85%',
      input: '220 30% 85%',
      primary: '160 100% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '300 100% 50%',
      secondaryForeground: '0 0% 100%',
      accent: '60 100% 50%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 65%',
      destructiveForeground: '0 0% 100%',
      ring: '160 100% 45%',
    },
    dark: {
      background: '220 80% 8%',
      foreground: '220 10% 90%',
      muted: '220 80% 15%',
      mutedForeground: '220 10% 70%',
      popover: '220 80% 10%',
      popoverForeground: '220 10% 85%',
      card: '220 80% 10%',
      cardForeground: '220 10% 90%',
      border: '220 80% 20%',
      input: '220 80% 20%',
      primary: '160 100% 55%',
      primaryForeground: '220 80% 8%',
      secondary: '300 100% 60%',
      secondaryForeground: '220 80% 8%',
      accent: '60 100% 60%',
      accentForeground: '220 80% 8%',
      destructive: '0 100% 75%',
      destructiveForeground: '220 80% 8%',
      ring: '160 100% 55%',
    }
  },
  materialDesign: {
    light: {
      background: '0 0% 100%',
      foreground: '220 20% 20%',
      muted: '220 10% 96%',
      mutedForeground: '220 10% 40%',
      popover: '0 0% 100%',
      popoverForeground: '220 20% 20%',
      card: '0 0% 100%',
      cardForeground: '220 20% 20%',
      border: '220 10% 90%',
      input: '220 10% 90%',
      primary: '265 90% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '200 90% 50%',
      secondaryForeground: '0 0% 100%',
      accent: '340 90% 50%',
      accentForeground: '0 0% 100%',
      destructive: '0 90% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '265 90% 50%',
    },
    dark: {
      background: '220 20% 12%',
      foreground: '220 10% 98%',
      muted: '220 20% 18%',
      mutedForeground: '220 10% 70%',
      popover: '220 20% 12%',
      popoverForeground: '220 10% 98%',
      card: '220 20% 12%',
      cardForeground: '220 10% 98%',
      border: '220 20% 25%',
      input: '220 20% 25%',
      primary: '265 90% 60%',
      primaryForeground: '220 20% 12%',
      secondary: '200 90% 60%',
      secondaryForeground: '220 20% 12%',
      accent: '340 90% 60%',
      accentForeground: '220 20% 12%',
      destructive: '0 90% 60%',
      destructiveForeground: '220 20% 12%',
      ring: '265 90% 60%',
    }
  },
  tokyoNight: {
    light: {
      background: '220 27% 98%',
      foreground: '220 47% 20%',
      muted: '220 27% 93%',
      mutedForeground: '220 47% 50%',
      popover: '220 27% 98%',
      popoverForeground: '220 47% 20%',
      card: '220 27% 98%',
      cardForeground: '220 47% 20%',
      border: '220 27% 88%',
      input: '220 27% 88%',
      primary: '230 75% 60%',
      primaryForeground: '220 27% 98%',
      secondary: '320 70% 65%',
      secondaryForeground: '220 27% 98%',
      accent: '190 95% 45%',
      accentForeground: '220 27% 98%',
      destructive: '0 85% 60%',
      destructiveForeground: '220 27% 98%',
      ring: '230 75% 60%',
    },
    dark: {
      background: '225 27% 15%',
      foreground: '220 47% 90%',
      muted: '225 27% 20%',
      mutedForeground: '220 47% 70%',
      popover: '225 27% 15%',
      popoverForeground: '220 47% 90%',
      card: '225 27% 15%',
      cardForeground: '220 47% 90%',
      border: '225 27% 25%',
      input: '225 27% 25%',
      primary: '230 75% 65%',
      primaryForeground: '225 27% 15%',
      secondary: '320 70% 70%',
      secondaryForeground: '225 27% 15%',
      accent: '190 95% 50%',
      accentForeground: '225 27% 15%',
      destructive: '0 85% 65%',
      destructiveForeground: '225 27% 15%',
      ring: '230 75% 65%',
    }
  },
  ayu: {
    light: {
      background: '0 0% 100%',
      foreground: '200 15% 20%',
      muted: '200 15% 95%',
      mutedForeground: '200 15% 45%',
      popover: '0 0% 100%',
      popoverForeground: '200 15% 20%',
      card: '0 0% 100%',
      cardForeground: '200 15% 20%',
      border: '200 15% 85%',
      input: '200 15% 85%',
      primary: '35 85% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '200 55% 55%',
      secondaryForeground: '0 0% 100%',
      accent: '150 40% 50%',
      accentForeground: '0 0% 100%',
      destructive: '0 75% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '35 85% 55%',
    },
    dark: {
      background: '200 15% 12%',
      foreground: '200 15% 90%',
      muted: '200 15% 18%',
      mutedForeground: '200 15% 65%',
      popover: '200 15% 12%',
      popoverForeground: '200 15% 90%',
      card: '200 15% 12%',
      cardForeground: '200 15% 90%',
      border: '200 15% 25%',
      input: '200 15% 25%',
      primary: '35 85% 65%',
      primaryForeground: '200 15% 12%',
      secondary: '200 55% 65%',
      secondaryForeground: '200 15% 12%',
      accent: '150 40% 60%',
      accentForeground: '200 15% 12%',
      destructive: '0 75% 60%',
      destructiveForeground: '200 15% 12%',
      ring: '35 85% 65%',
    }
  },
  oneDark: {
    light: {
      background: '0 0% 100%',
      foreground: '220 20% 20%',
      muted: '220 20% 96%',
      mutedForeground: '220 20% 45%',
      popover: '0 0% 100%',
      popoverForeground: '220 20% 20%',
      card: '0 0% 100%',
      cardForeground: '220 20% 20%',
      border: '220 20% 88%',
      input: '220 20% 88%',
      primary: '220 90% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '310 90% 50%',
      secondaryForeground: '0 0% 100%',
      accent: '130 60% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 90% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '220 90% 45%',
    },
    dark: {
      background: '220 20% 15%',
      foreground: '220 20% 90%',
      muted: '220 20% 20%',
      mutedForeground: '220 20% 70%',
      popover: '220 20% 15%',
      popoverForeground: '220 20% 90%',
      card: '220 20% 15%',
      cardForeground: '220 20% 90%',
      border: '220 20% 25%',
      input: '220 20% 25%',
      primary: '220 90% 55%',
      primaryForeground: '220 20% 15%',
      secondary: '310 90% 60%',
      secondaryForeground: '220 20% 15%',
      accent: '130 60% 55%',
      accentForeground: '220 20% 15%',
      destructive: '0 90% 60%',
      destructiveForeground: '220 20% 15%',
      ring: '220 90% 55%',
    }
  },
  palenight: {
    light: {
      background: '230 25% 98%',
      foreground: '230 35% 20%',
      muted: '230 25% 93%',
      mutedForeground: '230 35% 45%',
      popover: '230 25% 98%',
      popoverForeground: '230 35% 20%',
      card: '230 25% 98%',
      cardForeground: '230 35% 20%',
      border: '230 25% 88%',
      input: '230 25% 88%',
      primary: '260 80% 50%',
      primaryForeground: '230 25% 98%',
      secondary: '290 70% 50%',
      secondaryForeground: '230 25% 98%',
      accent: '200 95% 45%',
      accentForeground: '230 25% 98%',
      destructive: '0 85% 50%',
      destructiveForeground: '230 25% 98%',
      ring: '260 80% 50%',
    },
    dark: {
      background: '230 25% 18%',
      foreground: '230 35% 90%',
      muted: '230 25% 23%',
      mutedForeground: '230 35% 70%',
      popover: '230 25% 18%',
      popoverForeground: '230 35% 90%',
      card: '230 25% 18%',
      cardForeground: '230 35% 90%',
      border: '230 25% 28%',
      input: '230 25% 28%',
      primary: '260 80% 60%',
      primaryForeground: '230 25% 18%',
      secondary: '290 70% 60%',
      secondaryForeground: '230 25% 18%',
      accent: '200 95% 55%',
      accentForeground: '230 25% 18%',
      destructive: '0 85% 60%',
      destructiveForeground: '230 25% 18%',
      ring: '260 80% 60%',
    }
  },
  cobalt: {
    light: {
      background: '210 50% 98%',
      foreground: '210 50% 20%',
      muted: '210 50% 93%',
      mutedForeground: '210 50% 45%',
      popover: '210 50% 98%',
      popoverForeground: '210 50% 20%',
      card: '210 50% 98%',
      cardForeground: '210 50% 20%',
      border: '210 50% 88%',
      input: '210 50% 88%',
      primary: '210 100% 45%',
      primaryForeground: '210 50% 98%',
      secondary: '250 90% 50%',
      secondaryForeground: '210 50% 98%',
      accent: '180 85% 45%',
      accentForeground: '210 50% 98%',
      destructive: '0 85% 50%',
      destructiveForeground: '210 50% 98%',
      ring: '210 100% 45%',
    },
    dark: {
      background: '210 50% 15%',
      foreground: '210 50% 90%',
      muted: '210 50% 20%',
      mutedForeground: '210 50% 70%',
      popover: '210 50% 15%',
      popoverForeground: '210 50% 90%',
      card: '210 50% 15%',
      cardForeground: '210 50% 90%',
      border: '210 50% 25%',
      input: '210 50% 25%',
      primary: '210 100% 55%',
      primaryForeground: '210 50% 15%',
      secondary: '250 90% 60%',
      secondaryForeground: '210 50% 15%',
      accent: '180 85% 55%',
      accentForeground: '210 50% 15%',
      destructive: '0 85% 60%',
      destructiveForeground: '210 50% 15%',
      ring: '210 100% 55%',
    }
  },
  nightOwl: {
    light: {
      background: '200 30% 98%',
      foreground: '200 40% 10%',
      muted: '200 30% 93%',
      mutedForeground: '200 40% 40%',
      popover: '200 30% 98%',
      popoverForeground: '200 40% 10%',
      card: '200 30% 98%',
      cardForeground: '200 40% 10%',
      border: '200 30% 88%',
      input: '200 30% 88%',
      primary: '220 70% 50%',
      primaryForeground: '200 30% 98%',
      secondary: '180 80% 45%',
      secondaryForeground: '200 30% 98%',
      accent: '280 65% 55%',
      accentForeground: '200 30% 98%',
      destructive: '0 85% 60%',
      destructiveForeground: '200 30% 98%',
      ring: '220 70% 50%',
    },
    dark: {
      background: '200 30% 12%',
      foreground: '200 40% 98%',
      muted: '200 30% 17%',
      mutedForeground: '200 40% 70%',
      popover: '200 30% 12%',
      popoverForeground: '200 40% 98%',
      card: '200 30% 12%',
      cardForeground: '200 40% 98%',
      border: '200 30% 22%',
      input: '200 30% 22%',
      primary: '220 70% 60%',
      primaryForeground: '200 30% 12%',
      secondary: '180 80% 55%',
      secondaryForeground: '200 30% 12%',
      accent: '280 65% 65%',
      accentForeground: '200 30% 12%',
      destructive: '0 85% 70%',
      destructiveForeground: '200 30% 12%',
      ring: '220 70% 60%',
    }
  },
  horizon: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 20%',
      muted: '240 10% 95%',
      mutedForeground: '240 10% 45%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 20%',
      card: '0 0% 100%',
      cardForeground: '240 10% 20%',
      border: '240 10% 85%',
      input: '240 10% 85%',
      primary: '345 95% 65%',
      primaryForeground: '0 0% 100%',
      secondary: '240 50% 65%',
      secondaryForeground: '0 0% 100%',
      accent: '190 95% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 90% 60%',
      destructiveForeground: '0 0% 100%',
      ring: '345 95% 65%',
    },
    dark: {
      background: '240 20% 12%',
      foreground: '240 10% 90%',
      muted: '240 20% 18%',
      mutedForeground: '240 10% 65%',
      popover: '240 20% 12%',
      popoverForeground: '240 10% 90%',
      card: '240 20% 12%',
      cardForeground: '240 10% 90%',
      border: '240 20% 25%',
      input: '240 20% 25%',
      primary: '345 95% 75%',
      primaryForeground: '240 20% 12%',
      secondary: '240 50% 75%',
      secondaryForeground: '240 20% 12%',
      accent: '190 95% 55%',
      accentForeground: '240 20% 12%',
      destructive: '0 90% 70%',
      destructiveForeground: '240 20% 12%',
      ring: '345 95% 75%',
    }
  },
  winterIsComing: {
    light: {
      background: '210 50% 98%',
      foreground: '210 50% 10%',
      muted: '210 40% 93%',
      mutedForeground: '210 40% 40%',
      popover: '210 50% 98%',
      popoverForeground: '210 50% 10%',
      card: '210 50% 98%',
      cardForeground: '210 50% 10%',
      border: '210 40% 88%',
      input: '210 40% 88%',
      primary: '210 100% 50%',
      primaryForeground: '210 50% 98%',
      secondary: '200 80% 55%',
      secondaryForeground: '210 50% 98%',
      accent: '220 70% 55%',
      accentForeground: '210 50% 98%',
      destructive: '0 85% 60%',
      destructiveForeground: '210 50% 98%',
      ring: '210 100% 50%',
    },
    dark: {
      background: '220 40% 10%',
      foreground: '210 50% 90%',
      muted: '220 40% 15%',
      mutedForeground: '210 50% 70%',
      popover: '220 40% 10%',
      popoverForeground: '210 50% 90%',
      card: '220 40% 10%',
      cardForeground: '210 50% 90%',
      border: '220 40% 20%',
      input: '220 40% 20%',
      primary: '210 100% 60%',
      primaryForeground: '220 40% 10%',
      secondary: '200 80% 65%',
      secondaryForeground: '220 40% 10%',
      accent: '220 70% 65%',
      accentForeground: '220 40% 10%',
      destructive: '0 85% 70%',
      destructiveForeground: '220 40% 10%',
      ring: '210 100% 60%',
    }
  },
  monokaiPro: {
    light: {
      background: '0 0% 100%',
      foreground: '280 20% 25%',
      muted: '280 10% 95%',
      mutedForeground: '280 20% 50%',
      popover: '0 0% 100%',
      popoverForeground: '280 20% 25%',
      card: '0 0% 100%',
      cardForeground: '280 20% 25%',
      border: '280 10% 85%',
      input: '280 10% 85%',
      primary: '280 65% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '158 64% 40%',
      secondaryForeground: '0 0% 100%',
      accent: '22 100% 60%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '280 65% 45%',
    },
    dark: {
      background: '280 15% 15%',
      foreground: '280 10% 90%',
      muted: '280 15% 20%',
      mutedForeground: '280 10% 70%',
      popover: '280 15% 15%',
      popoverForeground: '280 10% 90%',
      card: '280 15% 15%',
      cardForeground: '280 10% 90%',
      border: '280 15% 25%',
      input: '280 15% 25%',
      primary: '280 65% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '158 64% 40%',
      secondaryForeground: '0 0% 100%',
      accent: '22 100% 60%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 50%',
      destructiveForeground: '0 0% 100%',
      ring: '280 65% 60%',
    }
  },
  shadesOfPurple: {
    light: {
      background: '0 0% 100%',
      foreground: '265 50% 20%',
      muted: '265 30% 95%',
      mutedForeground: '265 30% 50%',
      popover: '0 0% 100%',
      popoverForeground: '265 50% 20%',
      card: '0 0% 100%',
      cardForeground: '265 50% 20%',
      border: '265 30% 85%',
      input: '265 30% 85%',
      primary: '265 89% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '280 89% 60%',
      secondaryForeground: '0 0% 100%',
      accent: '250 89% 60%',
      accentForeground: '0 0% 100%',
      destructive: '0 100% 60%',
      destructiveForeground: '0 0% 100%',
      ring: '265 89% 60%',
    },
    dark: {
      background: '265 50% 12%',
      foreground: '265 10% 90%',
      muted: '265 50% 18%',
      mutedForeground: '265 10% 70%',
      popover: '265 50% 12%',
      popoverForeground: '265 10% 90%',
      card: '265 50% 12%',
      cardForeground: '265 10% 90%',
      border: '265 50% 25%',
      input: '265 50% 25%',
      primary: '265 89% 70%',
      primaryForeground: '265 50% 12%',
      secondary: '280 89% 70%',
      secondaryForeground: '265 50% 12%',
      accent: '250 89% 70%',
      accentForeground: '265 50% 12%',
      destructive: '0 100% 70%',
      destructiveForeground: '265 50% 12%',
      ring: '265 89% 70%',
    }
  },
} as const;

export type ThemeName = keyof typeof themes; 