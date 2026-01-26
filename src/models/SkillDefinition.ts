// Primitive skill definition without timing information
// Describes what the skill is, not when it happens

export enum StartingPosition {
  Standing = "Standing",
  Back = "Back",
  Stomach = "Stomach",
  Seated = "Seated",
}

export enum Position {
    Straight = "StraightArmsDown",
    Tuck = "Tuck",
    Pike = "Pike",
}

export interface SkillDefinition {
  name: string;
  startingPosition: StartingPosition;
  flips: number;   // Number of somersaults
  twists: number;  // Number of twists
  position: Position;
  possiblePositions?: Position[]; // Alternative positions for the skill
}