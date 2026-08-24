export type EmotionAvatarKind = "male" | "female";

const FEMALE_IDENTITIES = new Set([
  "woman",
  "female",
  "girl",
  "cis woman",
  "cisgender woman",
  "trans woman",
  "transgender woman",
]);

const MALE_IDENTITIES = new Set([
  "man",
  "male",
  "boy",
  "cis man",
  "cisgender man",
  "trans man",
  "transgender man",
]);

export function emotionAvatarForGender(
  genderIdentity: string | null | undefined,
  fallback: EmotionAvatarKind,
): EmotionAvatarKind {
  const normalized = genderIdentity?.trim().toLowerCase() ?? "";
  if (FEMALE_IDENTITIES.has(normalized)) return "female";
  if (MALE_IDENTITIES.has(normalized)) return "male";
  return fallback;
}
