// Analytics boundary for the Oner widget. Ricardo Tour only reports what it can observe itself: page view and the
// script load lifecycle. It does NOT read the provider DOM and has no visibility into provider search/checkout events,
// so there is intentionally no "handoff clicked" emitter (a click inside the provider widget is not observable
// without scraping it).
//
// Persistence is not wired: AnalyticsEventType is a Prisma enum (tour domain). Events are published on window as a
// CustomEvent so a later ticket can attach a collector without touching the component.

export const ONER_EVENTS = {
  pageView: "oner_widget_page_view",
  loadStarted: "oner_widget_load_started",
  loaded: "oner_widget_loaded",
  loadFailed: "oner_widget_load_failed",
  // Ricardo Tour-owned interactions on the public travel-planner page (links we render ourselves).
  travelPlannerView: "travel_planner_view",
  rioExperiencesClicked: "rio_experiences_clicked",
  travelPlannerHandoffClicked: "travel_planner_handoff_clicked",
} as const;

export type OnerEventName = (typeof ONER_EVENTS)[keyof typeof ONER_EVENTS];

export const ONER_EVENT_CHANNEL = "ricardotour:oner-event";

export function emitOnerEvent(name: OnerEventName, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONER_EVENT_CHANNEL, { detail: { name, ...detail } }));
}
