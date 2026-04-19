import {
  base64UrlEncode,
  base64UrlDecode,
  encodeRoutineToParam,
} from "../routineSharing";
import type { SkillDefinition } from "../../models/SkillDefinition";

describe("base64url helpers", () => {
  it("round-trips an ASCII string", () => {
    const original = "hello world";
    expect(base64UrlDecode(base64UrlEncode(original))).toBe(original);
  });

  it("decodes a known base64url literal without round-tripping", () => {
    // "hello" in standard base64 is "aGVsbG8=" — base64url strips the '=' padding.
    expect(base64UrlDecode("aGVsbG8")).toBe("hello");
  });

  it("decodes a known base64url literal containing a multi-byte character", () => {
    // "€" (U+20AC) is the 3 bytes 0xE2 0x82 0xAC in UTF-8 — base64url "4oKs".
    expect(base64UrlDecode("4oKs")).toBe("€");
  });

  it("round-trips a string with UTF-8 characters", () => {
    const original = 'Cody 1 1/2 — "tuck"';
    expect(base64UrlDecode(base64UrlEncode(original))).toBe(original);
  });

  it("produces url-safe output (no '+', '/', or '=')", () => {
    // These characters encode to base64 output containing '+' and '/' in standard base64,
    // exercising the '+' -> '-' and '/' -> '_' substitutions.
    const original = "???>>>???>>>???>>>";
    const encoded = base64UrlEncode(original);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("decodes output that would have needed padding", () => {
    const original = "a"; // 1 byte -> base64 'YQ==', base64url 'YQ'
    expect(base64UrlDecode(base64UrlEncode(original))).toBe(original);
  });
});

describe("encodeRoutineToParam", () => {
  const skillA: SkillDefinition = {
    name: "Cody 1 1/2",
    startingPosition: "Stomach",
    endingPosition: "Back",
    flips: 1,
    twists: [0.5, 1],
    position: "Tuck",
    possiblePositions: ["Tuck", "Pike", "StraightArmsDown"],
    isBackSkill: true,
  };
  const skillB: SkillDefinition = {
    name: "Barani Porpoise",
    startingPosition: "Back",
    endingPosition: "Stomach",
    flips: 1,
    twists: [0, 0.5],
    position: "Pike",
  };

  it("encodes to a base64url string whose decoded payload matches shape {v:1, s:[[name, position], ...]}", () => {
    const encoded = encodeRoutineToParam([skillA, skillB]);
    const raw = base64UrlDecode(encoded);
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({
      v: 1,
      s: [
        ["Cody 1 1/2", "Tuck"],
        ["Barani Porpoise", "Pike"],
      ],
    });
  });

  it("encodes an empty routine as s: []", () => {
    const encoded = encodeRoutineToParam([]);
    const parsed = JSON.parse(base64UrlDecode(encoded));
    expect(parsed).toEqual({ v: 1, s: [] });
  });
});
