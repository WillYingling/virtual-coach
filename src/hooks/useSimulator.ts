import { useState } from "react";
import type { Skill } from "../components/AthleteController";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Position } from "../models/SkillDefinition";
import {
  totalTwists,
  makeSkillFrames,
  calculateAirtimeForSkill,
  shapeAirtimes,
} from "../utils/skillConverter";

const PREP_JUMP_COUNT = 3;
const AIRTIME_DECAY = 0.85;

/**
 * Create prep jumps that ramp up to the first skill's airtime using the same
 * decay factor that shapes the routine envelope, so the transition from the
 * last prep into skill 0 has no visual discontinuity.
 */
function createPrepJumps(firstSkillAirtime: number): Skill[] {
  const prepJumps: Skill[] = [];

  const standingJoints = {
    leftShoulder: Math.PI,
    rightShoulder: Math.PI,
    leftThigh: 0,
    rightThigh: 0,
    leftShin: 0,
    rightShin: 0,
  };

  for (let k = 1; k <= PREP_JUMP_COUNT; k++) {
    const prepAirtime =
      firstSkillAirtime * Math.pow(AIRTIME_DECAY, PREP_JUMP_COUNT - k + 1);

    prepJumps.push({
      positions: [
        { height: 0, rotation: 0, twist: 0, joints: standingJoints },
        { height: 0, rotation: 0, twist: 0, joints: standingJoints },
      ],
      timestamps: [0, 1],
      airtime: prepAirtime,
    });
  }

  return prepJumps;
}

/**
 * Hook for managing simulator state and actions
 */
export function useSimulator() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>(
    [],
  );
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const playSkill = (
    definition: SkillDefinition,
    selectedPosition?: Position,
  ) => {
    console.log("Playing skill:", definition);
    let skillToPlay = definition;
    if (selectedPosition) {
      skillToPlay = { ...definition, position: selectedPosition };
    }

    const skill = makeSkillFrames(skillToPlay);
    setSkills([skill]);
    setSkillNames([skillToPlay.name]);
    setSkillDefinitions([skillToPlay]);
    setSimulatorOpen(true);
  };

  const playRoutine = (routine: SkillDefinition[]) => {
    if (routine.length > 0) {
      const baselines = routine.map((def) => calculateAirtimeForSkill(def));
      const shapedAirtimes = shapeAirtimes(baselines, AIRTIME_DECAY);

      let cumulativeTwist = 0;
      const animatedSkills = routine.map((def, i) => {
        const skill = makeSkillFrames(
          def,
          cumulativeTwist,
          undefined,
          shapedAirtimes[i],
        );
        const twistIncrement = totalTwists(def);
        if (isNaN(twistIncrement)) {
          console.error(
            "totalTwists returned NaN for skill:",
            def.name,
            "twists:",
            def.twists,
          );
        } else {
          cumulativeTwist += twistIncrement;
        }
        return skill;
      });

      if (routine.length > 1) {
        const prepJumps = createPrepJumps(shapedAirtimes[0]);
        const allSkills = [...prepJumps, ...animatedSkills];
        const prepNames = prepJumps.map((_, i) => `Prep Jump ${i + 1}`);
        const allNames = [...prepNames, ...routine.map((def) => def.name)];

        setSkills(allSkills);
        setSkillNames(allNames);
      } else {
        setSkills(animatedSkills);
        setSkillNames(routine.map((def) => def.name));
      }

      setSkillDefinitions(routine);
      setSimulatorOpen(true);
    }
  };

  const closeSimulator = () => {
    setSimulatorOpen(false);
    setSkills([]);
    setSkillNames([]);
    setSkillDefinitions([]);
  };

  return {
    skills,
    skillNames,
    skillDefinitions,
    simulatorOpen,
    playSkill,
    playRoutine,
    closeSimulator,
  };
}
