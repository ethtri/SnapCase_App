"use client";

import { useEffect } from "react";

import { initializeAnalyticsBuffers } from "@/lib/analytics";

export function AnalyticsBootstrap(): null {
  useEffect(() => {
    initializeAnalyticsBuffers();
  }, []);

  return null;
}
