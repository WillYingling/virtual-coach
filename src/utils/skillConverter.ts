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
  [BedPosition.Standing]: "StraightArmsUp", // Standing position
  [BedPosition.Back]: "StraightArmsDown", // Lying on back
  [BedPosition.Stomach]: "StraightArmsUp", // Lying on stomach
  [BedPosition.Seated]: "Pike", // Seated position similar to pike
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
  let stallRotation = 0.1; // default stall rotation
  let kickoutRotation = 0.5; // default kickout rotation

  if (definition.flips <= 0.5) {
    stallRotation = 0.05;
    kickoutRotation = 0.05;
  }

  if (
    definition.startingPosition === BedPosition.Back &&
    !definition.isBackSkill
  ) {
    stallRotation = 0.25;
  }

  if (
    definition.startingPosition === BedPosition.Stomach &&
    definition.isBackSkill
  ) {
    stallRotation = 0.25;
  }

  if (
    (definition.endingPosition === BedPosition.Back &&
      !definition.isBackSkill) ||
    (definition.endingPosition === BedPosition.Stomach &&
      definition.isBackSkill)
  ) {
    kickoutRotation = 0.25;
  }

  let stallTwist = definition.twists[0] || 0;
  if (stallTwist > 0) {
    stallRotation = 0.2;
  }

  return {
    stallRotation,
    kickoutRotation,
    positionTransitionDuration: 0.15,
  };
}

function normalizeTimestamps(timestamps: number[]): number[] {
  const start = timestamps[0];
  const end = timestamps[timestamps.length - 1];
  const duration = end - start;
  return timestamps.map((t) => (t - start) / duration);
}

function getRotationMultiplier(
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

function makePositionJumpFrames(definition: SkillDefinition): Skill {
  let frames: AthletePosition[] = [];
  let timestamps: number[] = [];
  // Placeholder implementation
  let rotation = startingPositionRotations[definition.startingPosition];
  let startingJoints = bedPositionToJoints[definition.startingPosition];
  let endJoints = bedPositionToJoints[definition.startingPosition];
  frames.push({
    rotation: rotation,
    twist: 0,
    joints: positions[startingJoints as keyof typeof positions],
  });
  timestamps.push(0);

  if (definition.position !== "StraightArmsDown") {
    frames.push({
      rotation: rotation,
      twist: 0,
      joints: positions[startingJoints as keyof typeof positions],
    });
    timestamps.push(0.4);

    frames.push({
      rotation: rotation,
      twist: 0,
      joints: positions[definition.position],
    });
    timestamps.push(0.5);

    frames.push({
      rotation: rotation,
      twist: 0,
      joints: positions[endJoints as keyof typeof positions],
    });
    timestamps.push(0.6);
  } else {
    // Placeholder for alternative logic
    frames.push({
      rotation: rotation,
      twist: 0,
      joints: positions[definition.position],
    });
    timestamps.push(0.5);
  }

  frames.push({
    rotation: rotation,
    twist: definition.twists[0] || 0,
    joints: positions[endJoints as keyof typeof positions],
  });
  timestamps.push(1);

  return {
    positions: frames,
    timestamps: timestamps,
  };
}

export function makeSkillFrames(
  definition: SkillDefinition,
  incomingTwist: number = 0,
  renderProps?: RenderProperties,
  debug: boolean = false,
): Skill {
  const debugLog = debug ? console.log : () => {};
  if (definition.flips === 0) {
    return makePositionJumpFrames(definition);
  }

  debugLog("Making skill frames for:", definition);
  let rotationMultiplier = getRotationMultiplier(definition, incomingTwist);

  let frames: AthletePosition[] = [];
  let timestamps: number[] = [];

  let initialRotation = startingPositionRotations[definition.startingPosition];
  let cumulativeRotation = initialRotation * rotationMultiplier;
  let cumulativeTwist = 0;
  let elapsedTime = 0;
  let addFrameDelta = (
    name: string,
    rotationDelta: number,
    twistDelta: number,
    position: string,
    rotationSpeed: number,
  ) => {
    debugLog("Adding frame", {
      name,
      rotationDelta,
      twistDelta,
      position,
      rotationSpeed,
    });

    cumulativeRotation += rotationDelta;
    cumulativeTwist += twistDelta;
    elapsedTime += rotationDelta / rotationSpeed;
    frames.push({
      rotation: cumulativeRotation * rotationMultiplier,
      twist: cumulativeTwist,
      joints: positions[position as keyof typeof positions],
    });
    timestamps.push(elapsedTime);
  };

  // Initial Position - don't apply rotation multiplier to starting position
  let startingJoints = bedPositionToJoints[definition.startingPosition];
  frames.push({
    rotation: initialRotation, // Use raw rotation without multiplier
    twist: 0,
    joints: positions[startingJoints as keyof typeof positions],
  });
  timestamps.push(0);

  if (!renderProps) {
    renderProps = getRenderPropertiesForSkill(definition);
  }

  let stallTwist = definition.twists[0];
  // Initial position to Stall Phase
  addFrameDelta(
    "Stall Position",
    renderProps.stallRotation,
    stallTwist,
    "StraightArmsDown",
    1,
  );
  let previousPosition = "StraightArmsDown";

  const transitionRotation = 1 / 6.0;

  let finalRotation = definition.flips + initialRotation * rotationMultiplier;
  for (
    let flipNumber = 1;
    Math.abs(cumulativeRotation) < Math.abs(finalRotation);
    flipNumber++
  ) {
    let flipFinalRotation = Math.min(flipNumber, Math.abs(finalRotation));

    let rotationDelta = flipFinalRotation - cumulativeRotation;

    let isLastFlip = rotationDelta + cumulativeRotation >= finalRotation;

    let position = definition.position;
    if (definition.twists[flipNumber] > 0 && !isLastFlip) {
      position = "StraightArmsDown";
    }
    let flipSpeed = relativePositionSpeeds[position];

    let needsKickout = isLastFlip && position !== "StraightArmsDown";
    debugLog("Processing flip:", {
      flipNumber,
      rotationDelta,
      isLastFlip,
      position,
      elapsedTime,
      cumulativeRotation,
      cumulativeTwist,
      flipFinalRotation,
      needsKickout,
      flipSpeed,
    });

    let rotationInPosition = rotationDelta;
    if (isLastFlip) {
      rotationInPosition -= renderProps.kickoutRotation;
    }
    let thisTransitionRotation = Math.min(
      transitionRotation,
      rotationInPosition / 2,
    );

    if (position !== previousPosition) {
      previousPosition = position;
      let previousSpeed =
        relativePositionSpeeds[
          previousPosition as keyof typeof relativePositionSpeeds
        ];
      rotationInPosition -= thisTransitionRotation;
      addFrameDelta(
        "Enter Position",
        thisTransitionRotation,
        0,
        position,
        (flipSpeed + previousSpeed) / 2,
      );
    }

    if (needsKickout) {
      rotationInPosition -= thisTransitionRotation;

      addFrameDelta(
        "Final Position",
        rotationInPosition,
        0,
        definition.position,
        flipSpeed,
      );

      // Kickout transition should be faster - use average of flipSpeed and straight speed
      let kickoutTransitionTime =
        thisTransitionRotation / ((flipSpeed + 1) / 2);

      // Distribute twist proportionally based on time duration
      let totalKickoutTime =
        kickoutTransitionTime + renderProps.kickoutRotation;
      let twistAtKickout =
        (kickoutTransitionTime / totalKickoutTime) *
        definition.twists[flipNumber];

      addFrameDelta(
        "Kickout Position",
        thisTransitionRotation,
        twistAtKickout,
        "StraightArmsDown",
        (flipSpeed + 1) / 2,
      );

      addFrameDelta(
        "Landing Position",
        renderProps.kickoutRotation,
        definition.twists[flipNumber] - twistAtKickout,
        bedPositionToJoints[definition.endingPosition],
        1,
      );
    } else {
      addFrameDelta(
        "Rotation Position",
        flipFinalRotation - cumulativeRotation,
        definition.twists[flipNumber],
        isLastFlip ? bedPositionToJoints[definition.endingPosition] : position,
        flipSpeed,
      );
    }
  }

  let skill: Skill = {
    positions: frames,
    timestamps: normalizeTimestamps(timestamps),
  };
  debugLog("Final skill frames:", frames);
  return skill;
}
