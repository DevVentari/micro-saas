import { parseMetaTags, type MetaResult } from "./og-parser";

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

export async function fetchPageMeta(url: string): Promise<MetaResult> {
  const normalizedUrl = normalizeUrl(url);

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MetaTagz/1.0; +https://metatagz.com/bot) Googlebot/2.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === "AbortError") {
      throw new Error("Request timed out after 10 seconds");
    }
    throw new Error(`Failed to fetch URL: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/xml") && !contentType.includes("application/xhtml")) {
    throw new Error(`URL does not return HTML content (got: ${contentType})`);
  }

  // Read only the first 500KB of HTML to keep things fast
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Unable to read response body");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  const maxBytes = 512 * 1024; // 512KB

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalBytes += value.length;
        if (totalBytes >= maxBytes) break;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const combinedBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combinedBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  const html = new TextDecoder("utf-8", { fatal: false }).decode(combinedBuffer);

  // Use the final URL (after redirects) as the base URL
  const finalUrl = response.url || normalizedUrl;
  const parsed = parseMetaTags(html, finalUrl);

  return {
    url: finalUrl,
    title: parsed.title || "",
    description: parsed.description || "",
    favicon: parsed.favicon || "",
    canonical: parsed.canonical || finalUrl,
    og: parsed.og || {
      title: "",
      description: "",
      image: "",
      url: finalUrl,
      type: "website",
      siteName: "",
    },
    twitter: parsed.twitter || {
      card: "summary",
      title: "",
      description: "",
      image: "",
      creator: "",
    },
    robots: parsed.robots || "",
    fetchedAt: new Date().toISOString(),
  };
}
