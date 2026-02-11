import type { SkillDefinition, BedPosition } from "../models/SkillDefinition";
import type { RoutineRequirement } from "../models/RoutineRequirements";
import { validateRoutineRequirements } from "./requirementValidation";
import { calculateDifficultyScore } from "./skillUtils";

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

/**
 * Generate a routine that complies with the given requirements
 */
export function generateRequirementCompliantRoutine(
  skillDefinitions: SkillDefinition[],
  requirement: RoutineRequirement | null,
  maxAttempts: number = 2000,
): SkillDefinition[] {
  console.log(
    `Generating routine for requirement: ${requirement?.name || "None"}`,
    {
      requirementId: requirement?.id,
      rulesCount: requirement?.rules?.length,
      availableSkills: skillDefinitions.length,
    },
  );

  if (!requirement) {
    // No requirements - use standard random generation
    return generateValidRandomRoutine(skillDefinitions, 10);
  }

  // Try to find specific skills mentioned in requirements
  const specificSkillRules = requirement.rules.filter((rule) =>
    rule.id.includes("skill-at-index"),
  );

  console.log(
    `Found ${specificSkillRules.length} specific skill rules (skill-at-index only)`,
  );

  // If there are specific skill requirements, try to build around them
  if (specificSkillRules.length > 0) {
    console.log("Using generateSpecificRoutine path");
    return generateSpecificRoutine(skillDefinitions, requirement);
  }

  console.log("Using generateConstrainedRandomRoutine path");

  // For general requirements, try multiple random generations
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const routine = generateConstrainedRandomRoutine(
      skillDefinitions,
      requirement,
    );

    const validationResults = validateRoutineRequirements(routine, requirement);
    const isCompliant = validationResults.every((result) => result.passed);

    if (isCompliant) {
      console.log(
        `Successfully generated compliant routine on attempt ${attempt + 1}`,
      );
      return routine;
    }

    // Log failures every 50 attempts to track progress
    if ((attempt + 1) % 50 === 0) {
      const failedRules = validationResults.filter((r) => !r.passed);
      console.warn(
        `Attempt ${attempt + 1}/${maxAttempts} failed. Failed rules:`,
        failedRules.map((r) => r.description),
      );
    }
  }

  // If we can't generate a compliant routine, try with relaxed constraints
  console.warn(
    `Failed to generate compliant routine for "${requirement.name}" after ${maxAttempts} attempts. Falling back to relaxed constraints.`,
    {
      requirementId: requirement.id,
      requirementName: requirement.name,
      rulesCount: requirement.rules.length,
      availableSkills: skillDefinitions.length,
    },
  );

  const relaxedRoutine = generateConstrainedRandomRoutine(
    skillDefinitions,
    requirement,
    true,
  );

  return relaxedRoutine;
}

/**
 * Generate a routine with specific skills as required
 */
function generateSpecificRoutine(
  skillDefinitions: SkillDefinition[],
  requirement: RoutineRequirement,
): SkillDefinition[] {
  console.log(`generateSpecificRoutine called for ${requirement.name}`);

  // Extract exact skills requirement if present
  const exactSkillsRule = requirement.rules.find((rule) =>
    rule.id.startsWith("exact-skills"),
  );
  const targetLength = exactSkillsRule
    ? parseInt(exactSkillsRule.id.split("-")[2])
    : 10;

  console.log(`Target length: ${targetLength}`);

  // Extract skill-at-index requirements
  const skillAtIndexRules = requirement.rules
    .filter((rule) => rule.id.startsWith("skill-at-index"))
    .map((rule) => {
      const parts = rule.id.split("-");
      return {
        index: parseInt(parts[3]),
        skillName: parts.slice(4, -1).join(" "), // Remove position part
        position:
          parts[parts.length - 1] !== parts[4]
            ? parts[parts.length - 1]
            : undefined,
      };
    })
    .sort((a, b) => a.index - b.index);

  console.log(
    `Found ${skillAtIndexRules.length} skill-at-index rules:`,
    skillAtIndexRules,
  );

  // Initialize array with correct length
  const routineTemplate: (SkillDefinition | null)[] = new Array(
    targetLength,
  ).fill(null);

  // Place specific skills at required positions
  for (const skillRule of skillAtIndexRules) {
    const skill = skillDefinitions.find((s) => s.name === skillRule.skillName);
    if (skill && skillRule.index < targetLength) {
      let skillToPlace = skill;
      if (
        skillRule.position &&
        skill.possiblePositions?.includes(skillRule.position as any)
      ) {
        skillToPlace = { ...skill, position: skillRule.position as any };
      }
      routineTemplate[skillRule.index] = skillToPlace;
    }
  }

  // Fill in remaining positions while maintaining position continuity
  for (let i = 0; i < routineTemplate.length; i++) {
    if (routineTemplate[i] === null) {
      // Find a skill that fits the position continuity
      const requiredStart =
        i === 0 ? "Standing" : routineTemplate[i - 1]?.endingPosition;
      const requiredEnd =
        i === routineTemplate.length - 1
          ? null
          : routineTemplate[i + 1]?.startingPosition;

      const compatibleSkills = skillDefinitions.filter((skill) => {
        const startsCorrectly =
          !requiredStart || skill.startingPosition === requiredStart;
        const endsCorrectly =
          !requiredEnd || skill.endingPosition === requiredEnd;
        return startsCorrectly && endsCorrectly;
      });

      if (compatibleSkills.length > 0) {
        const randomSkill =
          compatibleSkills[Math.floor(Math.random() * compatibleSkills.length)];
        routineTemplate[i] = applyRandomPosition(randomSkill);
      }
    }
  }

  // Filter out any null entries and return
  const finalRoutine = routineTemplate.filter(
    (skill): skill is SkillDefinition => skill !== null,
  );

  // If the routine is too short or doesn't meet requirements, fall back to random generation
  if (finalRoutine.length < Math.min(3, targetLength)) {
    console.warn(
      `Generated specific routine too short (${finalRoutine.length} < ${Math.min(3, targetLength)}). Falling back to random generation.`,
      {
        targetLength,
        finalRoutineLength: finalRoutine.length,
        nullCount: routineTemplate.length - finalRoutine.length,
      },
    );
    return generateValidRandomRoutine(skillDefinitions, targetLength);
  }

  return finalRoutine;
}

/**
 * Extract maximum number of skills from requirement rules
 */
function getMaxSkillsFromRequirement(requirement: RoutineRequirement): number {
  const exactSkillsRule = requirement.rules.find((rule) =>
    rule.id.startsWith("exact-skills"),
  );
  if (exactSkillsRule) {
    return parseInt(exactSkillsRule.id.split("-")[2]);
  }

  const maxSkillsRule = requirement.rules.find((rule) =>
    rule.id.startsWith("max-skills"),
  );
  if (maxSkillsRule) {
    return parseInt(maxSkillsRule.id.split("-")[2]);
  }

  const minSkillsRule = requirement.rules.find((rule) =>
    rule.id.startsWith("min-skills"),
  );
  if (minSkillsRule) {
    return Math.max(10, parseInt(minSkillsRule.id.split("-")[2]) + 3);
  }

  return 10; // Default
}

/**
 * Generate a routine that respects specific constraints
 */
function generateConstrainedRandomRoutine(
  skillDefinitions: SkillDefinition[],
  requirement: RoutineRequirement,
  relaxedMode = false,
): SkillDefinition[] {
  const targetLength = getMaxSkillsFromRequirement(requirement);

  // Extract constraints from requirements
  const hasNoDuplicates = requirement.rules.some(
    (rule) => rule.id === "no-duplicates",
  );
  const maxDifficultyRule = requirement.rules.find((rule) =>
    rule.id.startsWith("max-element-difficulty"),
  );
  const maxElementDifficulty = maxDifficultyRule
    ? parseFloat(maxDifficultyRule.id.split("-")[3])
    : null;

  // Filter skills based on difficulty constraint
  let availableSkills = [...skillDefinitions];
  if (maxElementDifficulty && !relaxedMode) {
    availableSkills = skillDefinitions.filter(
      (skill) =>
        skill.possiblePositions?.some((pos) => {
          const skillWithPos = { ...skill, position: pos };
          return calculateDifficultyScore(skillWithPos) <= maxElementDifficulty;
        }) || calculateDifficultyScore(skill) <= maxElementDifficulty,
    );
  }

  if (availableSkills.length === 0) {
    // Fallback if no skills meet difficulty constraint
    console.warn(
      `No skills meet difficulty constraint (${maxElementDifficulty} DD). Using all available skills.`,
      {
        maxElementDifficulty,
        totalSkills: skillDefinitions.length,
        relaxedMode,
      },
    );
    availableSkills = skillDefinitions;
  }

  const routine: SkillDefinition[] = [];
  const usedCombinations = new Set<string>();

  // Start with a random skill that begins from Standing position
  const standingSkills = availableSkills.filter(
    (skill) => skill.startingPosition === "Standing",
  );

  if (standingSkills.length === 0) {
    console.warn(
      `No standing skills available to start routine. Falling back to shorter random routine.`,
      {
        availableSkillsCount: availableSkills.length,
        targetLength,
        fallbackLength: Math.min(targetLength, 5),
      },
    );
    return generateValidRandomRoutine(
      skillDefinitions,
      Math.min(targetLength, 5),
    );
  }

  const firstSkill =
    standingSkills[Math.floor(Math.random() * standingSkills.length)];
  const firstSkillWithPos = applyConstrainedPosition(
    firstSkill,
    maxElementDifficulty,
    relaxedMode,
  );
  routine.push(firstSkillWithPos);

  if (hasNoDuplicates) {
    usedCombinations.add(
      `${firstSkillWithPos.name}-${firstSkillWithPos.position}`,
    );
  }

  // Build the routine by finding skills that can follow the previous one
  let attempts = 0;
  const maxSkillAttempts = 100;

  while (routine.length < targetLength && attempts < maxSkillAttempts) {
    attempts++;
    const lastSkill = routine[routine.length - 1];
    const requiredStartingPosition = lastSkill.endingPosition;

    // Find skills that can start from the required position
    let compatibleSkills = availableSkills.filter(
      (skill) => skill.startingPosition === requiredStartingPosition,
    );

    // Apply constraints
    if (hasNoDuplicates) {
      compatibleSkills = compatibleSkills.filter((skill) => {
        // Check if any position of this skill is unused
        return (
          skill.possiblePositions?.some(
            (pos) => !usedCombinations.has(`${skill.name}-${pos}`),
          ) || !usedCombinations.has(`${skill.name}-${skill.position}`)
        );
      });
    }

    if (compatibleSkills.length === 0) {
      // No compatible skills found, routine ends here
      console.warn(
        `No compatible skills found after ${routine.length} skills. Ending routine generation early.`,
        {
          currentLength: routine.length,
          targetLength,
          lastSkillEndingPosition: lastSkill.endingPosition,
          attempts,
          hasNoDuplicates,
        },
      );
      break;
    }

    // Select a random compatible skill
    const nextSkill =
      compatibleSkills[Math.floor(Math.random() * compatibleSkills.length)];
    const nextSkillWithPos = applyConstrainedPosition(
      nextSkill,
      maxElementDifficulty,
      relaxedMode,
      usedCombinations,
    );

    routine.push(nextSkillWithPos);

    if (hasNoDuplicates) {
      usedCombinations.add(
        `${nextSkillWithPos.name}-${nextSkillWithPos.position}`,
      );
    }
  }

  return routine;
}

/**
 * Apply a position to a skill while respecting difficulty constraints
 */
function applyConstrainedPosition(
  skill: SkillDefinition,
  maxElementDifficulty: number | null,
  relaxedMode: boolean,
  usedCombinations?: Set<string>,
): SkillDefinition {
  if (!skill.possiblePositions || skill.possiblePositions.length === 0) {
    return skill;
  }

  let availablePositions = [...skill.possiblePositions];

  // Filter by used combinations if provided
  if (usedCombinations) {
    availablePositions = availablePositions.filter(
      (pos) => !usedCombinations.has(`${skill.name}-${pos}`),
    );
  }

  // Filter by difficulty constraint
  if (maxElementDifficulty && !relaxedMode) {
    availablePositions = availablePositions.filter((pos) => {
      const skillWithPos = { ...skill, position: pos };
      return calculateDifficultyScore(skillWithPos) <= maxElementDifficulty;
    });
  }

  // Fallback to any available position if none meet constraints
  if (availablePositions.length === 0) {
    availablePositions = usedCombinations
      ? skill.possiblePositions.filter(
          (pos) => !usedCombinations.has(`${skill.name}-${pos}`),
        )
      : skill.possiblePositions;
  }

  // Final fallback
  if (availablePositions.length === 0) {
    availablePositions = skill.possiblePositions;
  }

  const randomPosition =
    availablePositions[Math.floor(Math.random() * availablePositions.length)];
  return { ...skill, position: randomPosition };
}
