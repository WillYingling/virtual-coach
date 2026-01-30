import type { Skill } from "../components/AthleteController";
import {
  type SkillDefinition,
  Position,
  BedPosition,
} from "../models/SkillDefinition";
import { positions } from "../components/Simulator";
import type { AthletePosition } from "../components/Athlete";

export interface RenderProperties {
  stallRotation: number; // rotation during stall

  kickoutRotation: number; // rotation during kickout phase
  positionTransitionDuration: number; // duration of transition into position phase
}

const relativePositionSpeeds = {
  [Position.Tuck]: 2.5,
  [Position.Pike]: 2,
  [Position.Straight]: 1.0,
};

// Map starting positions to joint configurations
const bedPositionToJoints = {
  [BedPosition.Standing]: positions.StraightArmsUp,
  [BedPosition.Back]: positions.StraightArmsDown, // Lying on back
  [BedPosition.Stomach]: positions.StraightArmsUp, // Lying on stomach
  [BedPosition.Seated]: positions.Pike, // Seated position similar to pike
};

// Map starting positions to initial rotation values
const startingPositionRotations = {
  [BedPosition.Standing]: 0,
  [BedPosition.Back]: -0.25, // Half flip (180°) from standing
  [BedPosition.Stomach]: 0.25, // Half flip (180°) from standing
  [BedPosition.Seated]: 0, // Quarter flip (90°) from standing
};

export function totalTwists(definition: SkillDefinition): number {
  return definition.twists.reduce((sum, twist) => sum + twist, 0);
}

export function getRenderPropertiesForSkill(
  definition: SkillDefinition,
): RenderProperties {
  // Base stall and kickout rotations
  let stallRotation = 0.125; // default stall rotation
  let kickoutRotation = 0.5; // default kickout rotation
  if (definition.flips <= 0.5) {
    stallRotation = 0.05;
    kickoutRotation = 0.05;
  }

  let twists = totalTwists(definition);

  // Adjust based on skill characteristics
  if (definition.flips > 1 && twists > 0.5) {
    kickoutRotation += 0.25;
  }

  if (definition.isBackSkill) {
    stallRotation /= 4;
    kickoutRotation += 0.15;
  }

  if (definition.startingPosition === BedPosition.Back) {
    stallRotation = 0.25;
  }

  return {
    stallRotation,
    kickoutRotation,
    positionTransitionDuration: 0.15,
  };
}

function getTwistPhases(
  definition: SkillDefinition,
  timePhases: number[],
): number[] {
  let twistStartTimestamp: number;
  let twistMultiplier: number[];

  // In a straight flip, twist is distributed evenly over the position phase
  if (definition.position === Position.Straight) {
    twistStartTimestamp = timePhases[1];
    twistMultiplier = [0, 1, 1, 1, 1, 1];
  } else {
    // In tuck and pike flips, twists are distributed over the kickout and landing phase
    twistStartTimestamp = timePhases[3];
    twistMultiplier = [0, 0, 0, 0, 1, 1];
  }
  let twistDuration = 1 - twistStartTimestamp;
  let twistPhases = new Array(timePhases.length).fill(0);
  let twists = totalTwists(definition);
  for (let i = 0; i < timePhases.length; i++) {
    let twistPortion = (timePhases[i] - twistStartTimestamp) / twistDuration;
    twistPhases[i] = twistPortion * twists * twistMultiplier[i];
  }

  return twistPhases;
}

function getPhases(
  definition: SkillDefinition,
  renderProps: RenderProperties,
): { rotationPhases: number[]; timePhases: number[] } {
  if (definition.flips <= 0) {
    return {
      rotationPhases: [0, 0, 0, 0, 0, 0],
      timePhases: [
        0, // Stall
        0.5 - renderProps.positionTransitionDuration, // Enter position
        0.5, // Hold position
        0.5,
        0.5 + renderProps.positionTransitionDuration, // Exit position
        1, // Land
      ],
    };
  }

  // How much of the flip is done in the position phase
  let positionPhaseRotation =
    definition.flips - renderProps.kickoutRotation - renderProps.stallRotation;

  // Calculate relative durations
  let positionRelativeSpeed = relativePositionSpeeds[definition.position];
  let positionRelativeDuration = positionPhaseRotation / positionRelativeSpeed;
  let stallRelativeDuration = renderProps.stallRotation; // Assuming speed of 1 for stall
  let kickoutRelativeDuration = renderProps.kickoutRotation; // Assuming speed of 1 for kickout
  let flipRelativeDuration =
    positionRelativeDuration + stallRelativeDuration + kickoutRelativeDuration;

  let normalizedStallDuration = stallRelativeDuration / flipRelativeDuration;
  let normalizedPositionDuration =
    positionRelativeDuration / flipRelativeDuration;
  let normalizedKickoutDuration =
    kickoutRelativeDuration / flipRelativeDuration;

  // Between 0 and endStallTimestamp: stall phase
  // Between endStallTimestamp and endEnterPositionTimestamp: entering position
  // Between endEnterPositionTimestamp and endPositionTimestamp: position phase
  // Between endPositionTimestamp and endExitPositionTimestamp: kicking out of position
  // Between endExitPositionTimestamp and 1: preparing to land
  let endStallTimestamp = normalizedStallDuration;
  let endEnterPositionTimestamp =
    normalizedStallDuration + renderProps.positionTransitionDuration;
  let endPositionTimestamp =
    normalizedStallDuration + normalizedPositionDuration;
  let endExitPositionTimestamp =
    endPositionTimestamp + renderProps.positionTransitionDuration;

  endEnterPositionTimestamp = Math.min(
    endEnterPositionTimestamp,
    endPositionTimestamp,
  );
  endExitPositionTimestamp = Math.min(endExitPositionTimestamp, 1);

  let normalizedPositionSpeed =
    positionPhaseRotation / normalizedPositionDuration;
  let enterPositionRotationDelta =
    normalizedPositionSpeed * renderProps.positionTransitionDuration;
  let enterPositionRotation =
    renderProps.stallRotation + enterPositionRotationDelta;

  let endPositionRotation = renderProps.stallRotation + positionPhaseRotation;

  enterPositionRotation = Math.min(enterPositionRotation, endPositionRotation);

  let normalizedKickoutSpeed =
    renderProps.kickoutRotation / normalizedKickoutDuration;
  let exitKickoutRotation =
    endPositionRotation +
    normalizedKickoutSpeed * renderProps.positionTransitionDuration;

  exitKickoutRotation = Math.min(exitKickoutRotation, definition.flips); // Prevent overshoot

  return {
    rotationPhases: [
      0,
      renderProps.stallRotation,
      enterPositionRotation,
      endPositionRotation,
      exitKickoutRotation,
      definition.flips,
    ],
    timePhases: [
      0,
      endStallTimestamp,
      endEnterPositionTimestamp,
      endPositionTimestamp,
      endExitPositionTimestamp,
      1,
    ],
  };
}

/**
 * Convert a SkillDefinition to a timed Skill for animation
 */
export function skillDefinitionToSkill(
  definition: SkillDefinition,
  cumulativeTwist: number = 0,
  renderProps?: RenderProperties,
): Skill {
  const keyframes: AthletePosition[] = [];
  const timestamps: number[] = [];

  if (!renderProps) {
    renderProps = getRenderPropertiesForSkill(definition);
  }

  // Determine rotation direction based on skill type
  let rotationMultiplier = definition.isBackSkill ? -1 : 1;

  // If cumulative twist results in athlete facing backward (odd multiples of 0.5), invert rotation
  const halfTwists = Math.floor(cumulativeTwist * 2);
  if (halfTwists % 2 !== 0) {
    rotationMultiplier *= -1;
  }

  // Get starting position offset
  const startingRotationOffset =
    startingPositionRotations[definition.startingPosition];
  const startingJoints = bedPositionToJoints[definition.startingPosition];

  const { rotationPhases, timePhases } = getPhases(definition, renderProps);
  const twistPhases = getTwistPhases(definition, timePhases);

  // Athlete positions during the skill, starting with the appropriate starting position
  const atheletePositions = [
    startingJoints, // Use starting position instead of always StraightArmsUp
    positions.StraightArmsUp,
    positions[definition.position],
    positions[definition.position],
    positions.StraightArmsDown,
    bedPositionToJoints[definition.endingPosition],
  ];

  for (let i = 0; i < rotationPhases.length; i++) {
    keyframes.push({
      rotation: rotationPhases[i] * rotationMultiplier + startingRotationOffset,
      twist: twistPhases[i],
      joints: atheletePositions[i],
    });
    timestamps.push(timePhases[i]);
  }
  console.log("Skill conversion:", { definition, keyframes, timestamps });
  return {
    positions: keyframes,
    timestamps: timestamps,
  };
}
