import { useState } from "react";
import type { Skill } from "../components/AthleteController";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Position } from "../models/SkillDefinition";
import { skillDefinitionToSkill } from "../utils/skillConverter";

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
    let skillToPlay = definition;
    if (selectedPosition) {
      skillToPlay = { ...definition, position: selectedPosition };
    }

    const skill = skillDefinitionToSkill(skillToPlay);
    setSkills([skill]);
    setSkillNames([skillToPlay.name]);
    setSkillDefinitions([skillToPlay]);
    setSimulatorOpen(true);
  };

  const playRoutine = (routine: SkillDefinition[]) => {
    if (routine.length > 0) {
      let cumulativeTwist = 0;
      const animatedSkills = routine.map((def) => {
        const skill = skillDefinitionToSkill(def, cumulativeTwist);
        cumulativeTwist += def.twists;
        return skill;
      });
      setSkills(animatedSkills);
      setSkillNames(routine.map((def) => def.name));
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
