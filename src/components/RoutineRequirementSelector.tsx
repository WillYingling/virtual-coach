import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { RoutineRequirement } from "../models/RoutineRequirements";
import { NO_REQUIREMENTS } from "../models/RoutineRequirements";

interface RoutineRequirementSelectorProps {
  availableRequirements: RoutineRequirement[];
  selectedRequirementId: string | null;
  onRequirementChange: (requirementId: string | null) => void;
  disabled?: boolean;
}

export const RoutineRequirementSelector: React.FC<
  RoutineRequirementSelectorProps
> = ({
  availableRequirements,
  selectedRequirementId,
  onRequirementChange,
  disabled = false,
}) => {
  const allRequirements = [NO_REQUIREMENTS, ...availableRequirements];

  const selectedRequirement =
    allRequirements.find((req) => req.id === selectedRequirementId) ||
    NO_REQUIREMENTS;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onRequirementChange(value === "none" ? null : value);
  };

  return (
    <Box>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="routine-requirement-select-label">
          Routine Requirements
        </InputLabel>
        <Select
          labelId="routine-requirement-select-label"
          id="routine-requirement-select"
          value={selectedRequirementId || "none"}
          label="Routine Requirements"
          onChange={handleChange}
        >
          {allRequirements.map((requirement) => (
            <MenuItem key={requirement.id} value={requirement.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {requirement.name}
                </Typography>
                {requirement.difficulty && (
                  <Chip
                    size="small"
                    label={requirement.difficulty}
                    color={
                      requirement.difficulty === "Beginner"
                        ? "success"
                        : requirement.difficulty === "Intermediate"
                          ? "warning"
                          : "error"
                    }
                    variant="outlined"
                  />
                )}
                {requirement.rules.length > 0 && (
                  <Chip
                    size="small"
                    label={`${requirement.rules.length} rule${requirement.rules.length !== 1 ? "s" : ""}`}
                    variant="outlined"
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedRequirement.id !== "none" && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedRequirement.description}
          </Typography>
          {selectedRequirement.category && (
            <Chip
              size="small"
              label={selectedRequirement.category}
              sx={{ mt: 1 }}
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default RoutineRequirementSelector;
