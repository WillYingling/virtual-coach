import type { SkillDefinition, BedPosition } from "../models/SkillDefinition";

/**
 * Check if a routine is valid (each skill starts where the previous one ends)
 */
export function isRoutineValid(routine: SkillDefinition[]): boolean {
  if (routine.length <= 1) return true;

  for (let i = 1; i < routine.length; i++) {
    const previousSkill = routine[i - 1];
    const currentSkill = routine[i];

    if (previousSkill.endingPosition !== currentSkill.startingPosition) {
      return false;
    }
  }

  return true;
}

/**
 * Get validation errors for a routine
 */
export function getRoutineValidationErrors(
  routine: SkillDefinition[],
): string[] {
  const errors: string[] = [];

  if (routine.length <= 1) return errors;

  for (let i = 1; i < routine.length; i++) {
    const previousSkill = routine[i - 1];
    const currentSkill = routine[i];

    if (previousSkill.endingPosition !== currentSkill.startingPosition) {
      errors.push(
        `"${currentSkill.name}" cannot follow "${previousSkill.name}" - ` +
          `${previousSkill.name} ends in ${previousSkill.endingPosition} position ` +
          `but ${currentSkill.name} starts from ${currentSkill.startingPosition} position`,
      );
    }
  }

  return errors;
}

/**
 * Generate a valid random routine by ensuring position continuity
 */
export function generateValidRandomRoutine(
  skillDefinitions: SkillDefinition[],
  maxSkills: number,
): SkillDefinition[] {
  if (skillDefinitions.length === 0) return [];

  const routine: SkillDefinition[] = [];
  let availableSkills = [...skillDefinitions];

  // Start with a random skill that begins from Standing position
  const standingSkills = availableSkills.filter(
    (skill) => skill.startingPosition === "Standing",
  );
  if (standingSkills.length === 0) {
    // Fallback: if no standing skills, start with any skill
    const firstSkill =
      availableSkills[Math.floor(Math.random() * availableSkills.length)];
    routine.push(applyRandomPosition(firstSkill));
  } else {
    const firstSkill =
      standingSkills[Math.floor(Math.random() * standingSkills.length)];
    routine.push(applyRandomPosition(firstSkill));
  }

  // Build the routine by finding skills that can follow the previous one
  while (routine.length < maxSkills) {
    const lastSkill = routine[routine.length - 1];
    const requiredStartingPosition = lastSkill.endingPosition;

    // Find skills that can start from the required position
    const compatibleSkills = availableSkills.filter(
      (skill) => skill.startingPosition === requiredStartingPosition,
    );

    if (compatibleSkills.length === 0) {
      // No compatible skills found, routine ends here
      break;
    }

    // Select a random compatible skill
    const nextSkill =
      compatibleSkills[Math.floor(Math.random() * compatibleSkills.length)];
    routine.push(applyRandomPosition(nextSkill));

    // Remove the selected skill from available skills to avoid repetition
    // (optional - you might want to allow repeated skills)
    availableSkills = availableSkills.filter(
      (skill) => skill.name !== nextSkill.name,
    );

    if (availableSkills.length === 0) {
      // No more skills available
      break;
    }
  }

  return routine;
}

/**
 * Apply a random position from the skill's possible positions
 */
function applyRandomPosition(skill: SkillDefinition): SkillDefinition {
  if (skill.possiblePositions && skill.possiblePositions.length > 0) {
    const randomPosition =
      skill.possiblePositions[
        Math.floor(Math.random() * skill.possiblePositions.length)
      ];
    return { ...skill, position: randomPosition };
  }
  return skill;
}

/**
 * Get skills that can follow a given ending position
 */
export function getCompatibleSkills(
  skillDefinitions: SkillDefinition[],
  requiredStartingPosition: BedPosition,
): SkillDefinition[] {
  return skillDefinitions.filter(
    (skill) => skill.startingPosition === requiredStartingPosition,
  );
}
