import {
  Box,
  Collapse,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { SkillDefinition } from "../../models/SkillDefinition";
import { Position } from "../../models/SkillDefinition";
import {
  formatPositionDisplay,
  calculateDifficultyScore,
} from "../../utils/skillUtils";

interface MobileSkillCategoryProps {
  category: string;
  skills: SkillDefinition[];
  selectedPositions: Record<string, Position | undefined>;
  onPlaySkill: (definition: SkillDefinition) => void;
  onAddToRoutine: (definition: SkillDefinition) => void;
  onSelectPosition: (skillName: string, position: Position) => void;
  defaultExpanded?: boolean;
}

export const MobileSkillCategory = ({
  category,
  skills,
  selectedPositions,
  onPlaySkill,
  onAddToRoutine,
  onSelectPosition,
  defaultExpanded = false,
}: MobileSkillCategoryProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) return null; // Only render on mobile

  return (
    <Box>
      {/* Category Header - Collapsible */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          px: 1,
          bgcolor: "background.paper",
          borderRadius: 1,
          mb: 1,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
          {category}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {skills.length} skills
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Skills List - Collapsible */}
      <Collapse in={expanded}>
        <Box sx={{ pb: 2 }}>
          {skills.map((def, idx) => {
            const hasMultiplePositions =
              def.possiblePositions && def.possiblePositions.length > 1;
            const selectedPosition = selectedPositions[def.name];

            return (
              <Box
                key={`${category}-${idx}`}
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {/* Skill Name & Quick Actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
                    {def.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <IconButton
                      size="large"
                      onClick={() => onPlaySkill(def)}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        minWidth: 48,
                        minHeight: 48,
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    >
                      ▶
                    </IconButton>
                    <IconButton
                      size="large"
                      onClick={() => onAddToRoutine(def)}
                      sx={{
                        bgcolor: "success.main",
                        color: "white",
                        minWidth: 48,
                        minHeight: 48,
                        "&:hover": { bgcolor: "success.dark" },
                      }}
                    >
                      +
                    </IconButton>
                  </Box>
                </Box>

                {/* Skill Info Pills */}
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  {def.isBackSkill && (
                    <Box
                      sx={{
                        bgcolor: "warning.light",
                        color: "warning.contrastText",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      Back
                    </Box>
                  )}
                  <Box
                    sx={{
                      bgcolor: "secondary.light",
                      color: "secondary.contrastText",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    {def.twists}T
                  </Box>
                </Box>

                {/* Position Selection */}
                {hasMultiplePositions ? (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {def.possiblePositions!.map((pos: Position) => {
                      const isSelected = selectedPosition === pos;
                      const skillWithPosition = { ...def, position: pos };
                      const difficulty =
                        calculateDifficultyScore(skillWithPosition);

                      return (
                        <Box
                          key={pos}
                          onClick={() => onSelectPosition(def.name, pos)}
                          sx={{
                            bgcolor: isSelected
                              ? "success.main"
                              : "rgba(255, 255, 255, 0.08)",
                            color: isSelected
                              ? "success.contrastText"
                              : "rgba(255, 255, 255, 0.7)",
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            fontSize: "0.875rem",
                            fontWeight: isSelected ? 600 : 400,
                            cursor: "pointer",
                            minHeight: 40, // Better touch target
                            display: "flex",
                            alignItems: "center",
                            border: isSelected ? "2px solid" : "1px solid",
                            borderColor: isSelected
                              ? "success.dark"
                              : "rgba(255, 255, 255, 0.23)",
                            transition: "all 0.2s ease-in-out",
                            "&:active": {
                              transform: "scale(0.98)",
                            },
                          }}
                        >
                          {formatPositionDisplay(pos)}: {difficulty} DD
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {formatPositionDisplay(def.position)}:{" "}
                    {calculateDifficultyScore(def)} DD
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};
