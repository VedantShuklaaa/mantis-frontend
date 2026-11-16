/**
 * Preset for the primary action. Plain data so it can be spread from both
 * Server and Client Components.
 *
 * The primary action stays neutral (near-black on the light surface). The sage
 * accent is deliberately kept off fills; it only appears in small cues.
 */
export const PRIMARY_SPECULAR = {
  size: "md",
  radius: 8,
  tint: "#181b18",
  tintOpacity: 0.94,
  textColor: "#f8f9f5",
  lineColor: "#ffffff",
  baseColor: "#3a3f3a",
  intensity: 0.6,
  idleIntensity: 0.1,
  shineSize: 7,
  shineFade: 20,
  thickness: 1,
  glow: 0.3,
  proximity: 160,
} as const;
