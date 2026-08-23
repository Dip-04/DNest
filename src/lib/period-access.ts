const WOMAN_IDENTITIES = new Set([
  "woman",
  "female",
  "girl",
  "cis woman",
  "cisgender woman",
  "trans woman",
  "transgender woman",
]);

export function canEditPeriodTracker(genderIdentity: string | null | undefined) {
  return WOMAN_IDENTITIES.has(genderIdentity?.trim().toLowerCase() ?? "");
}
