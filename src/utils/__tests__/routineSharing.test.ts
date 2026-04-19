import {
  base64UrlEncode,
  base64UrlDecode,
  encodeRoutineToParam,
  decodeRoutineParam,
  buildShareUrl,
  processSharedParam,
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

describe("decodeRoutineParam", () => {
  const library: SkillDefinition[] = [
    {
      name: "Cody 1 1/2",
      startingPosition: "Stomach",
      endingPosition: "Back",
      flips: 1,
      twists: [0.5, 1],
      position: "Tuck",
      possiblePositions: ["Tuck", "Pike", "StraightArmsDown"],
      isBackSkill: true,
    },
    {
      name: "Barani Porpoise",
      startingPosition: "Back",
      endingPosition: "Stomach",
      flips: 1,
      twists: [0, 0.5],
      position: "Pike",
    },
  ];

  it("round-trips a routine with its chosen positions preserved", () => {
    // Encode the routine with a non-default position on the first skill
    // to confirm we preserve the override.
    const encoded = encodeRoutineToParam([
      { ...library[0], position: "Pike" },
      library[1],
    ]);
    const result = decodeRoutineParam(encoded, library);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.missingCount).toBe(0);
    expect(result.routine).toHaveLength(2);
    expect(result.routine[0].name).toBe("Cody 1 1/2");
    expect(result.routine[0].position).toBe("Pike");
    expect(result.routine[0].startingPosition).toBe("Stomach");
    expect(result.routine[1].name).toBe("Barani Porpoise");
    expect(result.routine[1].position).toBe("Pike");
  });

  it("returns missingCount and remaining skills when one name is unknown", () => {
    // Hand-build a payload that includes one name not in the library.
    const payload = {
      v: 1,
      s: [
        ["Cody 1 1/2", "Tuck"],
        ["Nonexistent Skill", "Pike"],
      ],
    };
    const param = base64UrlEncode(JSON.stringify(payload));

    const result = decodeRoutineParam(param, library);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.missingCount).toBe(1);
    expect(result.routine).toHaveLength(1);
    expect(result.routine[0].name).toBe("Cody 1 1/2");
  });

  it("returns an error when every referenced skill is missing", () => {
    const param = base64UrlEncode(
      JSON.stringify({ v: 1, s: [["Nonexistent", "Tuck"]] }),
    );
    const result = decodeRoutineParam(param, library);
    expect(result).toEqual({ error: "Shared link is invalid or corrupted." });
  });

  it("returns an error for an empty s array", () => {
    const param = base64UrlEncode(JSON.stringify({ v: 1, s: [] }));
    expect(decodeRoutineParam(param, library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("returns an error for malformed base64url", () => {
    expect(decodeRoutineParam("!!!not-base64!!!", library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("returns an error for malformed JSON", () => {
    const param = base64UrlEncode("{not json");
    expect(decodeRoutineParam(param, library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("returns an error for wrong payload shape (missing v)", () => {
    const param = base64UrlEncode(JSON.stringify({ s: [["Cody 1 1/2", "Tuck"]] }));
    expect(decodeRoutineParam(param, library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("returns an error for wrong payload shape (s not an array of tuples)", () => {
    const param = base64UrlEncode(JSON.stringify({ v: 1, s: "nope" }));
    expect(decodeRoutineParam(param, library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("returns an error for an unknown future version", () => {
    const param = base64UrlEncode(
      JSON.stringify({ v: 99, s: [["Cody 1 1/2", "Tuck"]] }),
    );
    expect(decodeRoutineParam(param, library)).toEqual({
      error: "Shared link is invalid or corrupted.",
    });
  });

  it("preserves all source skill fields except position", () => {
    const encoded = encodeRoutineToParam([{ ...library[0], position: "Pike" }]);
    const result = decodeRoutineParam(encoded, library);
    if ("error" in result) throw new Error("expected success");
    const loaded = result.routine[0];
    expect(loaded.startingPosition).toBe(library[0].startingPosition);
    expect(loaded.endingPosition).toBe(library[0].endingPosition);
    expect(loaded.flips).toBe(library[0].flips);
    expect(loaded.twists).toEqual(library[0].twists);
    expect(loaded.possiblePositions).toEqual(library[0].possiblePositions);
    expect(loaded.isBackSkill).toBe(library[0].isBackSkill);
    expect(loaded.position).toBe("Pike");
  });
});

describe("buildShareUrl", () => {
  const skill: SkillDefinition = {
    name: "Cody 1 1/2",
    startingPosition: "Stomach",
    endingPosition: "Back",
    flips: 1,
    twists: [0.5, 1],
    position: "Tuck",
  };

  it("composes origin + basePath + ?r= with the encoded param", () => {
    const url = buildShareUrl([skill], "https://example.test", "/virtual-coach/");
    expect(url.startsWith("https://example.test/virtual-coach/?r=")).toBe(true);
    const param = url.slice(url.indexOf("?r=") + 3);
    // Round-trip via decode to confirm the param is valid.
    const result = decodeRoutineParam(param, [skill]);
    if ("error" in result) throw new Error("expected success");
    expect(result.routine[0].name).toBe("Cody 1 1/2");
  });

  it("adds a trailing slash to basePath when missing", () => {
    const url = buildShareUrl([skill], "https://example.test", "/app");
    expect(url.startsWith("https://example.test/app/?r=")).toBe(true);
  });

  it("handles basePath of '/'", () => {
    const url = buildShareUrl([skill], "https://example.test", "/");
    expect(url.startsWith("https://example.test/?r=")).toBe(true);
  });
});

describe("processSharedParam", () => {
  const library: SkillDefinition[] = [
    {
      name: "Cody 1 1/2",
      startingPosition: "Stomach",
      endingPosition: "Back",
      flips: 1,
      twists: [0.5, 1],
      position: "Tuck",
    },
  ];

  it("returns kind 'none' when param is null", () => {
    expect(processSharedParam(null, library)).toEqual({ kind: "none" });
  });

  it("returns kind 'none' when param is empty string", () => {
    expect(processSharedParam("", library)).toEqual({ kind: "none" });
  });

  it("returns kind 'apply' for a valid param", () => {
    const param = encodeRoutineToParam([library[0]]);
    const result = processSharedParam(param, library);
    expect(result.kind).toBe("apply");
    if (result.kind !== "apply") return;
    expect(result.routine).toHaveLength(1);
    expect(result.missingCount).toBe(0);
  });

  it("returns kind 'error' for malformed param", () => {
    const result = processSharedParam("not-valid", library);
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.message).toBe("Shared link is invalid or corrupted.");
  });
});
