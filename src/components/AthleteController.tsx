import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Athlete from "./Athlete";
import type { AthletePosition } from "./Athlete";
import Trampoline from "./Trampoline";
import * as THREE from "three";

// A skill is an array of AthletePositions that start and end at height 0
export interface Skill {
  positions: AthletePosition[];
  timestamps: number[]; // Normalized timestamps (will be multiplied by JumpPhase)
}

// Component that calculates athlete position each frame
interface AthleteControllerProps {
  skills: Skill[];
  skillNames?: string[];
  jumpPhaseLength?: number;
  restartKey?: number;
  onCurrentSkillChange?: (skillIndex: number, skillName?: string) => void;
  fpvEnabled?: boolean;
}

function AthleteController({
  skills,
  skillNames = [],
  jumpPhaseLength = 2,
  restartKey = 0,
  onCurrentSkillChange,
  fpvEnabled = false,
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

  // Track cumulative twist across skills
  const cumulativeTwistRef = useRef<number>(0);
  const previousSkillIndexRef = useRef<number>(0);
  const lastRestartKeyRef = useRef<number>(restartKey);
  const firstFrameRef = useRef<boolean>(true);

  const JumpPhase = jumpPhaseLength;
  const BouncePhase = JumpPhase / 10;
  const SkillCycleTime = JumpPhase + BouncePhase;
  const TotalCycleTime = SkillCycleTime * skills.length;
  const Gravity = -9.81; // m/s^2

  useFrame((state) => {
    if (skills.length === 0) {
      // No skills to animate, keep athlete in default position
      return;
    }

    // Handle restart
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

    const totalElapsedTime = state.clock.elapsedTime % TotalCycleTime;

    // Determine which skill we're currently on
    const currentSkillIndex = Math.floor(totalElapsedTime / SkillCycleTime);
    const cycleTime = totalElapsedTime % SkillCycleTime;

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

    if (curTime > JumpPhase) {
      curTime -= JumpPhase;
      // Bounce phase
      let landingVelocity = Gravity * JumpPhase * 0.5;
      let finalVelocity = -landingVelocity;
      let bounceAcceleration = (finalVelocity - landingVelocity) / BouncePhase;
      height =
        landingVelocity * curTime +
        0.5 * bounceAcceleration * (curTime * curTime);
    } else {
      height =
        0.5 * Gravity * (curTime * curTime) -
        ((Gravity * JumpPhase) / 2) * curTime;
    }

    // Interpolate between positions based on timestamps
    const interpolatePosition = (time: number): AthletePosition => {
      // Find the two keyframes to interpolate between
      let idx = 0;
      for (let i = 0; i < timestamps.length - 1; i++) {
        if (
          time >= timestamps[i] * JumpPhase &&
          time <= timestamps[i + 1] * JumpPhase
        ) {
          idx = i;
          break;
        }
      }

      // Handle edge cases
      if (time <= timestamps[0] * JumpPhase) {
        return { ...positions[0] };
      }
      if (time >= timestamps[timestamps.length - 1] * JumpPhase) {
        return { ...positions[positions.length - 1] };
      }

      // Linear interpolation between keyframes
      const t1 = timestamps[idx] * JumpPhase;
      const t2 = timestamps[idx + 1] * JumpPhase;
      const factor = (time - t1) / (t2 - t1);

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

    // Get interpolated position for current time (only during jump phase)
    if (originalTime <= JumpPhase) {
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
      // During bounce phase, interpolate from last position back to first position
      const bounceProgress = (curTime - JumpPhase) / BouncePhase;
      const lastPos = positions[positions.length - 1];
      const firstPos = positions[0];

      const interpolate = (start: number, end: number, f: number) => {
        return start + (end - start) * f;
      };

      const totalLegLength = 2 * 0.48 + 0.1;
      const feetHeight = height;
      const rootHeight = feetHeight + totalLegLength;

      // During bounce phase, keep rotation and twist constant (no rotation while on trampoline)
      // Only interpolate joints to prepare for next skill

      athletePositionRef.current.height = rootHeight;
      athletePositionRef.current.rotation = lastPos.rotation;
      athletePositionRef.current.twist =
        lastPos.twist + cumulativeTwistRef.current;
      athletePositionRef.current.joints = {
        leftShoulder: interpolate(
          lastPos.joints.leftShoulder,
          firstPos.joints.leftShoulder,
          bounceProgress,
        ),
        rightShoulder: interpolate(
          lastPos.joints.rightShoulder,
          firstPos.joints.rightShoulder,
          bounceProgress,
        ),
        leftThigh: interpolate(
          lastPos.joints.leftThigh,
          firstPos.joints.leftThigh,
          bounceProgress,
        ),
        rightThigh: interpolate(
          lastPos.joints.rightThigh,
          firstPos.joints.rightThigh,
          bounceProgress,
        ),
        leftShin: interpolate(
          lastPos.joints.leftShin,
          firstPos.joints.leftShin,
          bounceProgress,
        ),
        rightShin: interpolate(
          lastPos.joints.rightShin,
          firstPos.joints.rightShin,
          bounceProgress,
        ),
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
