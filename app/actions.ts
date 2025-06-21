"use server"

const PROD_HOOK = "https://n8n.system.smosgasbord.xyz/webhook/01a061e0-3d77-4ebc-b157-0c59e3af48ce"
const TEST_HOOK = PROD_HOOK.replace("/webhook/", "/webhook-test/") // n8n test endpoint

const TIMEOUT_MS = 300_000 // 3 minutes

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
function qs(obj: Record<string, unknown>) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&")
}

async function fetchWithTimeout(url: string, opts: RequestInit, timeout = TIMEOUT_MS) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

/* ------------------------------------------------------------------ */
/* Debug Helpers                                                      */
/* ------------------------------------------------------------------ */
function logDebugInfo(step: string, data: any) {
  console.log(`🔍 DEBUG [${step}]:`, {
    type: typeof data,
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : undefined,
    keys: typeof data === "object" && data !== null ? Object.keys(data) : undefined,
    preview: typeof data === "string" ? data.substring(0, 200) + "..." : data,
  })
}

function safeJsonParse<T = unknown>(value: string): T | null {
  try {
    const parsed = JSON.parse(value)
    logDebugInfo("JSON Parse Success", parsed)
    return parsed as T
  } catch (error) {
    console.error("❌ JSON Parse Error:", error)
    console.log("Raw string that failed to parse:", value.substring(0, 500))
    return null
  }
}

function normaliseWebhookPayload(raw: unknown) {
  logDebugInfo("Raw webhook payload", raw)

  // 1. If we already have an array of ideas → return as-is
  if (Array.isArray(raw) && raw.length && raw[0]?.title) {
    logDebugInfo("Found direct array format", raw)
    return raw
  }

  // 2. If we have the n8n wrapper shape
  if (Array.isArray(raw) && raw.length && Object.prototype.hasOwnProperty.call(raw[0] as any, "output")) {
    const output = (raw[0] as any).output
    logDebugInfo("Found n8n wrapper, extracting output", output)

    if (typeof output === "string") {
      logDebugInfo("Output is string, attempting to parse", output)
      const parsed = safeJsonParse(output)
      if (Array.isArray(parsed)) {
        logDebugInfo("Successfully parsed string output", parsed)
        return parsed
      }
    } else if (Array.isArray(output)) {
      logDebugInfo("Output is already array", output)
      return output
    }
  }

  // 3. Fallback → return whatever we got
  logDebugInfo("Using fallback - returning raw data", raw)
  return raw
}

/* ------------------------------------------------------------------ */
/* Mock (used if all webhook calls fail)                              */
/* ------------------------------------------------------------------ */
function generateMockResponse(topic: string) {
  return [
    {
      title: `🌟 Sample idea for ${topic}`,
      description: `This is mock content because the webhook timed out. Replace with real data once the workflow is up.`,
      publication: "v0 Demo",
      source_link: "https://vercel.com",
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Main export                                                        */
/* ------------------------------------------------------------------ */
export async function generateContentIdeas(topic: string, platforms: string[]) {
  const payload = { topic, platforms, timestamp: new Date().toISOString() }

  console.log("🚀 Starting webhook request with payload:", payload)

  const attempts: Array<{ url: string; opts: RequestInit; label: string }> = [
    {
      url: PROD_HOOK,
      opts: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      label: "Production POST",
    },
    {
      url: `${PROD_HOOK}?${qs(payload)}`,
      opts: { method: "GET" },
      label: "Production GET",
    },
    {
      url: TEST_HOOK,
      opts: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      label: "Test POST",
    },
    {
      url: `${TEST_HOOK}?${qs(payload)}`,
      opts: { method: "GET" },
      label: "Test GET",
    },
  ]

  for (let i = 0; i < attempts.length; i++) {
    const { url, opts, label } = attempts[i]
    console.log(`📡 Attempt ${i + 1}/4: ${label}`)
    console.log(`URL: ${url}`)

    try {
      const startTime = Date.now()
      const res = await fetchWithTimeout(url, opts) // 3 minute timeout
      const duration = Date.now() - startTime

      console.log(`⏱️ Request completed in ${duration}ms`)
      console.log(`📊 Response status: ${res.status}`)
      console.log(`📋 Response headers:`, Object.fromEntries(res.headers.entries()))

      if (!res.ok) {
        const txt = await res.text()
        console.log(`❌ Error response body:`, txt)

        if (txt.includes("Workflow could not be started")) {
          console.log("🔄 Workflow not started, trying next endpoint...")
          continue
        }
        throw new Error(`Webhook returned ${res.status}: ${txt}`)
      }

      const rawText = await res.text()
      console.log(`📝 Raw response length: ${rawText.length} characters`)
      console.log(`📝 Raw response preview:`, rawText.substring(0, 500))

      // If response is completely empty → treat as error and try next attempt
      if (!rawText.trim()) {
        console.log("⚠️ Empty response, trying next attempt...")
        throw new Error("Empty response")
      }

      // Parse JSON only when it *looks* like JSON
      const looksLikeJson = rawText.trim().startsWith("{") || rawText.trim().startsWith("[")
      console.log(`🔍 Looks like JSON: ${looksLikeJson}`)

      const parsed = looksLikeJson ? safeJsonParse(rawText) : null
      const data = normaliseWebhookPayload(parsed ?? rawText)

      console.log("✅ Successfully processed webhook response")
      logDebugInfo("Final processed data", data)

      return { success: true, data, isMock: false }
    } catch (err) {
      console.log(`❌ Attempt ${i + 1} failed:`, err)

      // AbortError (timeout) or other fetch issues → try next attempt
      if (err instanceof Error && err.name === "AbortError") {
        console.log("⏰ Request timed out after 3 minutes, trying next attempt...")
        continue
      }
      // Otherwise just continue to next attempt
      console.log("🔄 Trying next attempt...")
      continue
    }
  }

  // Every attempt failed → serve mock so UI still works
  console.warn("🚨 All webhook attempts failed – serving mock data")
  return { success: true, data: generateMockResponse(topic), isMock: true }
}
