"use client";

import { useEffect, useRef } from "react";
import { trackClientEvent } from "@/lib/analytics/client";

// Preserves the legacy TOUR_VIEWED analytics event (same type and metadata) on the migrated detail page.
export function TourViewTracker({ tripId, locale, city, hasSchedules }: { tripId: string; locale: string; city: string; hasSchedules: boolean }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackClientEvent({ type: "TOUR_VIEWED", tripId, metadata: { locale, city, hasSchedules } });
  }, [tripId, locale, city, hasSchedules]);

  return null;
}
