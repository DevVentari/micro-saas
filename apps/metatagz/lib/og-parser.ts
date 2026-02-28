export interface MetaResult {
  url: string;
  title: string;
  description: string;
  favicon: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
    creator: string;
  };
  robots: string;
  fetchedAt: string;
}

function extractAttribute(tag: string, attr: string): string {
  // Handles both single and double quotes, and attribute order variations
  const patterns = [
    new RegExp(`${attr}=["']([^"']*)["']`, "i"),
    new RegExp(`${attr}=([^\\s>]+)`, "i"),
  ];
  for (const pattern of patterns) {
    const match = tag.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function getMetaContent(html: string, nameOrProperty: string): string {
  // Match <meta name="..." content="..."> or <meta property="..." content="...">
  // Also handles content before name/property attribute
  const patterns = [
    // name/property first, then content
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${nameOrProperty}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    // content first, then name/property
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${nameOrProperty}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] !== undefined) return decodeHtmlEntities(match[1].trim());
  }
  return "";
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    } catch {
      return `https:${url}`;
    }
  }
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (match && match[1]) return decodeHtmlEntities(match[1].trim());
  return "";
}

function extractCanonical(html: string): string {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
  if (match && match[1]) return match[1].trim();
  return "";
}

function extractFavicon(html: string, baseUrl: string): string {
  // Try various favicon link types in order of preference
  const faviconPatterns = [
    /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']*)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']*)["'][^>]*>/i,
  ];

  for (const pattern of faviconPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return resolveUrl(match[1].trim(), baseUrl);
    }
  }

  // Default to /favicon.ico
  try {
    const base = new URL(baseUrl);
    return `${base.origin}/favicon.ico`;
  } catch {
    return "";
  }
}

export function parseMetaTags(html: string, baseUrl: string): Partial<MetaResult> {
  const title = extractTitle(html);
  const description = getMetaContent(html, "description");
  const robots = getMetaContent(html, "robots");
  const canonical = resolveUrl(extractCanonical(html), baseUrl);
  const favicon = extractFavicon(html, baseUrl);

  // Open Graph tags
  const ogTitle = getMetaContent(html, "og:title");
  const ogDescription = getMetaContent(html, "og:description");
  const ogImageRaw = getMetaContent(html, "og:image");
  const ogImage = resolveUrl(ogImageRaw, baseUrl);
  const ogUrl = getMetaContent(html, "og:url");
  const ogType = getMetaContent(html, "og:type");
  const ogSiteName = getMetaContent(html, "og:site_name");

  // Twitter Card tags
  const twitterCard = getMetaContent(html, "twitter:card");
  const twitterTitle = getMetaContent(html, "twitter:title");
  const twitterDescription = getMetaContent(html, "twitter:description");
  const twitterImageRaw = getMetaContent(html, "twitter:image");
  const twitterImage = resolveUrl(twitterImageRaw, baseUrl);
  const twitterCreator = getMetaContent(html, "twitter:creator");

  return {
    url: baseUrl,
    title,
    description,
    favicon,
    canonical: canonical || baseUrl,
    og: {
      title: ogTitle || title,
      description: ogDescription || description,
      image: ogImage,
      url: ogUrl || baseUrl,
      type: ogType || "website",
      siteName: ogSiteName,
    },
    twitter: {
      card: twitterCard || "summary",
      title: twitterTitle || ogTitle || title,
      description: twitterDescription || ogDescription || description,
      image: twitterImage || ogImage,
      creator: twitterCreator,
    },
    robots,
    fetchedAt: new Date().toISOString(),
  };
}
