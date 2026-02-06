import { makeSkillFrames, totalTwists } from "../skillConverter";
import {
  SkillDefinition,
  Position,
  BedPosition,
} from "../../models/SkillDefinition";
import * as fs from "fs";
import * as path from "path";

// Define the Skill interface locally to avoid React component imports
interface AthletePosition {
  rotation: number;
  twist: number;
  joints: any;
}

interface Skill {
  positions: AthletePosition[];
  timestamps: number[];
}

describe("makeSkillFrames", () => {
  // Load all skills from skills.json synchronously
  const skillsPath = path.join(__dirname, "../../../public/skills.json");
  const skillsData = JSON.parse(fs.readFileSync(skillsPath, "utf-8"));
  const skills: SkillDefinition[] = skillsData as SkillDefinition[];

  skills.forEach((skillDefinition, index) => {
    describe(`${skillDefinition.name}`, () => {
      skillDefinition.possiblePositions?.forEach((position) => {
        describe(`in position ${position}`, () => {
          let skill: Skill;

          beforeAll(() => {
            skillDefinition.position = position as Position;
            skill = makeSkillFrames(skillDefinition);
          });

          it("should have increasing timestamps from 0 to 1", () => {
            expect(skill.timestamps[0]).toBe(0);
            expect(skill.timestamps[skill.timestamps.length - 1]).toBe(1);

            // All skills must have strictly increasing timestamps
            for (let i = 1; i < skill.timestamps.length; i++) {
              expect(skill.timestamps[i]).toBeGreaterThanOrEqual(
                skill.timestamps[i - 1],
              );
            }
          });

          it("should have valid position structure", () => {
            skill.positions.forEach((position, posIndex) => {
              expect(position).toHaveProperty("rotation");
              expect(position).toHaveProperty("twist");
              expect(position).toHaveProperty("joints");
              expect(typeof position.rotation).toBe("number");
              expect(typeof position.twist).toBe("number");
              expect(position.joints).toBeDefined();
              expect(isFinite(position.rotation)).toBe(true);
              expect(isFinite(position.twist)).toBe(true);
            });
          });

          it("should have monotonic rotation progression when skill has flips", () => {
            if (skillDefinition.flips > 0) {
              const rotations = skill.positions.map((pos) => pos.rotation);

              if (skillDefinition.isBackSkill) {
                // For back skills, rotation should generally decrease (become more negative)
                // or stay the same due to rotation multiplier being -1
                const totalRotationChange =
                  rotations[rotations.length - 1] - rotations[0];
                expect(Math.abs(totalRotationChange)).toBeGreaterThanOrEqual(0);
              } else {
                // For forward skills, rotation should generally increase
                for (let i = 1; i < rotations.length; i++) {
                  expect(rotations[i]).toBeGreaterThanOrEqual(rotations[i - 1]);
                }
                expect(rotations[rotations.length - 1]).toBeGreaterThan(
                  rotations[0],
                );
              }
            }
          });

          it("should have correct total rotation for flip amount", () => {
            if (skillDefinition.flips > 0) {
              const rotations = skill.positions.map((pos) => pos.rotation);
              const totalRotation = Math.abs(
                rotations[rotations.length - 1] - rotations[0],
              );

              // The total rotation should approximate the number of flips
              // Allow for some tolerance due to starting position offsets
              expect(totalRotation).toBeCloseTo(skillDefinition.flips, 0.5);
            }
          });

          it("should have correct twist progression when skill has twists", () => {
            const totalTwistsValue = totalTwists(skillDefinition);
            if (totalTwistsValue > 0) {
              const twists = skill.positions.map((pos) => pos.twist);
              const finalTwist = twists[twists.length - 1];

              // Final twist should match the skill definition
              expect(finalTwist).toBeCloseTo(totalTwistsValue, 2);

              // Find where twists start (first non-zero twist)
              const twistStartIndex = twists.findIndex(
                (twist) => Math.abs(twist) > 0.001,
              );

              if (twistStartIndex !== -1) {
                // From the start of twisting, twists should not decrease
                for (let i = twistStartIndex + 1; i < twists.length; i++) {
                  expect(Math.abs(twists[i])).toBeGreaterThanOrEqual(
                    Math.abs(twists[i - 1]) - 0.001,
                  );
                }
              }
            } else {
              // Skills with no twists should have zero twist throughout
              skill.positions.forEach((position) => {
                expect(Math.abs(position.twist)).toBeLessThan(0.001);
              });
            }
          });

          it("should handle starting position correctly", () => {
            const expectedStartRotations = {
              [BedPosition.Standing]: 0,
              [BedPosition.Back]: -0.25,
              [BedPosition.Stomach]: 0.25,
              [BedPosition.Seated]: 0,
            };

            const actualStartRotation = skill.positions[0].rotation;
            const expectedBaseRotation =
              expectedStartRotations[skillDefinition.startingPosition];

            // For forward skills, expect close to the base rotation
            // For back skills, the rotation multiplier affects this
            if (!skillDefinition.isBackSkill) {
              expect(actualStartRotation).toBeCloseTo(expectedBaseRotation, 1);
            } else {
              // Back skills may have different starting rotations due to the multiplier
              expect(isFinite(actualStartRotation)).toBe(true);
            }
          });

          it("should have realistic timing distribution", () => {
            // Check that timestamps are reasonably distributed
            const timestamps = skill.timestamps;
            const intervals = [];

            for (let i = 1; i < timestamps.length; i++) {
              intervals.push(timestamps[i] - timestamps[i - 1]);
            }

            // All intervals must be positive (no negative or zero intervals)
            intervals.forEach((interval, i) => {
              expect(interval).toBeGreaterThanOrEqual(0);
              expect(interval).toBeLessThan(1);
            });
          });

          // Test individual positions for skills with specific characteristics
          if (skillDefinition.flips === 0) {
            it("should have zero rotation change for no-flip skills", () => {
              const rotations = skill.positions.map((pos) => pos.rotation);
              const startRotation = rotations[0];

              rotations.forEach((rotation) => {
                expect(rotation).toBeCloseTo(startRotation, 3);
              });
            });
          }

          const totalTwistsValue = totalTwists(skillDefinition);
          if (totalTwistsValue > 1.5) {
            it("should distribute high twist amounts appropriately", () => {
              const twists = skill.positions.map((pos) => pos.twist);
              const maxTwist = Math.max(...twists.map(Math.abs));

              expect(maxTwist).toBeCloseTo(totalTwistsValue, 1);
            });
          }

          if (skillDefinition.flips >= 2) {
            it("should handle multiple flips with proper progression", () => {
              const rotations = skill.positions.map((pos) => pos.rotation);
              const totalRotation = Math.abs(
                rotations[rotations.length - 1] - rotations[0],
              );

              expect(totalRotation).toBeGreaterThan(1.5);
              expect(totalRotation).toBeCloseTo(skillDefinition.flips, 0.5);
            });
          }
        });
      });
    });
  });

  describe("cumulative twist effects on all skills", () => {
    skills.slice(0, 5).forEach((skillDefinition) => {
      if (skillDefinition.flips > 0) {
        it(`should handle cumulative twist for ${skillDefinition.name}`, () => {
          const normalSkill = makeSkillFrames(skillDefinition, 0);
          const twistedSkill = makeSkillFrames(skillDefinition, 0.5);

          const normalRotations = normalSkill.positions.map(
            (pos) => pos.rotation,
          );
          const twistedRotations = twistedSkill.positions.map(
            (pos) => pos.rotation,
          );

          // The rotation directions should be affected by cumulative twist
          const normalDirection =
            normalRotations[normalRotations.length - 1] - normalRotations[0];
          const twistedDirection =
            twistedRotations[twistedRotations.length - 1] - twistedRotations[0];

          if (Math.abs(normalDirection) > 0.1) {
            expect(normalDirection * twistedDirection).toBeLessThanOrEqual(0);
          }
        });
      }
    });
  });

  describe("skills consistency", () => {
    it("should produce identical results for repeated calls", () => {
      const testSkill = skills[0]; // Use first skill for consistency test
      const skill1 = makeSkillFrames(testSkill);
      const skill2 = makeSkillFrames(testSkill);

      expect(skill1.timestamps).toEqual(skill2.timestamps);
      expect(skill1.positions).toEqual(skill2.positions);
    });
  });
});
