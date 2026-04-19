import type { SkillDefinition } from "../models/SkillDefinition";

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
