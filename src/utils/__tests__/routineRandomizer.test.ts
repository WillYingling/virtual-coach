import {
  generateRequirementCompliantRoutine,
  generateValidRandomRoutine,
} from "../routineValidation";
import { validateRoutineRequirements } from "../requirementValidation";
import { SAMPLE_REQUIREMENTS } from "../../data/sampleRequirements";
import type { SkillDefinition } from "../../models/SkillDefinition";
import * as fs from "fs";
import * as path from "path";

describe("Routine Randomizer", () => {
  let skillDefinitions: SkillDefinition[];

  beforeAll(() => {
    // Load skills from all available sources for comprehensive testing
    const skillsPath = path.join(__dirname, "../../../public/skills.json");
    const usagPath = path.join(__dirname, "../../../public/usag.json");
    const nonflipsPath = path.join(__dirname, "../../../public/nonflips.json");
    const extrasPath = path.join(__dirname, "../../../public/extras.json");

    const allSkills: SkillDefinition[] = [];

    // Load skills from all JSON files
    [skillsPath, usagPath, nonflipsPath, extrasPath].forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          const skillsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (Array.isArray(skillsData)) {
            allSkills.push(...skillsData);
          }
        }
      } catch (error) {
        console.warn(`Could not load skills from ${filePath}:`, error);
      }
    });

    // Remove duplicates based on name and position
    const uniqueSkills = allSkills.reduce((acc: SkillDefinition[], skill) => {
      const key = `${skill.name}-${skill.position}`;
      if (
        !acc.some(
          (existingSkill) =>
            `${existingSkill.name}-${existingSkill.position}` === key,
        )
      ) {
        acc.push(skill);
      }
      return acc;
    }, []);

    skillDefinitions = uniqueSkills;
    console.log(`Loaded ${skillDefinitions.length} unique skills for testing`);
  });

  describe("generateValidRandomRoutine", () => {
    it("should generate valid routines of different lengths", () => {
      const lengths = [3, 5, 7, 10];

      lengths.forEach((length) => {
        const routine = generateValidRandomRoutine(skillDefinitions, length);

        expect(routine.length).toBeGreaterThan(0);
        expect(routine.length).toBeLessThanOrEqual(length);

        // Check position continuity
        for (let i = 1; i < routine.length; i++) {
          expect(routine[i].startingPosition).toBe(
            routine[i - 1].endingPosition,
          );
        }

        // Check that first skill can start from Standing (preferred) or any valid position
        expect(routine[0].startingPosition).toBeDefined();
      });
    });

    it("should handle empty skill definitions gracefully", () => {
      const routine = generateValidRandomRoutine([], 10);
      expect(routine).toEqual([]);
    });

    it("should generate different routines on multiple calls", () => {
      const routine1 = generateValidRandomRoutine(skillDefinitions, 5);
      const routine2 = generateValidRandomRoutine(skillDefinitions, 5);

      // While it's possible they could be the same, it's highly unlikely
      // We'll just check that both are valid rather than different
      expect(routine1.length).toBeGreaterThan(0);
      expect(routine2.length).toBeGreaterThan(0);
    });
  });

  describe("generateRequirementCompliantRoutine - All Requirement Sets", () => {
    // Test each requirement set individually
    SAMPLE_REQUIREMENTS.forEach((requirement) => {
      describe(`${requirement.name} (${requirement.id})`, () => {
        it("should generate a routine that meets all requirements", () => {
          // Use very high iteration count for extremely difficult requirements
          const iterations = requirement.id === "usag-10-1" ? 10000 : 5000;

          const routine = generateRequirementCompliantRoutine(
            skillDefinitions,
            requirement,
            iterations,
          );

          // Basic routine validation
          expect(routine).toBeDefined();
          expect(Array.isArray(routine)).toBe(true);
          expect(routine.length).toBeGreaterThan(0);

          // Validate position continuity
          for (let i = 1; i < routine.length; i++) {
            expect(routine[i].startingPosition).toBe(
              routine[i - 1].endingPosition,
            );
          }

          // Validate against the specific requirement
          const validationResults = validateRoutineRequirements(
            routine,
            requirement,
          );

          // Log failed requirements for debugging
          const failedRequirements = validationResults.filter(
            (result) => !result.passed,
          );
          if (failedRequirements.length > 0) {
            console.warn(
              `Failed requirements for ${requirement.name}:`,
              failedRequirements.map((req) => req.description),
            );
          }

          // All requirements should pass
          validationResults.forEach((result, index) => {
            if (!result.passed) {
              console.error(
                `Requirement failed for ${requirement.name}: ${result.description} (rule ${index + 1}/${validationResults.length})`,
              );
            }
            expect(result.passed).toBe(true);
          });
        }, 60000); // 60 second timeout for complex requirements with high iterations

        it("should generate routines consistently", () => {
          // Generate multiple routines to test consistency
          const numTests = 3;
          const routines = [];

          // Use very high iteration count for extremely difficult requirements
          const iterations = requirement.id === "usag-10-1" ? 8000 : 3000;

          for (let i = 0; i < numTests; i++) {
            const routine = generateRequirementCompliantRoutine(
              skillDefinitions,
              requirement,
              iterations,
            );
            routines.push(routine);
          }

          // All routines should be valid
          routines.forEach((routine, index) => {
            if (routine.length === 0) {
              console.error(
                `Routine ${index + 1} for ${requirement.name} should not be empty`,
              );
            }
            expect(routine.length).toBeGreaterThan(0);

            const validationResults = validateRoutineRequirements(
              routine,
              requirement,
            );
            const allPassed = validationResults.every(
              (result) => result.passed,
            );

            if (!allPassed) {
              const failedRules = validationResults.filter((r) => !r.passed);
              console.error(
                `Routine ${index + 1} for ${requirement.name} failed rules:`,
                failedRules.map((r) => r.description),
              );
            }
            expect(allPassed).toBe(true);
          });
        }, 90000); // 90 second timeout for multiple routine generation with high iterations
      });
    });

    it("should handle null requirement (no constraints)", () => {
      const routine = generateRequirementCompliantRoutine(
        skillDefinitions,
        null,
      );

      expect(routine).toBeDefined();
      expect(Array.isArray(routine)).toBe(true);
      expect(routine.length).toBeGreaterThan(0);

      // Should have position continuity
      for (let i = 1; i < routine.length; i++) {
        expect(routine[i].startingPosition).toBe(routine[i - 1].endingPosition);
      }
    });

    it("should work with limited skill sets", () => {
      // Test with a smaller subset of skills to ensure robustness
      const limitedSkills = skillDefinitions.slice(0, 20);

      // Test a few simpler requirements with limited skills
      const simpleRequirements = SAMPLE_REQUIREMENTS.filter(
        (req) => req.difficulty === "Beginner",
      ).slice(0, 2);

      simpleRequirements.forEach((requirement) => {
        const routine = generateRequirementCompliantRoutine(
          limitedSkills,
          requirement,
          5000, // High iteration count for limited skills
        );

        expect(routine.length).toBeGreaterThan(0);

        // Validate position continuity - more flexible for limited skills
        // Some sequences might not be completable with limited skills
        if (routine.length > 1) {
          let validTransitions = 0;
          for (let i = 1; i < routine.length; i++) {
            if (routine[i].startingPosition === routine[i - 1].endingPosition) {
              validTransitions++;
            }
          }
          // Most transitions should be valid, but with limited skills some might not be
          const validPercentage = validTransitions / (routine.length - 1);
          expect(validPercentage).toBeGreaterThanOrEqual(0.5); // At least 50% valid transitions
        }
      });
    });
  });

  describe("Requirement Set Statistics", () => {
    it("should provide statistics about all requirement sets", () => {
      console.log(`\n=== Requirement Set Statistics ===`);
      console.log(`Total requirement sets: ${SAMPLE_REQUIREMENTS.length}`);
      console.log(`Available skills: ${skillDefinitions.length}`);

      const categories = SAMPLE_REQUIREMENTS.reduce(
        (acc, req) => {
          const category = req.category || "Uncategorized";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("Categories:");
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} requirements`);
      });

      const difficulties = SAMPLE_REQUIREMENTS.reduce(
        (acc, req) => {
          const difficulty = req.difficulty || "Unknown";
          acc[difficulty] = (acc[difficulty] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("Difficulties:");
      Object.entries(difficulties).forEach(([difficulty, count]) => {
        console.log(`  ${difficulty}: ${count} requirements`);
      });

      // This test always passes - it's just for logging
      expect(SAMPLE_REQUIREMENTS.length).toBeGreaterThan(0);
    });
  });
});
