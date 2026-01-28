// Primitive skill definition without timing information
// Describes what the skill is, not when it happens

// Primitive skill definition without timing information
// Describes what the skill is, not when it happens

export const StartingPosition = {
  Standing: "Standing",
  Back: "Back",
  Stomach: "Stomach",
  Seated: "Seated",
} as const;
export type StartingPosition =
  (typeof StartingPosition)[keyof typeof StartingPosition];

export const Position = {
  Straight: "StraightArmsDown",
  Tuck: "Tuck",
  Pike: "Pike",
} as const;
export type Position = (typeof Position)[keyof typeof Position];

export interface SkillDefinition {
  name: string;
  startingPosition: StartingPosition;
  flips: number; // Number of somersaults
  twists: number; // Number of twists
  position: Position;
  possiblePositions?: Position[]; // Alternative positions for the skill
  isBackSkill?: boolean; // If true, rotation is inverted for backward skills
}
