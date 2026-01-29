import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Stack,
  Paper,
  Box,
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
                          direction={isMobile ? "column" : "row"}
                          alignItems={isMobile ? "stretch" : "center"}
                          spacing={isMobile ? 1 : 1.5}
                          sx={{ p: isMobile ? 1 : 1.5 }}
                        >
                          {/* Header Row on Mobile: Action Buttons + Skill Name */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ width: "100%" }}
                          >
                            <Stack direction="row" spacing={0.5}>
                              <ActionIconButton
                                variant="primary"
                                size="small"
                                onClick={() => onPlaySkill(def)}
                                title="Play skill"
                              >
                                <PlayArrowIcon
                                  sx={{
                                    fontSize: CONSTANTS.UI.ICON_SIZE_SMALL,
                                  }}
                                />
                              </ActionIconButton>
                              <ActionIconButton
                                variant="success"
                                size="small"
                                onClick={() => onAddToRoutine(def)}
                                title="Add to routine"
                              >
                                <AddIcon
                                  sx={{
                                    fontSize: CONSTANTS.UI.ICON_SIZE_SMALL,
                                  }}
                                />
                              </ActionIconButton>
                            </Stack>

                            {/* Skill Name */}
                            <Box
                              sx={{
                                minWidth: isMobile
                                  ? "auto"
                                  : CONSTANTS.UI.MIN_SKILL_NAME_WIDTH,
                                flexShrink: 0,
                                flex: isMobile ? 1 : "auto",
                                ml: isMobile ? 1 : 0,
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                  fontSize: "0.875rem",
                                  textAlign: isMobile ? "right" : "left",
                                  margin: 1,
                                }}
                              >
                                {def.name}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Stats and Position Row */}
                          <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={isMobile ? 1 : 2}
                            alignItems={isMobile ? "stretch" : "center"}
                            sx={{ width: "100%" }}
                          >
                            {/* Difficulty & Position */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                justifyContent={
                                  isMobile ? "flex-start" : "flex-end"
                                }
                                sx={{
                                  gap: 0.5,
                                  "& > *": {
                                    minWidth: isMobile ? "auto" : "initial",
                                    flexShrink: 0,
                                  },
                                }}
                              >
                                <ToggleButtonGroup
                                  value={selectedPosition}
                                  exclusive
                                  onChange={(_, value) => {
                                    if (value !== null) {
                                      onSelectPosition(def.name, value);
                                    }
                                  }}
                                >
                                  {def.possiblePositions!.map((pos) => {
                                    const skillWithPosition = {
                                      ...def,
                                      position: pos,
                                    };
                                    const difficulty =
                                      calculateDifficultyScore(
                                        skillWithPosition,
                                      );

                                    return (
                                      <ToggleButton value={pos}>
                                        {formatPositionDisplay(pos)} :{" "}
                                        {difficulty.toFixed(1)}
                                      </ToggleButton>
                                    );
                                  })}
                                </ToggleButtonGroup>
                              </Stack>
                            </Box>
                          </Stack>
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
