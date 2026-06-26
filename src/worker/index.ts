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

// ── /ads.txt + /api/ad-settings (portfolio ad wiring; routes fix + ad-settings for flagged; standard client/slots; safe for AdSense units)
app.get("/ads.txt", (c) =>
  c.text("google.com, pub-1860356577073395, DIRECT, f08c47fec0942fa0"),
);

app.get("/api/ad-settings", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({
    enabled: true,
    client: "ca-pub-1860356577073395",
    slots: {
      inline: "5613501243",
      footer: "1809987601",
      sticky: "7418194041",
      sticky_layout_key: "-gw-3+1f-3d+2z"
    },
    placements: {
      afterAnalysis: { type: "display", label: "Yacht planning tools & partners" },
      library: { type: "display", label: "Publisher guides" },
      afterLibrary: { type: "display", label: "Portfolio clusters (growth.business etc)" }
    },
    updatedAt: new Date().toISOString(),
  });
});
app.put("/api/ad-settings", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  c.header("Cache-Control", "no-store");
  return c.json({ ok: true, updated: body });
});

export default app;
