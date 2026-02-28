export interface ColorEntry {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background";
}

export function toCssVariables(colors: ColorEntry[]): string {
  const vars = colors
    .map((c) => `  --color-${c.role}: ${c.hex};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}

export function toTailwindConfig(colors: ColorEntry[]): string {
  const entries = colors
    .map((c) => `    ${c.role}: '${c.hex}',`)
    .join("\n");
  return `// tailwind.config.js — extend colors\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      },\n    },\n  },\n};`;
}

export function toFigmaJson(colors: ColorEntry[]): string {
  const figmaColors = colors.map((c) => {
    const hex = c.hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return {
      name: c.name,
      role: c.role,
      hex: c.hex,
      color: { r, g, b, a: 1 },
    };
  });
  return JSON.stringify(figmaColors, null, 2);
}

export function toSvg(colors: ColorEntry[]): string {
  const width = 500;
  const height = 120;
  const swatchWidth = width / colors.length;

  const rects = colors
    .map(
      (c, i) =>
        `  <rect x="${i * swatchWidth}" y="0" width="${swatchWidth}" height="${height}" fill="${c.hex}" />`
    )
    .join("\n");

  const labels = colors
    .map((c, i) => {
      const cx = i * swatchWidth + swatchWidth / 2;
      return `  <text x="${cx}" y="${height - 10}" text-anchor="middle" fill="white" font-size="10" font-family="sans-serif" opacity="0.9">${c.hex}</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${rects}\n${labels}\n</svg>`;
}

export function toJsonArray(colors: ColorEntry[]): string {
  return JSON.stringify(
    colors.map((c) => ({ name: c.name, hex: c.hex, role: c.role })),
    null,
    2
  );
}
