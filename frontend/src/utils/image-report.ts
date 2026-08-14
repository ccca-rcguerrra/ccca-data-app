/**
 * Builds the URL for the external image processing report viewer.
 * Returns null when the initiative has no configured base URL.
 */
export function buildAlertImageReportUrl(
  baseUrl: string | null | undefined,
  alertId: number,
): string | null {
  const trimmed = baseUrl?.trim();
  if (!trimmed) return null;
  return `${trimmed.replace(/\/$/, '')}/alert/${alertId}`;
}
