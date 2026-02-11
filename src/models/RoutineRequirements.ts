// Models for Routine Requirements feature
// Defines requirement rules and validation logic

import type { SkillDefinition } from "./SkillDefinition";

export interface RoutineRule {
  id: string;
  description: string;
  validator: (routine: SkillDefinition[]) => boolean;
  details?: string; // Optional additional details about the rule
}

export interface RoutineRequirement {
  id: string;
  name: string;
  description: string;
  rules: RoutineRule[];
  category?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface RequirementValidationResult {
  ruleId: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface RoutineRequirementsState {
  selectedRequirementId: string | null;
  customRules: RoutineRule[];
  isActive: boolean;
}

// Pre-defined requirement types
export const REQUIREMENT_TYPES = {
  NONE: "none",
  CUSTOM: "custom",
  PREDEFINED: "predefined",
} as const;

export type RequirementType =
  (typeof REQUIREMENT_TYPES)[keyof typeof REQUIREMENT_TYPES];

// Default "No Requirements" option
export const NO_REQUIREMENTS: RoutineRequirement = {
  id: "none",
  name: "No Requirements",
  description: "Build any routine without restrictions",
  rules: [],
};
