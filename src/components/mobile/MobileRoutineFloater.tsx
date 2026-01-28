import {
  Fab,
  Badge,
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Paper,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RemoveIcon from "@mui/icons-material/Remove";
import type { SkillDefinition } from "../../models/SkillDefinition";
import {
  formatPositionDisplay,
  routineDifficultyScore,
} from "../../utils/skillUtils";
import { ActionIconButton } from "../common/ActionIconButton";

interface MobileRoutineFloaterProps {
  routine: SkillDefinition[];
  onPlayRoutine: () => void;
  onClearRoutine: () => void;
  onRandomizeRoutine: () => void;
  onRemoveSkill: (index: number) => void;
  onMoveSkill: (fromIndex: number, toIndex: number) => void;
  skillDefinitionsLength: number;
  useWomensScoring?: boolean;
  onToggleScoring?: (womens: boolean) => void;
}

export const MobileRoutineFloater = ({
  routine,
  onPlayRoutine,
  onClearRoutine,
  onRandomizeRoutine,
  onRemoveSkill,
  onMoveSkill,
  skillDefinitionsLength,
  useWomensScoring = false,
  onToggleScoring,
}: MobileRoutineFloaterProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const hasTriples = routine.some((skill) => skill.flips >= 3);

  if (!isMobile) return null; // Only show on mobile

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          zIndex: 1000,
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <Badge badgeContent={routine.length} color="error" max={99}>
          <PlaylistPlayIcon sx={{ fontSize: 28 }} />
        </Badge>
      </Fab>

      {/* Bottom Drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80vh",
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Routine ({routine.length} skills)
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ p: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {routine.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No skills in routine yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add skills from the library below
              </Typography>
            </Box>
          ) : (
            <>
              {/* Routine Summary */}
              <Paper
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Difficulty
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {routineDifficultyScore(routine, useWomensScoring)} DD
                  </Typography>
                </Box>

                {hasTriples && onToggleScoring && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Scoring System:
                    </Typography>
                    <Box
                      onClick={() => onToggleScoring(!useWomensScoring)}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        cursor: "pointer",
                        minHeight: 32,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                        {useWomensScoring ? "Women's" : "Men's"}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <ActionIconButton
                  variant="primary"
                  size="medium"
                  onClick={() => {
                    onPlayRoutine();
                    setDrawerOpen(false);
                  }}
                  sx={{ flex: 1, minHeight: 48, borderRadius: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PlayArrowIcon />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Play
                    </Typography>
                  </Box>
                </ActionIconButton>

                <ActionIconButton
                  variant="warning"
                  size="medium"
                  onClick={onRandomizeRoutine}
                  disabled={skillDefinitionsLength === 0}
                  sx={{ minHeight: 48, minWidth: 48, borderRadius: 2 }}
                >
                  <ShuffleIcon />
                </ActionIconButton>

                <ActionIconButton
                  variant="error"
                  size="medium"
                  onClick={() => {
                    onClearRoutine();
                    setDrawerOpen(false);
                  }}
                  sx={{ minHeight: 48, minWidth: 48, borderRadius: 2 }}
                >
                  <DeleteIcon />
                </ActionIconButton>
              </Stack>

              {/* Skills List */}
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                <Stack spacing={1}>
                  {routine.map((def, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.default",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography variant="body1" sx={{ flex: 1 }}>
                          <strong>{idx + 1}.</strong> {def.name}
                        </Typography>

                        {/* Mobile Control Buttons */}
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => onMoveSkill(idx, idx - 1)}
                            disabled={idx === 0}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <KeyboardArrowUpIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onMoveSkill(idx, idx + 1)}
                            disabled={idx === routine.length - 1}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <KeyboardArrowDownIcon />
                          </IconButton>
                          <ActionIconButton
                            variant="error"
                            size="small"
                            onClick={() => onRemoveSkill(idx)}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </ActionIconButton>
                        </Stack>
                      </Box>

                      <Chip
                        label={formatPositionDisplay(def.position)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};
