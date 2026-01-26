import type { Skill } from "../components/AthleteController";
import { type SkillDefinition, Position } from "../models/SkillDefinition";
import { positions } from "../components/Simulator";
import type { AthletePosition } from "../components/Athlete";

export interface RenderProperties {
  stallDuration: number; // delay before entering position
  stallRotation: number; // rotation during stall

  kickoutDuration: number; // duration of kickout phase
  kickoutRotation: number; // rotation during kickout phase
}

/**
 * Convert a SkillDefinition to a timed Skill for animation
 */
export function skillDefinitionToSkill(
  definition: SkillDefinition,
  renderProps: RenderProperties,
): Skill {
  const keyframes: AthletePosition[] = [];
  const timestamps: number[] = [];

  // Start position
  keyframes.push({
    rotation: 0,
    twist: 0,
    joints: positions.StraightArmsUp,
  });
  timestamps.push(0);

  if (definition.position !== Position.Straight) {
    // End of stall phase
    keyframes.push({
      rotation: renderProps.stallRotation,
      twist: 0,
      joints: positions.StraightArmsUp,
    });
    timestamps.push(renderProps.stallDuration);

    let positionRotation =
      definition.flips -
      renderProps.kickoutRotation -
      renderProps.stallRotation;
    let positionDuration =
      1 - renderProps.kickoutDuration - renderProps.stallDuration;
    let positionSpeed = positionRotation / positionDuration;

    // Start of kickout
    let kickoutRotation = definition.flips - renderProps.kickoutRotation;
    let kickoutTransitionRotation = 0.18;
    keyframes.push({
      rotation: kickoutRotation - kickoutTransitionRotation,
      twist: 0,
      joints: positions[definition.position],
    });
    timestamps.push(
      1 -
        renderProps.kickoutDuration -
        kickoutTransitionRotation / positionSpeed,
    );

    // End of kickout
    keyframes.push({
      rotation: kickoutRotation,
      twist: definition.twists / (1 / renderProps.kickoutDuration),
      joints: positions.StraightArmsUp,
    });
    timestamps.push(1 - renderProps.kickoutDuration);
  }

  // End position
  keyframes.push({
    rotation: definition.flips,
    twist: definition.twists,
    joints: positions.StraightArmsUp,
  });
  timestamps.push(1.0);

  return {
    positions: keyframes,
    timestamps: timestamps,
  };
}
