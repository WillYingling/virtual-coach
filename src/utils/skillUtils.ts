import { Position, BedPosition } from "../models/SkillDefinition";
import type { SkillDefinition } from "../models/SkillDefinition";
import { CONSTANTS } from "../constants";
import { totalTwists } from "./skillConverter";

/**
 * Display position names in a user-friendly way
 */
export function formatPositionDisplay(position: Position): string {
  if (position === Position.Straight) {
    return "/";
  } else if (position === Position.Pike) {
    return "<";
  } else if (position === Position.Tuck) {
    return "o";
  }
  return position;
}

/**
 * Get category name based on flip count
 */
export function getFlipCategory(skill: SkillDefinition): string {
  const flips = flipNumber(skill);
  if (flips < 1) {
    return "No Flips";
  } else if (flips === 1) {
    return "Single Flips";
  } else if (flips === 2) {
    return "Double Flips";
  } else if (flips === 3) {
    return "Triple Flips";
  } else if (flips === 4) {
    return "Quadruple Flips";
  } else {
    return `${flips} Flips`;
  }
}

/**
 * Group skills by flip category
 */
export function groupSkillsByFlips(
  skills: SkillDefinition[],
): Record<string, SkillDefinition[]> {
  const groups = skills.reduce(
    (groups, skill) => {
      const category = getFlipCategory(skill);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    },
    {} as Record<string, SkillDefinition[]>,
  );

  // Sort skills within each group by difficulty (ascending order - easier first, harder last)
  Object.keys(groups).forEach((category) => {
    groups[category].sort(
      (a, b) => calculateDifficultyScore(a) - calculateDifficultyScore(b),
    );
  });

  return groups;
}

/**
 * Sort flip categories in logical order
 */
export function sortFlipCategories(
  categories: [string, SkillDefinition[]][],
): [string, SkillDefinition[]][] {
  return categories.sort(([a], [b]) => {
    const getFlipNumber = (category: string) => {
      if (category === "No Flips") return -1;
      if (category === "Single Flips") return 1;
      if (category === "Double Flips") return 2;
      if (category === "Triple Flips") return 3;
      if (category === "Quadruple Flips") return 4;
      // For categories like "5 Flips", "6 Flips", etc.
      const match = category.match(/^(\d+) Flips$/);
      return match ? parseInt(match[1]) : 999;
    };
    return getFlipNumber(a) - getFlipNumber(b);
  });
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

function rotationScore(skill: SkillDefinition): number {
  let score = 0;
  let rotation = skill.flips;
  // Base score
  if (rotation >= 1.0 && rotation < 2.0) {
    score += 0.5; // 1 point for first flip
    rotation -= 1.0;
  } else if (rotation >= 2.0 && rotation < 3.0) {
    score += 1.0; // 1 point for first two flips
    if (skill.isBackSkill) {
      score += 0.1; // Additional 0.1 for back skills
    }
    rotation -= 2.0;
  } else if (rotation >= 3.0 && rotation < 4.0) {
    score += 1.6; // 1 point for first three flips
    if (skill.isBackSkill) {
      score += 0.2; // Additional 0.2 for back skills
    }
    rotation -= 3.0;
  } else if (rotation >= 4.0) {
    score += 2.2; // 1 point for first four flips
    if (skill.isBackSkill) {
      score += 0.3; // Additional 0.3 for back skills
    }
    rotation -= 4.0;
  }

  // Partial flips
  score += Math.floor(rotation / 0.25) * 0.1; // 1 point per additional flip

  return score;
}

function twistScore(skill: SkillDefinition): number {
  let score = 0;
  let halfTwists = Math.floor(totalTwists(skill) / 0.5);
  score += halfTwists * 0.1; // 1 point per half twist
  if (skill.flips >= 4) {
    score *= 3; // Bonus for twists on quadruple flips
  } else if (skill.flips >= 3) {
    score += Math.max(0, halfTwists - 2) * 0.2; // Bonus for twists on triple flips
  } else if (skill.flips >= 2) {
    score += Math.max(0, halfTwists - 2) * 0.1; // Bonus for twists on double flips
  }
  return score;
}

function positionScore(skill: SkillDefinition): number {
  if (skill.position === Position.Tuck) {
    return 0; // No position score for tuck
  }

  let flips = Math.floor(skill.flips);
  if (flips === 1 && totalTwists(skill) !== 0) {
    return 0; // No position score for 1 flip with twists
  }

  return flips * 0.1;
}

// Cache for difficulty scores to avoid recalculation
const difficultyCache = new Map<string, number>();

// Generate a cache key from skill properties
function getSkillCacheKey(skill: SkillDefinition): string {
  return `${skill.name}-${skill.position}-${skill.flips}-${skill.twists}-${skill.isBackSkill}`;
}

/**
 * Calculate difficulty score based on USAG Trampoline scoring principles
 * Uses memoization to cache results for better performance
 */
export function calculateDifficultyScore(skill: SkillDefinition): number {
  if (
    skill.flips == 0 &&
    totalTwists(skill) == 0 &&
    skill.position === Position.Straight
  ) {
    return 0; // No difficulty for straight jumps
  }

  // Check cache first
  const cacheKey = getSkillCacheKey(skill);
  const cached = difficultyCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Calculate if not in cache
  const score = Math.max(
    roundToTwo(rotationScore(skill) + twistScore(skill) + positionScore(skill)),
    CONSTANTS.SCORING.MIN_DIFFICULTY,
  );

  // Store in cache
  difficultyCache.set(cacheKey, score);
  return score;
}

export function routineDifficultyScore(
  routine: SkillDefinition[],
  womens: boolean,
): number {
  let totalScore = routine.reduce(
    (sum, skill) => sum + calculateDifficultyScore(skill),
    0,
  );

  const tripleThreshold = womens
    ? CONSTANTS.FLIP_THRESHOLDS.TRIPLE_THRESHOLD_WOMENS
    : CONSTANTS.FLIP_THRESHOLDS.TRIPLE_THRESHOLD_MENS;
  const tripleCount = routine.filter((skill) => skill.flips >= 3).length;
  if (tripleCount > tripleThreshold) {
    totalScore += (tripleCount - tripleThreshold) * 0.3;
  }

  return roundToTwo(totalScore);
}

// Map starting positions to initial rotation values
export const startingPositionRotations = {
  [BedPosition.Standing]: 0,
  [BedPosition.Back]: -0.25, // Half flip (180°) from standing
  [BedPosition.Stomach]: 0.25, // Half flip (180°) from standing
  [BedPosition.HandsAndKnees]: 0.25,
  [BedPosition.Seated]: 0, // Quarter flip (90°) from standing
};

export function getRotationMultiplier(
  definition: SkillDefinition,
  cumulativeTwist: number,
): number {
  let rotationMultiplier = 1;

  // If back skill, invert rotation direction
  if (definition.isBackSkill) {
    rotationMultiplier *= -1;
  }

  // If cumulative twist results in athlete facing backward (odd multiples of 0.5), invert rotation
  if (Math.floor(cumulativeTwist * 2) % 2 !== 0) {
    rotationMultiplier *= -1;
  }

  return rotationMultiplier;
}

export function flipNumber(skill: SkillDefinition): number {
  let rotationMultiplier = getRotationMultiplier(skill, 0);
  let startingRotation = startingPositionRotations[skill.startingPosition];

  // Count the number of times the athlete goes over their head
  let adjustedFlips = skill.flips + startingRotation * rotationMultiplier;
  return Math.round(adjustedFlips);
}
