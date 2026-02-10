// Primitive skill definition without timing information
// Describes what the skill is, not when it happens

// Primitive skill definition without timing information
// Describes what the skill is, not when it happens

export const BedPosition = {
  Standing: "Standing",
  Back: "Back",
  Stomach: "Stomach",
  Seated: "Seated",
  HandsAndKnees: "HandsAndKnees",
} as const;
export type BedPosition = (typeof BedPosition)[keyof typeof BedPosition];

export const Position = {
  Straight: "StraightArmsDown",
  Tuck: "Tuck",
  Pike: "Pike",
} as const;
export type Position = (typeof Position)[keyof typeof Position];

export interface SkillDefinition {
  name: string;
  startingPosition: BedPosition;
  endingPosition: BedPosition;
  flips: number; // Number of somersaults
  twists: number[]; // Number of twists
  position: Position;
  possiblePositions?: Position[]; // Alternative positions for the skill
  isBackSkill?: boolean; // If true, rotation is inverted for backward skills
}
