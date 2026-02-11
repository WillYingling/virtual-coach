// Utility functions for validating routines against requirements
import type { SkillDefinition } from "../models/SkillDefinition";
import type {
  RoutineRequirement,
  RequirementValidationResult,
  RoutineRule,
} from "../models/RoutineRequirements";
import {
  routineDifficultyScore,
  calculateDifficultyScore,
  flipNumber,
} from "./skillUtils";
import { totalTwists } from "./skillConverter";

/**
 * Validate a routine against a set of requirements
 */
export function validateRoutineRequirements(
  routine: SkillDefinition[],
  requirement: RoutineRequirement,
): RequirementValidationResult[] {
  return requirement.rules.map((rule) => ({
    ruleId: rule.id,
    description: rule.description,
    passed: rule.validator(routine),
    details: rule.details,
  }));
}

/**
 * Check if all requirements are met
 */
export function areAllRequirementsMet(
  validationResults: RequirementValidationResult[],
): boolean {
  return validationResults.every((result) => result.passed);
}

/**
 * Get the number of passed requirements
 */
export function getPassedRequirementsCount(
  validationResults: RequirementValidationResult[],
): number {
  return validationResults.filter((result) => result.passed).length;
}

// Common rule validators that can be reused
export const COMMON_VALIDATORS = {
  /**
   * Minimum number of skills
   */
  minSkills: (count: number) => ({
    id: `min-skills-${count}`,
    description: `At least ${count} skill${count !== 1 ? "s" : ""}`,
    validator: (routine: SkillDefinition[]) => routine.length >= count,
  }),

  /**
   * Maximum number of skills
   */
  maxSkills: (count: number) => ({
    id: `max-skills-${count}`,
    description: `No more than ${count} skill${count !== 1 ? "s" : ""}`,
    validator: (routine: SkillDefinition[]) => routine.length <= count,
  }),

  /**
   * Exact number of skills
   */
  exactSkills: (count: number) => ({
    id: `exact-skills-${count}`,
    description: `Exactly ${count} skill${count !== 1 ? "s" : ""}`,
    validator: (routine: SkillDefinition[]) => routine.length === count,
  }),

  /**
   * Minimum difficulty score
   */
  minDifficulty: (score: number) => ({
    id: `min-difficulty-${score}`,
    description: `Minimum difficulty score of ${score}`,
    validator: (routine: SkillDefinition[]) => {
      const routineScore = routineDifficultyScore(routine, false); // Default to men's scoring
      return routineScore >= score;
    },
  }),

  /**
   * Minimum difficulty score
   */
  maxDifficulty: (score: number) => ({
    id: `max-difficulty-${score}`,
    description: `Maximum difficulty score of ${score}`,
    validator: (routine: SkillDefinition[]) => {
      const routineScore = routineDifficultyScore(routine, false); // Default to men's scoring
      return routineScore <= score;
    },
  }),

  /**
   * Must include at least one skill with minimum flips
   */
  minFlips: (flips: number) => ({
    id: `min-flips-${flips}`,
    description: `At least one skill with ${flips}+ flip${flips !== 1 ? "s" : ""}`,
    validator: (routine: SkillDefinition[]) =>
      routine.some((skill) => skill.flips >= flips),
  }),

  /**
   * Must include at least one skill with minimum twists
   */
  minTwists: (twists: number) => ({
    id: `min-twists-${twists}`,
    description: `At least one skill with ${twists}+ twist${twists !== 1 ? "s" : ""}`,
    validator: (routine: SkillDefinition[]) =>
      routine.some((skill) => Math.max(...(skill.twists || [0])) >= twists),
  }),

  /**
   * Must start from a specific position
   */
  startPosition: (position: string) => ({
    id: `start-position-${position}`,
    description: `Must start from ${position} position`,
    validator: (routine: SkillDefinition[]) =>
      routine.length > 0 && routine[0].startingPosition === position,
  }),

  /**
   * Must end in a specific position
   */
  endPosition: (position: string) => ({
    id: `end-position-${position}`,
    description: `Must end in ${position} position`,
    validator: (routine: SkillDefinition[]) =>
      routine.length > 0 &&
      routine[routine.length - 1].endingPosition === position,
  }),

  /**
   * Must include skills in specific positions
   */
  includePosition: (position: string, count: number = 1) => ({
    id: `include-position-${position}-${count}`,
    description: `Include at least ${count} skill${count !== 1 ? "s" : ""} in ${position} position`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter((skill) => skill.position === position).length >= count,
  }),

  /**
   * Must include a specific skill by name and optional position
   */
  includeSkill: (skillName: string, position?: string) => ({
    id: `include-skill-${skillName}${position ? `-${position}` : ""}`,
    description: `Must include "${skillName}"${position && position !== "Free" ? ` in ${position} position` : ""}`,
    validator: (routine: SkillDefinition[]) =>
      routine.some(
        (skill) =>
          skill.name === skillName &&
          (!position || position === "Free" || skill.position === position),
      ),
  }),

  includesSequence: (skillNames: string[], positions: string[]) => ({
    id: `includes-sequence-${skillNames.join("-")}`,
    description: `Must include the consecutive sequence: ${skillNames
      .map(
        (name, idx) =>
          `${name}${positions[idx] === "Free" ? "" : ` (${positions[idx]})`}`,
      )
      .join(" → ")}`,
    validator: (routine: SkillDefinition[]) => {
      if (skillNames.length !== positions.length) return false;

      // Look for the sequence starting at each position in the routine
      for (
        let startIdx = 0;
        startIdx <= routine.length - skillNames.length;
        startIdx++
      ) {
        let matches = true;

        // Check if the sequence matches starting from startIdx
        for (let seqIdx = 0; seqIdx < skillNames.length; seqIdx++) {
          const routineSkill = routine[startIdx + seqIdx];
          const expectedName = skillNames[seqIdx];
          const expectedPosition = positions[seqIdx];

          // Check skill name
          if (routineSkill.name !== expectedName) {
            matches = false;
            break;
          }

          // Check position (unless it's "Free")
          if (
            expectedPosition !== "Free" &&
            routineSkill.position !== expectedPosition
          ) {
            matches = false;
            break;
          }
        }

        if (matches) return true;
      }

      return false;
    },
  }),

  /**
   * Skill at specific index must match criteria
   */
  skillAtIndex: (index: number, skillName: string, position?: string) => ({
    id: `skill-at-index-${index}-${skillName}${position ? `-${position}` : ""}`,
    description: `Skill ${index + 1} must be "${skillName}"${position ? ` in ${position} position` : ""}`,
    validator: (routine: SkillDefinition[]) => {
      if (routine.length <= index) return false;
      const skill = routine[index];
      return (
        skill.name === skillName &&
        (!position || skill.position === position || position === "Free")
      );
    },
  }),

  /**
   * Must include specific landing positions
   */
  includeLanding: (bedPosition: string, count: number = 1) => ({
    id: `include-landing-${bedPosition}-${count}`,
    description: `Must include at least ${count} skill${count !== 1 ? "s" : ""} landing in ${bedPosition}`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter((skill) => skill.endingPosition === bedPosition).length >=
      count,
  }),

  /**
   * No duplicate skills allowed
   */
  noDuplicates: () => ({
    id: "no-duplicates",
    description: "No duplicate skills allowed",
    validator: (routine: SkillDefinition[]) => {
      const skillCombinations = routine.map(
        (skill) => `${skill.name}-${skill.position}`,
      );
      const uniqueCombinations = new Set(skillCombinations);
      return skillCombinations.length === uniqueCombinations.size;
    },
  }),

  /**
   * Maximum difficulty for individual skills
   */
  maxElementDifficulty: (maxDifficulty: number) => ({
    id: `max-element-difficulty-${maxDifficulty}`,
    description: `No individual skill may exceed ${maxDifficulty} DD`,
    validator: (routine: SkillDefinition[]) =>
      routine.every(
        (skill) => calculateDifficultyScore(skill) <= maxDifficulty,
      ),
  }),

  maxNonSommersaults: (maxCount: number) => ({
    id: `max-non-sommersaults-${maxCount}`,
    description: `No more than ${maxCount} non-sommersault skills`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter((skill) => flipNumber(skill) === 0).length <= maxCount,
  }),

  minElementsWithMinRotation: (count: number, minRotation: number) => ({
    id: `min-elements-with-min-rotation-${count}-count-${minRotation}-minRotation`,
    description: `At least ${count} elements with at least ${minRotation} rotation`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter((skill) => skill.flips >= minRotation).length >= count,
  }),
  minElementFlipsAndTwists: (
    count: number,
    minFlips: number,
    minTwists: number,
  ) => ({
    id: `min-elements-with-min-flips-${minFlips}-min-twists-${minTwists}-count-${count}`,
    description: `At least ${count} elements with at least ${minFlips} flips and ${minTwists} twists`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter(
        (skill) => skill.flips >= minFlips && totalTwists(skill) >= minTwists,
      ).length >= count,
  }),

  maxElementsWithMinRotation: (maxCount: number, minRotation: number) => ({
    id: `max-elements-with-min-rotation-${maxCount}-minRotation-${minRotation}`,
    description: `No more than ${maxCount} elements with at least ${minRotation} rotation`,
    validator: (routine: SkillDefinition[]) =>
      routine.filter((skill) => skill.flips >= minRotation).length <= maxCount,
  }),

  /**
   * OR validator - passes if any of the provided validators pass
   */
  or: (validators: RoutineRule[]) => ({
    id: `or-${validators.map((v) => v.id).join("-")}`,
    description: `Any of: ${validators.map((v) => v.description).join(" OR ")}`,
    validator: (routine: SkillDefinition[]) =>
      validators.some((validator) => validator.validator(routine)),
  }),
};
