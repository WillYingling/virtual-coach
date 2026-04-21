import { useState } from "react";
import type { Skill } from "../components/AthleteController";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Position } from "../models/SkillDefinition";
import { positions } from "../components/Simulator";
import {
  totalTwists,
  makeSkillFrames,
  calculateAirtimeForSkill,
  shapeAirtimes,
} from "../utils/skillConverter";

// Fractions of the first skill's airtime for each prep jump, in order. The
// last entry is 1.0 so the athlete is already at full height entering skill 1.
const PREP_JUMP_FRACTIONS = [0.25, 0.5, 1.0];

function createPrepJumps(firstSkillAirtime: number): Skill[] {
  return PREP_JUMP_FRACTIONS.map((fraction) => ({
    positions: [
      { height: 0, rotation: 0, twist: 0, joints: positions.StraightArmsUp },
      { height: 0, rotation: 0, twist: 0, joints: positions.StraightArmsUp },
    ],
    timestamps: [0, 1],
    airtime: firstSkillAirtime * fraction,
  }));
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
      const shapedAirtimes = shapeAirtimes(baselines);

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

      const prepJumps =
        routine.length > 1 ? createPrepJumps(shapedAirtimes[0]) : [];
      const prepNames = prepJumps.map((_, i) => `Prep Jump ${i + 1}`);

      setSkills([...prepJumps, ...animatedSkills]);
      setSkillNames([...prepNames, ...routine.map((def) => def.name)]);
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
