"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/routing";
import { ONER_EVENTS, emitOnerEvent, type OnerEventName } from "@/components/site/oner/oner-widget-events";

// Records only clicks on links Ricardo Tour renders itself. Nothing inside the provider widget is observed.
type EventName = Extract<OnerEventName, "rio_experiences_clicked" | "travel_planner_handoff_clicked">;

export function TrackedLink({ event, detail, ...props }: { event: EventName; detail?: string } & ComponentProps<typeof Link>) {
  return <Link {...props} onClick={() => emitOnerEvent(event, detail ? { target: detail } : undefined)} />;
}

export function TrackedAnchor({ event, detail, ...props }: { event: EventName; detail?: string } & ComponentProps<"a">) {
  return <a {...props} onClick={() => emitOnerEvent(event, detail ? { target: detail } : undefined)} />;
}

export { ONER_EVENTS };
