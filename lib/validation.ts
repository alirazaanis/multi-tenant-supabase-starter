import { isReservedOrgSlug } from "@/lib/routing/hub-segments";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LIMITS = {
  passwordMin: 6,
  passwordMax: 128,
  displayNameMax: 100,
  notesMax: 2000,
  orgNameMax: 80,
  taglineMax: 160,
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function validatePassword(password: string): string | null {
  if (password.length < LIMITS.passwordMin) {
    return `Password must be at least ${LIMITS.passwordMin} characters`;
  }
  if (password.length > LIMITS.passwordMax) {
    return `Password must be at most ${LIMITS.passwordMax} characters`;
  }
  return null;
}

export function validateDisplayName(
  displayName: unknown,
  fallback: string
): { displayName: string } | { error: string } {
  if (displayName === undefined || displayName === null || displayName === "") {
    return { displayName: fallback };
  }

  if (typeof displayName !== "string") {
    return { error: "Display name must be a string" };
  }

  const trimmed = displayName.trim();
  if (trimmed.length > LIMITS.displayNameMax) {
    return {
      error: `Display name must be at most ${LIMITS.displayNameMax} characters`,
    };
  }

  return { displayName: trimmed || fallback };
}

export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function validateSlug(slug: string): string | null {
  const normalized = normalizeSlug(slug);
  if (normalized.length < 2 || normalized.length > 48) {
    return "Slug must be 2–48 characters";
  }
  if (!SLUG_RE.test(normalized)) {
    return "Slug may only use lowercase letters, numbers, and hyphens";
  }
  if (isReservedOrgSlug(normalized)) {
    return "This slug is reserved";
  }
  return null;
}

export function validateProfileFields(
  displayName: unknown,
  notes: unknown
): { displayName: string; notes: string } | { error: string } {
  if (typeof displayName !== "string" || typeof notes !== "string") {
    return { error: "displayName and notes must be strings" };
  }

  const trimmedName = displayName.trim();
  const trimmedNotes = notes.trim();

  if (trimmedName.length > LIMITS.displayNameMax) {
    return {
      error: `Display name must be at most ${LIMITS.displayNameMax} characters`,
    };
  }
  if (trimmedNotes.length > LIMITS.notesMax) {
    return { error: `Notes must be at most ${LIMITS.notesMax} characters` };
  }

  return { displayName: trimmedName, notes: trimmedNotes };
}
