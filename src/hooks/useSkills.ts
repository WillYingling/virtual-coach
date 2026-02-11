import { useState, useEffect } from "react";
import type { SkillDefinition } from "../models/SkillDefinition";
import type { RoutineRequirement } from "../models/RoutineRequirements";
import { Position } from "../models/SkillDefinition";
import { CONSTANTS } from "../constants";
import {
  generateValidRandomRoutine,
  generateRequirementCompliantRoutine,
} from "../utils/routineValidation";

const defaultSkillSources = ["usag.json", "nonflips.json", "extras.json"];

/**
 * Hook for managing skill definitions loaded from JSON
 * @param sources - Array of source paths/URLs to load skills from. Defaults to ['skills.json']
 */
export function useSkillDefinitions(sources: string[] = defaultSkillSources) {
  const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>(
    [],
  );
  const [selectedPositions, setSelectedPositions] = useState<
    Record<string, Position | undefined>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load skill definitions from multiple JSON sources
  useEffect(() => {
    if (sources.length === 0) {
      setSkillDefinitions([]);
      setSelectedPositions({});
      return;
    }

    const loadSkillsFromSources = async () => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = import.meta.env.BASE_URL || "/";

        // Load all sources in parallel
        const promises = sources.map(async (source) => {
          try {
            const url = source.startsWith("http")
              ? source
              : `${baseUrl}${source}`;
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(
                `Failed to load ${source}: ${response.status} ${response.statusText}`,
              );
            }

            const data = await response.json();

            // Validate that the data is an array of skills
            if (!Array.isArray(data)) {
              throw new Error(
                `Invalid data format in ${source}: expected array of skills`,
              );
            }

            return { source, skills: data as SkillDefinition[] };
          } catch (err) {
            console.error(`Error loading skills from ${source}:`, err);
            throw new Error(
              `Failed to load ${source}: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
          }
        });

        const results = await Promise.allSettled(promises);

        // Combine all successfully loaded skills
        const allSkills: SkillDefinition[] = [];
        const loadedSources: string[] = [];
        const failedSources: string[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            allSkills.push(...result.value.skills);
            loadedSources.push(result.value.source);
          } else {
            failedSources.push(sources[index]);
            console.error(`Failed to load ${sources[index]}:`, result.reason);
          }
        });

        // Remove duplicates based on skill name and position
        const uniqueSkills = allSkills.reduce((acc, skill) => {
          const key = `${skill.name}-${skill.position}`;
          if (
            !acc.some(
              (existingSkill) =>
                `${existingSkill.name}-${existingSkill.position}` === key,
            )
          ) {
            acc.push(skill);
          }
          return acc;
        }, [] as SkillDefinition[]);

        setSkillDefinitions(uniqueSkills);

        // Initialize selected positions with default positions
        const defaultPositions: Record<string, Position> = {};
        uniqueSkills.forEach((skill) => {
          defaultPositions[skill.name] = skill.position;
        });
        setSelectedPositions(defaultPositions);

        console.log(
          `Loaded ${uniqueSkills.length} unique skills from ${loadedSources.length} sources:`,
          loadedSources,
        );

        if (failedSources.length > 0) {
          const errorMsg = `Some sources failed to load: ${failedSources.join(", ")}`;
          setError(errorMsg);
          console.warn(errorMsg);
        }
      } catch (err) {
        const errorMsg = `Error loading skills: ${err instanceof Error ? err.message : "Unknown error"}`;
        setError(errorMsg);
        console.error(errorMsg);
        setSkillDefinitions([]);
        setSelectedPositions({});
      } finally {
        setLoading(false);
      }
    };

    loadSkillsFromSources();
  }, [sources.join(",")]); // Re-run when sources array changes

  const selectPosition = (skillName: string, position: Position) => {
    setSelectedPositions((prev) => ({
      ...prev,
      [skillName]: prev[skillName] === position ? undefined : position,
    }));
  };

  return {
    skillDefinitions,
    selectedPositions,
    selectPosition,
    loading,
    error,
  };
}

/**
 * Hook for managing routine state
 */
export function useRoutine(skillDefinitions: SkillDefinition[]) {
  const [routine, setRoutine] = useState<SkillDefinition[]>([]);

  const addToRoutine = (
    definition: SkillDefinition,
    selectedPosition?: Position,
  ) => {
    if (selectedPosition) {
      const modifiedDef = { ...definition, position: selectedPosition };
      setRoutine([...routine, modifiedDef]);
    } else {
      setRoutine([...routine, definition]);
    }
  };

  const clearRoutine = () => {
    setRoutine([]);
  };

  const randomizeRoutine = (requirement?: RoutineRequirement | null) => {
    if (skillDefinitions.length === 0) return;

    let validRoutine: SkillDefinition[];

    if (requirement) {
      // Generate a routine that complies with the requirement
      validRoutine = generateRequirementCompliantRoutine(
        skillDefinitions,
        requirement,
      );
    } else {
      // Generate a standard valid routine
      validRoutine = generateValidRandomRoutine(
        skillDefinitions,
        CONSTANTS.UI.MAX_ROUTINE_SKILLS,
      );
    }

    setRoutine(validRoutine);
  };

  const removeSkill = (index: number) => {
    setRoutine(routine.filter((_, i) => i !== index));
  };

  const moveSkill = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= routine.length || fromIndex === toIndex) {
      return;
    }

    const newRoutine = [...routine];
    const [movedSkill] = newRoutine.splice(fromIndex, 1);
    newRoutine.splice(toIndex, 0, movedSkill);
    setRoutine(newRoutine);
  };

  return {
    routine,
    addToRoutine,
    clearRoutine,
    randomizeRoutine,
    removeSkill,
    moveSkill,
  };
}
