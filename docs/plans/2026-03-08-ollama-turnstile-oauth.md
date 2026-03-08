# Ollama + Turnstile + OAuth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Gemini AI with self-hosted Ollama (qwen2.5:3b) on LXC 204, add Cloudflare Turnstile bot protection, enable Google OAuth, wire up AdSense, and verify Stripe live config.

**Architecture:** Ollama runs in Docker on LXC 204 (192.168.1.15), exposed internally on port 11434. Caddy (LXC 202) proxies `ollama.nerdt.au` with bearer token auth. Cloudflare Tunnel makes it reachable by Vercel. palettai calls Ollama's OpenAI-compatible endpoint with `response_format: json_object`. Turnstile widget in frontend generates a token verified server-side before any AI call.

**Tech Stack:** Docker (Ollama), Caddy (auth proxy), Cloudflare Tunnel, Next.js 15 (palettai), `@marsidev/react-turnstile`, Vercel env vars, Supabase Auth (Google OAuth), Google AdSense

---

## Task 1: Bump LXC 204 RAM to 4GB

qwen2.5:3b requires ~2.3GB RAM. LXC 204 currently has 2GB — not enough.

**Files:** None (Proxmox host command)

**Step 1: Stop LXC 204**
```bash
ssh root@192.168.1.220 'pct stop 204'
```

**Step 2: Increase RAM**
```bash
ssh root@192.168.1.220 'pct set 204 --memory 4096'
```

**Step 3: Start LXC 204**
```bash
ssh root@192.168.1.220 'pct start 204'
```

**Step 4: Verify**
```bash
ssh root@192.168.1.220 'pct exec 204 -- free -h | grep Mem'
```
Expected: `Mem: 3.8Gi ...`

**Step 5: Confirm existing Docker services still running**
```bash
ssh root@192.168.1.220 'pct exec 204 -- docker ps'
```
Expected: homepage container running

---

## Task 2: Ollama Docker on LXC 204

**Files:**
- Create: `/opt/ollama/docker-compose.yml` (on LXC 204)
- Create: `/opt/ollama/.env` (on LXC 204)

**Step 1: Create directories and env file**
```bash
ssh root@192.168.1.220 'pct exec 204 -- bash -c "mkdir -p /opt/ollama && echo OLLAMA_API_KEY=$(openssl rand -hex 32) > /opt/ollama/.env && cat /opt/ollama/.env"'
```
Copy the generated key — you'll need it for Caddy and Vercel.

**Step 2: Create docker-compose.yml**

Write to `/opt/ollama/docker-compose.yml` on LXC 204:
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    env_file: .env

volumes:
  ollama_data:
```

```bash
ssh root@192.168.1.220 'pct exec 204 -- bash -c "cat > /opt/ollama/docker-compose.yml << '\''EOF'\''
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - \"11434:11434\"
    volumes:
      - ollama_data:/root/.ollama
    env_file: .env

volumes:
  ollama_data:
EOF"'
```

**Step 3: Start Ollama**
```bash
ssh root@192.168.1.220 'pct exec 204 -- bash -c "cd /opt/ollama && docker compose up -d"'
```

**Step 4: Pull qwen2.5:3b (takes 2-5 min)**
```bash
ssh root@192.168.1.220 'pct exec 204 -- docker exec ollama ollama pull qwen2.5:3b'
```

**Step 5: Test Ollama is responding**
```bash
ssh root@192.168.1.220 'pct exec 204 -- curl -s http://localhost:11434/api/tags | head -c 200'
```
Expected: JSON with `qwen2.5:3b` in models list.

**Step 6: Test JSON generation**
```bash
ssh root@192.168.1.220 'pct exec 204 -- curl -s http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"qwen2.5:3b\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with JSON: {\\\"ok\\\": true}\"}],\"response_format\":{\"type\":\"json_object\"}}" | head -c 300'
```
Expected: response contains `{"ok": true}` in content.

---

## Task 3: Caddy Config for ollama.nerdt.au

Caddy validates the Authorization header before proxying — no relying on Ollama's own auth.

**Files:**
- Modify: `/etc/caddy/Caddyfile` (on LXC 202)

**Step 1: Get the OLLAMA_API_KEY you generated in Task 2**
```bash
ssh root@192.168.1.220 'pct exec 204 -- cat /opt/ollama/.env'
```

**Step 2: Check current Caddyfile end**
```bash
ssh root@192.168.1.220 'pct exec 202 -- tail -20 /etc/caddy/Caddyfile'
```

**Step 3: Append ollama site block to Caddyfile**

Add this block (replace `YOUR_KEY` with the actual key from .env):
```
ollama.nerdt.au {
    tls { dns cloudflare {env.CF_API_TOKEN} }
    @authed header Authorization "Bearer YOUR_KEY"
    handle @authed {
        reverse_proxy 192.168.1.15:11434
    }
    respond 401
}
```

```bash
ssh root@192.168.1.220 'pct exec 202 -- bash -c "cat >> /etc/caddy/Caddyfile << '\''EOF'\''

ollama.nerdt.au {
    tls { dns cloudflare {env.CF_API_TOKEN} }
    @authed header Authorization \"Bearer YOUR_KEY\"
    handle @authed {
        reverse_proxy 192.168.1.15:11434
    }
    respond 401
}
EOF"'
```

**Step 4: Validate and reload Caddy**
```bash
ssh root@192.168.1.220 'pct exec 202 -- caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy'
```
Expected: `Valid configuration.`

**Step 5: Test from within the LAN (no auth — expect 401)**
```bash
ssh root@192.168.1.220 'curl -s -o /dev/null -w "%{http_code}" http://192.168.1.11 -H "Host: ollama.nerdt.au"'
```
Expected: `401`

**Step 6: Test with auth header**
```bash
ssh root@192.168.1.220 'curl -s -o /dev/null -w "%{http_code}" http://192.168.1.11/api/tags -H "Host: ollama.nerdt.au" -H "Authorization: Bearer YOUR_KEY"'
```
Expected: `200`

---

## Task 4: Cloudflare Tunnel — Add ollama.nerdt.au

Cloudflared runs as a systemd service on LXC 202 (Caddy). All traffic routes through Caddy at `localhost:443`. Tunnel ID: `52793a1a-37be-4669-8855-b56232eb3546`.

**Step 1: Add ingress rule to /etc/cloudflared/config.yml on LXC 202**

Insert before the final `- service: http_status:404` line:
```yaml
  - hostname: ollama.nerdt.au
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
      originServerName: ollama.nerdt.au
```

```bash
ssh root@192.168.1.220 'pct exec 202 -- sed -i "/- service: http_status:404/i\\  - hostname: ollama.nerdt.au\n    service: https://localhost:443\n    originRequest:\n      noTLSVerify: true\n      originServerName: ollama.nerdt.au" /etc/cloudflared/config.yml'
```

Verify:
```bash
ssh root@192.168.1.220 'pct exec 202 -- cat /etc/cloudflared/config.yml'
```

**Step 2: Add DNS CNAME in Cloudflare**
```bash
ssh root@192.168.1.220 'pct exec 202 -- cloudflared tunnel route dns 52793a1a-37be-4669-8855-b56232eb3546 ollama.nerdt.au'
```

**Step 3: Restart cloudflared**
```bash
ssh root@192.168.1.220 'pct exec 202 -- systemctl restart cloudflared && systemctl status cloudflared | head -5'
```
Expected: `Active: active (running)`

**Step 4: Test public access (unauthenticated — expect 401)**
```bash
curl -s -o /dev/null -w "%{http_code}" https://ollama.nerdt.au/api/tags
```
Expected: `401`

**Step 5: Test with auth**
```bash
curl -s -o /dev/null -w "%{http_code}" https://ollama.nerdt.au/api/tags -H "Authorization: Bearer YOUR_KEY"
```
Expected: `200`

---

## Task 5: Rewrite lib/ai.ts — Ollama with JSON Mode

**Files:**
- Modify: `apps/palettai/lib/ai.ts`

**Step 1: Remove Gemini dependency**

In `apps/palettai/package.json`, remove `@google/generative-ai`. Run:
```bash
cd /e/Projects/Websites
pnpm remove @google/generative-ai --filter palettai
```

**Step 2: Rewrite lib/ai.ts**

Replace the entire file:
```typescript
export interface GeneratedPalette {
  paletteName: string;
  colors: Array<{
    hex: string;
    name: string;
    role: "primary" | "secondary" | "accent" | "neutral" | "background";
  }>;
  description: string;
}

const SYSTEM_PROMPT = `You are a color palette designer. You ONLY output valid JSON. No explanation, no markdown, no text outside JSON.

Output this exact structure:
{
  "paletteName": "string",
  "colors": [
    { "hex": "#RRGGBB", "name": "string", "role": "primary" },
    { "hex": "#RRGGBB", "name": "string", "role": "secondary" },
    { "hex": "#RRGGBB", "name": "string", "role": "accent" },
    { "hex": "#RRGGBB", "name": "string", "role": "neutral" },
    { "hex": "#RRGGBB", "name": "string", "role": "background" }
  ],
  "description": "2-3 sentences on why these colors work together"
}`;

export async function generatePalette(
  prompt: string,
  mood: string
): Promise<GeneratedPalette> {
  const res = await fetch(
    `${process.env.OLLAMA_BASE_URL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a color palette for: ${prompt}. Mood: ${mood}.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Ollama");

  const parsed = JSON.parse(content) as GeneratedPalette;

  if (
    !parsed.paletteName ||
    !Array.isArray(parsed.colors) ||
    parsed.colors.length !== 5 ||
    !parsed.description
  ) {
    throw new Error("Invalid palette structure returned from AI");
  }

  return parsed;
}
```

**Step 3: Set env vars locally for testing**

In `apps/palettai/.env.local`, add:
```
OLLAMA_BASE_URL=https://ollama.nerdt.au
OLLAMA_API_KEY=<key from Task 2>
```
And remove the three `GEMINI_API_KEY*` lines.

**Step 4: Test locally**
```bash
cd /e/Projects/Websites
pnpm dev --filter palettai
```
Open http://localhost:3001, generate a palette. Watch the terminal for errors.

Expected: palette generates in ~10-15s (CPU inference).

---

## Task 6: Cloudflare Turnstile Bot Protection

**Files:**
- Modify: `apps/palettai/app/api/generate/route.ts`
- Modify: `apps/palettai/components/prompt-input.tsx`

**Step 1: Get Turnstile credentials**
- Go to https://dash.cloudflare.com → Turnstile → Add site
- Domain: `palettai.com`, Widget type: `Managed`
- Copy **Site Key** and **Secret Key**

**Step 2: Install Turnstile React package**
```bash
cd /e/Projects/Websites
pnpm add @marsidev/react-turnstile --filter palettai
```

**Step 3: Add env vars to .env.local**
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>
TURNSTILE_SECRET_KEY=<secret key>
```

**Step 4: Add Turnstile token to prompt-input.tsx**

Add import at top:
```typescript
import { Turnstile } from "@marsidev/react-turnstile";
```

Add state:
```typescript
const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
```

Add widget inside the `<form>` just before the generate button section:
```tsx
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: "auto" }}
/>
```

Update the fetch body in `handleGenerate` to include the token:
```typescript
body: JSON.stringify({ prompt: prompt.trim(), mood, turnstileToken }),
```

Disable the generate button if no token yet (for non-Pro users):
```typescript
disabled={!prompt.trim() || loading || (!isPro && remaining <= 0) || !turnstileToken}
```

**Step 5: Verify token server-side in /api/generate route.ts**

Add this helper near the top of the file (after imports):
```typescript
async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
      }),
    }
  );
  const data = await res.json() as { success: boolean };
  return data.success;
}
```

Add verification at the start of the POST handler, before the rate limit check:
```typescript
const { prompt, mood, turnstileToken } = body as {
  prompt: string;
  mood?: string;
  turnstileToken?: string;
};

if (!turnstileToken) {
  return NextResponse.json({ error: "Bot verification required." }, { status: 400 });
}
const valid = await verifyTurnstile(turnstileToken);
if (!valid) {
  return NextResponse.json({ error: "Bot verification failed. Please try again." }, { status: 403 });
}
```

**Step 6: Test locally**
- Generate a palette — should work normally (Turnstile auto-completes for humans)
- Check network tab: POST /api/generate should include `turnstileToken`

---

## Task 7: Add env vars to Vercel

**Step 1: Add all new env vars to Vercel for palettai project**

Via Vercel dashboard (https://vercel.com) → palettai project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `OLLAMA_BASE_URL` | `https://ollama.nerdt.au` |
| `OLLAMA_API_KEY` | `<key from Task 2>` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `<from Cloudflare Turnstile>` |
| `TURNSTILE_SECRET_KEY` | `<from Cloudflare Turnstile>` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | `<your real ca-pub-XXXXXXXXXX>` |

Remove (or leave — they'll be ignored):
- `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`

**Step 2: Verify Stripe env vars are live keys (not test)**
```
STRIPE_SECRET_KEY should start with sk_live_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with pk_live_
```
If they're still `sk_test_`, update them to live keys from Stripe dashboard → Developers → API Keys.

**Step 3: Confirm webhook URL**
- Stripe dashboard → Webhooks → check endpoint URL is `https://palettai.com/api/webhook`
- Confirm `STRIPE_WEBHOOK_SECRET` matches the live webhook signing secret

---

## Task 8: Enable Google OAuth in Supabase

No code changes needed.

**Step 1: Create Google OAuth credentials**
- Go to https://console.cloud.google.com → APIs & Services → Credentials
- Create OAuth 2.0 Client ID (Web application)
- Authorized redirect URI: `https://cyexecqribzrzgrposzm.supabase.co/auth/v1/callback`
- Copy Client ID and Client Secret

**Step 2: Enable in Supabase**
- Go to https://supabase.com → project `cyexecqribzrzgrposzm` → Authentication → Providers → Google
- Toggle ON
- Paste Client ID and Client Secret
- Save

**Step 3: Test**
- Open https://palettai.com/login (or staging)
- Click "Continue with Google" — OAuth flow should complete

---

## Task 9: Deploy and Verify

**Step 1: Commit and push**
```bash
cd /e/Projects/Websites
git add apps/palettai/lib/ai.ts apps/palettai/app/api/generate/route.ts apps/palettai/components/prompt-input.tsx apps/palettai/package.json pnpm-lock.yaml
git commit -m "feat(palettai): switch to self-hosted Ollama qwen2.5:3b, add Turnstile bot protection"
git push
```

**Step 2: Monitor Vercel deploy**
```bash
# Or watch in Vercel dashboard
```
Expected: build succeeds, no missing env var errors.

**Step 3: Smoke test production**
- https://palettai.com — generate a palette
- Confirm Turnstile widget is visible (or invisible if auto-passes)
- Confirm generation works (may be slower than Gemini — ~10-15s)
- Check AdSense script loads (open DevTools → Network → search `adsbygoogle`)

**Step 4: UI parity check**
- Compare `/`, `/pricing`, `/dashboard` between local and production
- Take desktop + mobile screenshots, save to `E:\Users\Ventari\Initiatives\Websites\assets\`

---

## Rollback Notes

- If Ollama inference is too slow: bump qwen2.5 to no-quantization model or switch to `llama3.2:3b`
- If Cloudflare Tunnel is unreachable: check cloudflared is running and `ollama.nerdt.au` CNAME exists
- If Turnstile blocks legitimate users: switch widget type to `Invisible` in Cloudflare dashboard (no code change)
- Gemini fallback: keep the old GEMINI keys in credentials.env; reverting lib/ai.ts is a one-commit rollback
