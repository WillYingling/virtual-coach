import type { SkillDefinition, Position } from "../models/SkillDefinition";

export type DecodeResult =
  | { routine: SkillDefinition[]; missingCount: number }
  | { error: string };

const INVALID_LINK_MESSAGE = "Shared link is invalid or corrupted.";

// Encodes a string as base64url (RFC 4648 §5): standard base64,
// with '+' -> '-', '/' -> '_', and trailing '=' stripped.
export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(input: string): string {
  const padLength = (4 - (input.length % 4)) % 4;
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeRoutineToParam(routine: SkillDefinition[]): string {
  const payload = {
    v: 1,
    s: routine.map((skill) => [skill.name, skill.position]),
  };
  return base64UrlEncode(JSON.stringify(payload));
}

function isTuplePayload(
  parsed: unknown,
): parsed is { v: number; s: [string, string][] } {
  if (typeof parsed !== "object" || parsed === null) return false;
  const p = parsed as Record<string, unknown>;
  if (typeof p.v !== "number") return false;
  if (!Array.isArray(p.s)) return false;
  return p.s.every(
    (entry) =>
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "string" &&
      typeof entry[1] === "string",
  );
}

export function decodeRoutineParam(
  param: string,
  library: SkillDefinition[],
): DecodeResult {
  let raw: string;
  try {
    raw = base64UrlDecode(param);
  } catch {
    return { error: INVALID_LINK_MESSAGE };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: INVALID_LINK_MESSAGE };
  }

  if (!isTuplePayload(parsed)) return { error: INVALID_LINK_MESSAGE };
  if (parsed.v !== 1) return { error: INVALID_LINK_MESSAGE };
  if (parsed.s.length === 0) return { error: INVALID_LINK_MESSAGE };

  const byName = new Map(library.map((skill) => [skill.name, skill] as const));
  const routine: SkillDefinition[] = [];
  let missingCount = 0;

  for (const [name, position] of parsed.s) {
    const def = byName.get(name);
    if (!def) {
      missingCount++;
      continue;
    }
    routine.push({ ...def, position: position as Position });
  }

  if (routine.length === 0) return { error: INVALID_LINK_MESSAGE };
  return { routine, missingCount };
}

export function buildShareUrl(
  routine: SkillDefinition[],
  origin: string,
  basePath: string,
): string {
  const normalized = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${origin}${normalized}?r=${encodeRoutineToParam(routine)}`;
}

export type SharedRoutineAction =
  | { kind: "none" }
  | { kind: "apply"; routine: SkillDefinition[]; missingCount: number }
  | { kind: "error"; message: string };

export function processSharedParam(
  param: string | null,
  library: SkillDefinition[],
): SharedRoutineAction {
  if (!param) return { kind: "none" };
  const result = decodeRoutineParam(param, library);
  if ("error" in result) return { kind: "error", message: result.error };
  return { kind: "apply", routine: result.routine, missingCount: result.missingCount };
}
