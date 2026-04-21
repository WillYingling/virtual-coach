import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Athlete from "./Athlete";
import type { AthletePosition } from "./Athlete";
import Trampoline from "./Trampoline";
import * as THREE from "three";

// A skill is an array of AthletePositions that start and end at height 0.
// `timestamps` are normalized to [0,1] and scaled by `airtime` at runtime.
export interface Skill {
  positions: AthletePosition[];
  timestamps: number[];
  airtime: number;
}

interface AthleteControllerProps {
  skills: Skill[];
  skillNames?: string[];
  // Live airtime override. When set, replaces each skill's baked-in airtime —
  // used in single-skill mode so the "Air Time" slider drives hang time
  // without regenerating frames on every drag.
  airtimeOverride?: number;
  restartKey?: number;
  onCurrentSkillChange?: (skillIndex: number, skillName?: string) => void;
  fpvEnabled?: boolean;
  isRoutine?: boolean;
}

function AthleteController({
  skills,
  skillNames = [],
  airtimeOverride,
  restartKey = 0,
  onCurrentSkillChange,
  fpvEnabled = false,
  isRoutine = false,
}: AthleteControllerProps) {
  const athleteRef = useRef<THREE.Group>(null);
  const athletePositionRef = useRef<AthletePosition>({
    height: 0,
    rotation: 0,
    twist: 0,
    joints: {
      leftShoulder: Math.PI,
      rightShoulder: Math.PI,
      leftThigh: 0,
      rightThigh: 0,
      leftShin: 0,
      rightShin: 0,
    },
  });

  const cumulativeTwistRef = useRef<number>(0);
  const previousSkillIndexRef = useRef<number>(0);
  const lastRestartKeyRef = useRef<number>(restartKey);
  const firstFrameRef = useRef<boolean>(true);

  const BouncePhase = 0.3;
  const Gravity = -9.81; // m/s^2

  // Precompute per-skill cycle times and a prefix-sum of cycle ends so the
  // per-frame "which skill are we on?" lookup doesn't re-map/re-reduce.
  const { cumulativeEnds, TotalCycleTime } = useMemo(() => {
    const ends: number[] = new Array(skills.length);
    let acc = 0;
    for (let i = 0; i < skills.length; i++) {
      const airtime = airtimeOverride ?? skills[i].airtime;
      acc += airtime + BouncePhase;
      ends[i] = acc;
    }
    return { cumulativeEnds: ends, TotalCycleTime: acc };
  }, [skills, airtimeOverride]);

  useFrame((state) => {
    if (skills.length === 0) {
      return;
    }

    if (restartKey !== lastRestartKeyRef.current) {
      state.clock.elapsedTime = 0;
      cumulativeTwistRef.current = 0;
      previousSkillIndexRef.current = 0;
      lastRestartKeyRef.current = restartKey;
      firstFrameRef.current = true;
    }

    if (firstFrameRef.current) {
      state.clock.elapsedTime = 0;
      firstFrameRef.current = false;
    }

    // Routines play once and hold on the final frame; single skills loop.
    const totalElapsedTime = isRoutine
      ? Math.min(state.clock.elapsedTime, TotalCycleTime)
      : state.clock.elapsedTime % TotalCycleTime;

    let currentSkillIndex = cumulativeEnds.length - 1;
    for (let i = 0; i < cumulativeEnds.length; i++) {
      if (totalElapsedTime < cumulativeEnds[i]) {
        currentSkillIndex = i;
        break;
      }
    }

    const skillStart =
      currentSkillIndex === 0 ? 0 : cumulativeEnds[currentSkillIndex - 1];
    const cycleTime = totalElapsedTime - skillStart;
    const currentSkillAirtime =
      airtimeOverride ?? skills[currentSkillIndex].airtime;

    // Update cumulative twist when transitioning to a new skill
    if (
      currentSkillIndex !== previousSkillIndexRef.current &&
      previousSkillIndexRef.current >= 0 &&
      previousSkillIndexRef.current < skills.length
    ) {
      const previousSkill = skills[previousSkillIndexRef.current];
      if (
        previousSkill &&
        previousSkill.positions &&
        previousSkill.positions.length > 0
      ) {
        const endTwist =
          previousSkill.positions[previousSkill.positions.length - 1].twist;
        cumulativeTwistRef.current += endTwist;
      }
      previousSkillIndexRef.current = currentSkillIndex;

      // Notify parent of skill change
      if (onCurrentSkillChange && currentSkillIndex < skillNames.length) {
        const skillName =
          skillNames[currentSkillIndex] || `Skill ${currentSkillIndex + 1}`;
        onCurrentSkillChange(currentSkillIndex, skillName);
      }
    }

    // Call callback on very first frame (when clock starts at 0)
    if (
      state.clock.elapsedTime === 0 &&
      previousSkillIndexRef.current === 0 &&
      onCurrentSkillChange &&
      skillNames.length > 0
    ) {
      const skillName = skillNames[0] || `Skill 1`;
      onCurrentSkillChange(0, skillName);
    }

    // Ensure we have a valid skill index
    if (currentSkillIndex >= skills.length) {
      return;
    }

    // Get the current skill's positions and timestamps
    const currentSkill = skills[currentSkillIndex];
    if (!currentSkill || !currentSkill.positions || !currentSkill.timestamps) {
      return;
    }

    const { positions, timestamps } = currentSkill;
    const originalTime = cycleTime; // Keep original time for interpolation
    let curTime = cycleTime;
    let height = 0;

    if (curTime > currentSkillAirtime) {
      curTime -= currentSkillAirtime;
      // Bounce phase
      let landingVelocity = Gravity * currentSkillAirtime * 0.5;
      let finalVelocity = -landingVelocity;
      let bounceAcceleration = (finalVelocity - landingVelocity) / BouncePhase;
      height =
        landingVelocity * curTime +
        0.5 * bounceAcceleration * (curTime * curTime);
    } else {
      height =
        0.5 * Gravity * (curTime * curTime) -
        ((Gravity * currentSkillAirtime) / 2) * curTime;
    }

    // Interpolate between positions based on timestamps. `timestamps` are
    // normalized [0,1]; normalize `time` into that space once instead of
    // scaling every timestamp on every lookup.
    const interpolatePosition = (time: number): AthletePosition => {
      const tNorm = time / currentSkillAirtime;

      let idx = 0;
      for (let i = 0; i < timestamps.length - 1; i++) {
        if (tNorm >= timestamps[i] && tNorm <= timestamps[i + 1]) {
          idx = i;
          break;
        }
      }

      if (tNorm <= timestamps[0]) {
        return { ...positions[0] };
      }
      if (tNorm >= timestamps[timestamps.length - 1]) {
        return { ...positions[positions.length - 1] };
      }

      const t1 = timestamps[idx];
      const t2 = timestamps[idx + 1];
      const factor = (tNorm - t1) / (t2 - t1);

      const currentPosition = positions[idx];
      const nextPosition = positions[idx + 1];

      const interpolate = (start: number, end: number, f: number) => {
        return start + (end - start) * f;
      };

      return {
        height: interpolate(
          currentPosition.height ?? 0,
          nextPosition.height ?? 0,
          factor,
        ),
        rotation: interpolate(
          currentPosition.rotation,
          nextPosition.rotation,
          factor,
        ),
        twist:
          interpolate(currentPosition.twist, nextPosition.twist, factor) +
          cumulativeTwistRef.current,
        joints: {
          leftShoulder: interpolate(
            currentPosition.joints.leftShoulder,
            nextPosition.joints.leftShoulder,
            factor,
          ),
          rightShoulder: interpolate(
            currentPosition.joints.rightShoulder,
            nextPosition.joints.rightShoulder,
            factor,
          ),
          leftThigh: interpolate(
            currentPosition.joints.leftThigh,
            nextPosition.joints.leftThigh,
            factor,
          ),
          rightThigh: interpolate(
            currentPosition.joints.rightThigh,
            nextPosition.joints.rightThigh,
            factor,
          ),
          leftThighSpread: interpolate(
            currentPosition.joints.leftThighSpread ?? 0,
            nextPosition.joints.leftThighSpread ?? 0,
            factor,
          ),
          rightThighSpread: interpolate(
            currentPosition.joints.rightThighSpread ?? 0,
            nextPosition.joints.rightThighSpread ?? 0,
            factor,
          ),
          leftShin: interpolate(
            currentPosition.joints.leftShin,
            nextPosition.joints.leftShin,
            factor,
          ),
          rightShin: interpolate(
            currentPosition.joints.rightShin,
            nextPosition.joints.rightShin,
            factor,
          ),
        },
      };
    };

    if (originalTime <= currentSkillAirtime) {
      const interpolatedPos = interpolatePosition(originalTime);

      // Root is now at hip level, so add totalLegLength to height
      // During bounce, height goes negative and feet should go below trampoline (y=0)
      // So: feetHeight = height, rootHeight = height + totalLegLength
      const totalLegLength = 2 * 0.48 + 0.1; // 2 * legSegmentLength + gap
      const feetHeight = height;
      const rootHeight = feetHeight + totalLegLength;

      athletePositionRef.current.height = rootHeight;
      athletePositionRef.current.rotation = interpolatedPos.rotation;
      athletePositionRef.current.twist = interpolatedPos.twist;
      athletePositionRef.current.joints = interpolatedPos.joints;
    } else {
      // During bounce phase, keep the athlete in the landing position
      const lastPos = positions[positions.length - 1];

      const totalLegLength = 2 * 0.48 + 0.1;
      const feetHeight = height;
      const rootHeight = feetHeight + totalLegLength;

      // During bounce phase, keep rotation, twist, and joints constant
      // The athlete should maintain the landing position until the next jump phase

      athletePositionRef.current.height = rootHeight;
      athletePositionRef.current.rotation = lastPos.rotation;
      athletePositionRef.current.twist =
        lastPos.twist + cumulativeTwistRef.current;
      athletePositionRef.current.joints = {
        leftShoulder: lastPos.joints.leftShoulder,
        rightShoulder: lastPos.joints.rightShoulder,
        leftThigh: lastPos.joints.leftThigh,
        rightThigh: lastPos.joints.rightThigh,
        leftShin: lastPos.joints.leftShin,
        rightShin: lastPos.joints.rightShin,
      };
    }
  });

  return (
    <>
      <Athlete
        ref={athleteRef}
        athletePosition={athletePositionRef.current}
        fpvEnabled={fpvEnabled}
      />
      <Trampoline athleteRef={athleteRef} />
    </>
  );
}

export default AthleteController;
