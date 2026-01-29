import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Stack,
  Paper,
  Box,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Position } from "../models/SkillDefinition";
import {
  groupSkillsByFlips,
  sortFlipCategories,
  formatPositionDisplay,
  calculateDifficultyScore,
} from "../utils/skillUtils";
import { ActionIconButton } from "./common/ActionIconButton";
import { SkillChip } from "./common/SkillChip";
import { CONSTANTS } from "../constants";

interface SkillLibraryProps {
  skillDefinitions: SkillDefinition[];
  selectedPositions: Record<string, Position | undefined>;
  onPlaySkill: (definition: SkillDefinition) => void;
  onAddToRoutine: (definition: SkillDefinition) => void;
  onSelectPosition: (skillName: string, position: Position) => void;
}

export default function SkillLibrary({
  skillDefinitions,
  selectedPositions,
  onPlaySkill,
  onAddToRoutine,
  onSelectPosition,
}: SkillLibraryProps) {
  return (
    <Card
      sx={{
        flex: { xs: "1 1 auto", md: 1.5 },
        height: { xs: "calc(55vh - 20px)", md: "auto" }, // Account for AppBar and spacing
        minHeight: { xs: 200, md: 300 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardHeader
        title="Skill Library"
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
        subheader={`${skillDefinitions.length} skills available`}
        sx={{ flexShrink: 0 }}
      />
      <Divider />
      <CardContent sx={{ flex: 1, overflow: "auto", py: { xs: 1, sm: 2 } }}>
        {skillDefinitions.length === 0 ? (
          <Typography color="text.secondary">Loading skills...</Typography>
        ) : (
          <Stack spacing={2}>
            {sortFlipCategories(
              Object.entries(groupSkillsByFlips(skillDefinitions)),
            ).map(([category, skills]) => (
              <Box key={category}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1,
                    pb: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    color: "primary.main",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  {category}{" "}
                  <Typography
                    component="span"
                    sx={{ color: "text.secondary", fontWeight: 400 }}
                  >
                    ({skills.length})
                  </Typography>
                </Typography>
                <Stack spacing={1}>
                  {skills.map((def, idx) => {
                    const hasMultiplePositions =
                      def.possiblePositions && def.possiblePositions.length > 1;
                    const selectedPosition = selectedPositions[def.name];

                    return (
                      <Paper
                        key={`${category}-${idx}`}
                        variant="outlined"
                        sx={{
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ p: 1.5 }}
                        >
                          {/* Action Buttons */}
                          <Stack direction="row" spacing={0.5}>
                            <ActionIconButton
                              variant="primary"
                              size="small"
                              onClick={() => onPlaySkill(def)}
                              title="Play skill"
                            >
                              <PlayArrowIcon
                                sx={{ fontSize: CONSTANTS.UI.ICON_SIZE_SMALL }}
                              />
                            </ActionIconButton>
                            <ActionIconButton
                              variant="success"
                              size="small"
                              onClick={() => onAddToRoutine(def)}
                              title="Add to routine"
                            >
                              <AddIcon
                                sx={{ fontSize: CONSTANTS.UI.ICON_SIZE_SMALL }}
                              />
                            </ActionIconButton>
                          </Stack>

                          {/* Skill Name */}
                          <Box
                            sx={{
                              minWidth: CONSTANTS.UI.MIN_SKILL_NAME_WIDTH,
                              flexShrink: 0,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.875rem" }}
                            >
                              {def.name}
                            </Typography>
                          </Box>

                          {/* Stats */}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              minWidth: CONSTANTS.UI.MIN_STATS_WIDTH,
                              flexShrink: 0,
                            }}
                          >
                            {def.isBackSkill && (
                              <SkillChip variant="back" label="Back" />
                            )}
                            <SkillChip
                              variant="twists"
                              label={`${def.twists}T`}
                            />
                          </Stack>

                          {/* Difficulty & Position */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {hasMultiplePositions ? (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                              >
                                {def.possiblePositions!.map((pos) => {
                                  const isSelected = selectedPosition === pos;
                                  const skillWithPosition = {
                                    ...def,
                                    position: pos,
                                  };
                                  const difficulty =
                                    calculateDifficultyScore(skillWithPosition);

                                  return (
                                    <SkillChip
                                      key={pos}
                                      variant={
                                        isSelected ? "selected" : "unselected"
                                      }
                                      label={`${formatPositionDisplay(pos)}: ${difficulty}`}
                                      clickable
                                      onClick={() =>
                                        onSelectPosition(def.name, pos)
                                      }
                                      sx={{
                                        cursor: "pointer",
                                        transition: "all 0.2s ease-in-out",
                                        "&:hover": {
                                          transform: isSelected
                                            ? "scale(1.05)"
                                            : "scale(1.02)",
                                        },
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            ) : (
                              <SkillChip
                                variant="difficulty"
                                label={`${formatPositionDisplay(def.position)}: ${calculateDifficultyScore(def)} DD`}
                              />
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
