export type MoodName =
  | "Professional"
  | "Playful"
  | "Elegant"
  | "Nature"
  | "Tech"
  | "Warm"
  | "Cool"
  | "Bold";

interface MoodTokens {
  radius: string;
  heroPy: string;
  sectionPy: string;
  cardP: string;
  fontScale: number;
  tracking: string;
  weight: number;
  heroMax: string;
}

const MOOD_TOKENS: Record<MoodName, MoodTokens> = {
  Professional: { radius: "0.375rem", heroPy: "5rem",  sectionPy: "3rem", cardP: "1.5rem",  fontScale: 1.0,  tracking: "-0.025em", weight: 600, heroMax: "48rem" },
  Playful:      { radius: "1.5rem",   heroPy: "8rem",  sectionPy: "5rem", cardP: "2rem",    fontScale: 1.15, tracking: "0em",      weight: 700, heroMax: "56rem" },
  Elegant:      { radius: "0.75rem",  heroPy: "10rem", sectionPy: "5rem", cardP: "2rem",    fontScale: 0.95, tracking: "0.05em",   weight: 300, heroMax: "40rem" },
  Nature:       { radius: "1rem",     heroPy: "7rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 1.0,  tracking: "0em",      weight: 400, heroMax: "48rem" },
  Tech:         { radius: "0.125rem", heroPy: "4rem",  sectionPy: "3rem", cardP: "1.25rem", fontScale: 0.9,  tracking: "0.04em",   weight: 500, heroMax: "52rem" },
  Warm:         { radius: "1.25rem",  heroPy: "6rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 1.0,  tracking: "0em",      weight: 500, heroMax: "48rem" },
  Cool:         { radius: "0.25rem",  heroPy: "8rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 0.9,  tracking: "0.08em",   weight: 300, heroMax: "44rem" },
  Bold:         { radius: "0.25rem",  heroPy: "9rem",  sectionPy: "5rem", cardP: "2rem",    fontScale: 1.25, tracking: "-0.04em",  weight: 900, heroMax: "64rem" },
};

export function getMoodTokens(mood: string): MoodTokens {
  return MOOD_TOKENS[mood as MoodName] ?? MOOD_TOKENS.Professional;
}

export function buildMoodVars(mood: string): string {
  const t = getMoodTokens(mood);
  return [
    `  --mood-radius: ${t.radius};`,
    `  --mood-hero-py: ${t.heroPy};`,
    `  --mood-section-py: ${t.sectionPy};`,
    `  --mood-card-p: ${t.cardP};`,
    `  --mood-font-scale: ${t.fontScale};`,
    `  --mood-tracking: ${t.tracking};`,
    `  --mood-weight: ${t.weight};`,
    `  --mood-hero-max: ${t.heroMax};`,
  ].join("\n");
}
