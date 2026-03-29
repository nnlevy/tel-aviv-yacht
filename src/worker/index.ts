import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

const supportedAnalyticsEvents = new Set(["cta_click", "form_start", "form_submit"]);

app.post("/api/analytics/events", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json" }, 400);
  }

  const analyticsEvent = typeof body === "object" && body ? body as Record<string, unknown> : {};
  const eventName = typeof analyticsEvent.event === "string" ? analyticsEvent.event : "";

  if (!supportedAnalyticsEvents.has(eventName)) {
    return c.json({ ok: false, error: "unsupported_event" }, 400);
  }

  const payload = typeof analyticsEvent.payload === "object" && analyticsEvent.payload ? analyticsEvent.payload : {};

  console.log(JSON.stringify({
    type: "portfolio_analytics_event",
    event: eventName,
    ts: typeof analyticsEvent.ts === "string" ? analyticsEvent.ts : new Date().toISOString(),
    path: typeof analyticsEvent.path === "string" ? analyticsEvent.path : new URL(c.req.url).pathname,
    userAgent: c.req.header("user-agent") ?? "",
    referer: c.req.header("referer") ?? "",
    payload,
  }));

  return c.json({ ok: true, event: eventName });
});

export default app;
