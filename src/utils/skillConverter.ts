import type { Skill } from "../components/AthleteController";
import {
  type SkillDefinition,
  Position,
  BedPosition,
} from "../models/SkillDefinition";
import { positions } from "../components/Simulator";
import type { AthletePosition } from "../components/Athlete";
import {
  flipNumber,
  getRotationMultiplier,
  startingPositionRotations,
} from "./skillUtils";

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
  [BedPosition.HandsAndKnees]: "HandsAndKnees", // Hands and knees position
};

export function totalTwists(definition: SkillDefinition): number {
  return definition.twists.reduce((sum, twist) => {
    // Ensure twist is a valid number, default to 0 if not
    const validTwist = typeof twist === "number" && !isNaN(twist) ? twist : 0;
    return sum + validTwist;
  }, 0);
}

/**
 * Calculate appropriate airtime for a skill based on its complexity
 */
export function calculateAirtimeForSkill(definition: SkillDefinition): number {
  let baseTime = 1.0; // Base airtime for simple skills

  // Add time for flips (more flips = more air time needed)
  baseTime += definition.flips * 0.3;

  // Add time for twists
  const totalTwist = totalTwists(definition);
  baseTime += totalTwist * 0.2;

  // Adjust for position - some positions take longer
  if (definition.position === Position.Tuck) {
    baseTime += 0.1;
  } else if (definition.position === Position.Pike) {
    baseTime += 0.2;
  }

  // Adjust for difficult transitions
  if (definition.startingPosition !== BedPosition.Standing) {
    baseTime += 0.2;
  }
  if (definition.endingPosition !== BedPosition.Standing) {
    baseTime += 0.2;
  }

  // Minimum airtime constraints
  return Math.max(0.8, Math.min(baseTime, 4.0));
}

/**
 * Shape a routine's per-skill airtimes into a natural-looking wave by letting
 * each skill borrow height from its nearest peak in either direction, decayed
 * by distance. A small skill before a big one gets "thrown higher to prep";
 * a small skill after a big one rides the follow-through.
 *
 * Growth is unbounded because physically there is no cap on throwing a small
 * skill high. Shrink is capped at `maxShrink` below baseline so a big skill
 * can never be squished to look small. Under this envelope algorithm the
 * shrink clamp is a defensive no-op (the envelope is always ≥ baseline), but
 * we keep it to codify the intended invariant.
 */
export function shapeAirtimes(
  baselines: number[],
  decay: number = 0.85,
  maxShrink: number = 0.15,
): number[] {
  const n = baselines.length;
  if (n === 0) return [];

  // Forward pass (right-to-left): anticipate upcoming peaks.
  const forward: number[] = new Array(n);
  forward[n - 1] = baselines[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    forward[i] = Math.max(baselines[i], forward[i + 1] * decay);
  }

  // Backward pass (left-to-right): carry follow-through from past peaks.
  const backward: number[] = new Array(n);
  backward[0] = baselines[0];
  for (let i = 1; i < n; i++) {
    backward[i] = Math.max(baselines[i], backward[i - 1] * decay);
  }

  return baselines.map((b, i) => {
    const envelope = Math.max(forward[i], backward[i]);
    return Math.max(b * (1 - maxShrink), envelope);
  });
}

// Default skill definition for calculating rotation multiplier based only on cumulative twist
const defaultSkill: SkillDefinition = {
  name: "",
  startingPosition: BedPosition.Standing,
  endingPosition: BedPosition.Standing,
  flips: 0,
  twists: [],
  position: Position.Straight,
  isBackSkill: false,
};

function startingRotation(
  definition: SkillDefinition,
  cumulativeTwist: number,
): number {
  let rotationMultiplier = getRotationMultiplier(defaultSkill, cumulativeTwist);
  return (
    startingPositionRotations[definition.startingPosition] * rotationMultiplier
  );
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

  // Prevent division by zero - if all timestamps are the same, return array of 0s
  if (duration === 0) {
    return timestamps.map(() => 0);
  }

  return timestamps.map((t) => (t - start) / duration);
}

function makeNonFlipFrames(
  definition: SkillDefinition,
  incomingTwist: number = 0,
  airtime?: number,
): Skill {
  let frames: AthletePosition[] = [];
  let timestamps: number[] = [];
  // Placeholder implementation
  let rotationMultiplier = getRotationMultiplier(definition, incomingTwist);
  // TODO: Starting rotation needs to be adjusted for incoming twist, but not rotation direction
  let initialRotation = startingRotation(definition, incomingTwist);
  let startingJoints = bedPositionToJoints[definition.startingPosition];
  let endJoints = bedPositionToJoints[definition.endingPosition];

  let addFrameDelta = (position: string, timestamp: number) => {
    // debugLog("Adding frame", {
    //   position,
    //   timestamp
    // });

    let rotationProgress = definition.flips * timestamp;
    frames.push({
      rotation: rotationProgress * rotationMultiplier + initialRotation,
      twist: (definition.twists[0] || 0) * timestamp,
      joints: positions[position as keyof typeof positions],
    });
    timestamps.push(timestamp);
  };
  addFrameDelta(startingJoints, 0);

  if (definition.position !== "StraightArmsDown") {
    addFrameDelta(startingJoints, 0.4);
    addFrameDelta(definition.position, 0.5);
    addFrameDelta(endJoints, 0.6);
  } else {
    addFrameDelta(definition.position, 0.5);
  }

  addFrameDelta(endJoints, 1);

  return {
    positions: frames,
    timestamps: timestamps,
    airtime: airtime || calculateAirtimeForSkill(definition),
  };
}

export function makeSkillFrames(
  definition: SkillDefinition,
  incomingTwist: number = 0,
  renderProps?: RenderProperties,
  airtime?: number,
  debug: boolean = false,
): Skill {
  const debugLog = debug ? console.log : () => {};
  if (flipNumber(definition) === 0) {
    return makeNonFlipFrames(definition, incomingTwist, airtime);
  }

  debugLog("Making skill frames for:", definition);
  let rotationMultiplier = getRotationMultiplier(definition, incomingTwist);

  let frames: AthletePosition[] = [];
  let timestamps: number[] = [];

  let initialRotation = startingRotation(definition, incomingTwist);
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
  let isLastFlip = false;
  for (let flipNumber = 1; !isLastFlip; flipNumber++) {
    let flipFinalRotation = Math.min(flipNumber, Math.abs(finalRotation));

    let rotationDelta = flipFinalRotation - cumulativeRotation;

    isLastFlip = rotationDelta + cumulativeRotation >= finalRotation;

    let position = definition.position;
    const currentTwist = definition.twists[flipNumber] || 0;
    if (currentTwist > 0 && !isLastFlip) {
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
      const currentTwist = definition.twists[flipNumber] || 0;
      let twistAtKickout =
        (kickoutTransitionTime / totalKickoutTime) * currentTwist;

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
        currentTwist - twistAtKickout,
        bedPositionToJoints[definition.endingPosition],
        1,
      );
    } else {
      const currentTwist = definition.twists[flipNumber] || 0;
      addFrameDelta(
        "Rotation Position",
        flipFinalRotation - cumulativeRotation,
        currentTwist,
        isLastFlip ? bedPositionToJoints[definition.endingPosition] : position,
        flipSpeed,
      );
    }
  }

  let skill: Skill = {
    positions: frames,
    timestamps: normalizeTimestamps(timestamps),
    airtime: airtime || calculateAirtimeForSkill(definition),
  };
  debugLog("Final skill frames:", frames);
  return skill;
}
