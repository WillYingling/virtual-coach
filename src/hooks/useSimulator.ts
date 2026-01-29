import { useState } from "react";
import type { Skill } from "../components/AthleteController";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Position } from "../models/SkillDefinition";
import { skillDefinitionToSkill } from "../utils/skillConverter";
import { CONSTANTS } from "../constants";

/**
 * Hook for managing simulator state and actions
 */
export function useSimulator() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [renderProperties] = useState({
    stallDuration: CONSTANTS.ANIMATION.STALL_DURATION,
    stallRotation: CONSTANTS.ANIMATION.STALL_ROTATION,
    kickoutDuration: CONSTANTS.ANIMATION.KICKOUT_DURATION,
    kickoutRotation: CONSTANTS.ANIMATION.KICKOUT_ROTATION,
  });

  const playSkill = (
    definition: SkillDefinition,
    selectedPosition?: Position,
  ) => {
    let skillToPlay = definition;
    if (selectedPosition) {
      skillToPlay = { ...definition, position: selectedPosition };
    }

    const skill = skillDefinitionToSkill(skillToPlay, renderProperties);
    setSkills([skill]);
    setSkillNames([skillToPlay.name]);
    setSimulatorOpen(true);
  };

  const playRoutine = (routine: SkillDefinition[]) => {
    if (routine.length > 0) {
      let cumulativeTwist = 0;
      const animatedSkills = routine.map((def) => {
        const skill = skillDefinitionToSkill(
          def,
          renderProperties,
          cumulativeTwist,
        );
        cumulativeTwist += def.twists;
        return skill;
      });
      setSkills(animatedSkills);
      setSkillNames(routine.map((def) => def.name));
      setSimulatorOpen(true);
    }
  };

  const closeSimulator = () => {
    setSimulatorOpen(false);
    setSkills([]);
    setSkillNames([]);
  };

  return {
    skills,
    skillNames,
    simulatorOpen,
    playSkill,
    playRoutine,
    closeSimulator,
  };
}
