type AnalyticsPayload = Record<string, unknown>;

export function logAnalyticsEvent(
  name: string,
  payload: AnalyticsPayload,
): void {
  // Placeholder logging hook for future analytics provider swap.
  console.log(`analytics.${name}`, payload);
}

