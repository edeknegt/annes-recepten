/**
 * Maps ingredient unit variations to their standardized short form.
 * Add new mappings here as needed — keys should be lowercase.
 */
const UNIT_MAP: Record<string, string> = {
  eetlepel: 'el',
  eetlepels: 'el',
  theelepel: 'tl',
  theelepels: 'tl',
  teentjes: 'teen',
  gram: 'gr',
  g: 'gr',
}

export function normalizeUnit(unit: string): string {
  const key = unit.trim().toLowerCase()
  return UNIT_MAP[key] ?? unit.trim()
}
