import { useState, useMemo } from "react";
import type {
  RoutineRequirement,
  RequirementValidationResult,
} from "../models/RoutineRequirements";
import type { SkillDefinition } from "../models/SkillDefinition";
import { validateRoutineRequirements } from "../utils/requirementValidation";
import { SAMPLE_REQUIREMENTS } from "../data/sampleRequirements";

interface UseRoutineRequirementsReturn {
  // State
  selectedRequirementId: string | null;
  availableRequirements: RoutineRequirement[];
  selectedRequirement: RoutineRequirement | null;

  // Actions
  setSelectedRequirementId: (id: string | null) => void;
  addCustomRequirement: (requirement: RoutineRequirement) => void;

  // Validation
  validateRoutine: (
    routine: SkillDefinition[],
  ) => RequirementValidationResult[];
  isRoutineValid: (routine: SkillDefinition[]) => boolean;
}

export function useRoutineRequirements(): UseRoutineRequirementsReturn {
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);
  const [customRequirements, setCustomRequirements] = useState<
    RoutineRequirement[]
  >([]);

  // Combine sample requirements with custom ones
  const availableRequirements = useMemo(
    () => [...SAMPLE_REQUIREMENTS, ...customRequirements],
    [customRequirements],
  );

  // Get the currently selected requirement
  const selectedRequirement = useMemo(() => {
    if (!selectedRequirementId) return null;
    return (
      availableRequirements.find((req) => req.id === selectedRequirementId) ||
      null
    );
  }, [selectedRequirementId, availableRequirements]);

  // Add a custom requirement
  const addCustomRequirement = (requirement: RoutineRequirement) => {
    setCustomRequirements((prev) => [...prev, requirement]);
  };

  // Validate a routine against the selected requirements
  const validateRoutine = (
    routine: SkillDefinition[],
  ): RequirementValidationResult[] => {
    if (!selectedRequirement) return [];
    return validateRoutineRequirements(routine, selectedRequirement);
  };

  // Check if routine is valid (all requirements met)
  const isRoutineValid = (routine: SkillDefinition[]): boolean => {
    if (!selectedRequirement) return true;
    const results = validateRoutineRequirements(routine, selectedRequirement);
    return results.every((result) => result.passed);
  };

  return {
    selectedRequirementId,
    availableRequirements,
    selectedRequirement,
    setSelectedRequirementId,
    addCustomRequirement,
    validateRoutine,
    isRoutineValid,
  };
}
