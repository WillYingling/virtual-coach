import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Stack,
  Paper,
  Chip,
  Button,
  IconButton,
  Switch,
  Alert,
  Collapse,
} from "@mui/material";
import { useState } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RemoveIcon from "@mui/icons-material/Remove";
import WarningIcon from "@mui/icons-material/Warning";
import type { SkillDefinition } from "../models/SkillDefinition";
import {
  formatPositionDisplay,
  routineDifficultyScore,
} from "../utils/skillUtils";
import {
  isRoutineValid,
  getRoutineValidationErrors,
} from "../utils/routineValidation";
import { ActionIconButton } from "./common/ActionIconButton";
import { CONSTANTS } from "../constants";

interface RoutineBuilderProps {
  routine: SkillDefinition[];
  onPlayRoutine: () => void;
  onClearRoutine: () => void;
  onRandomizeRoutine: () => void;
  onRemoveSkill: (index: number) => void;
  onMoveSkill: (fromIndex: number, toIndex: number) => void;
  skillDefinitionsLength: number;
}

export default function RoutineBuilder({
  routine,
  onPlayRoutine,
  onClearRoutine,
  onRandomizeRoutine,
  onRemoveSkill,
  onMoveSkill,
  skillDefinitionsLength,
}: RoutineBuilderProps) {
  const [useWomensScoring, setUseWomensScoring] = useState(false);

  // Check if routine contains any triple flips (3+ flips)
  const hasTriples = routine.some((skill) => skill.flips >= 3);

  // Validate routine
  const routineIsValid = isRoutineValid(routine);
  const validationErrors = getRoutineValidationErrors(routine);

  return (
    <Card
      sx={{
        flex: { xs: "0 0 auto", md: 1 },
        height: { xs: "calc(45vh - 20px)", md: "auto" }, // Account for AppBar and spacing
        minHeight: { xs: 200, md: 300 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardHeader
        title="Routine Builder"
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShuffleIcon />}
              onClick={onRandomizeRoutine}
              disabled={skillDefinitionsLength === 0}
            >
              Randomize
            </Button>
            {routine.length > 0 && (
              <>
                <ActionIconButton
                  variant="primary"
                  size="medium"
                  onClick={onPlayRoutine}
                  title="Play routine"
                >
                  <PlayArrowIcon />
                </ActionIconButton>
                <ActionIconButton
                  variant="error"
                  size="medium"
                  onClick={onClearRoutine}
                  title="Clear routine"
                >
                  <DeleteIcon />
                </ActionIconButton>
              </>
            )}
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ flex: 1, overflow: "auto", py: 2 }}>
        {routine.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
            No skills in routine. Add skills from the library below.
          </Typography>
        ) : (
          <>
            {/* Routine Difficulty Summary */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight={600}>
                  Routine Difficulty
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {routineDifficultyScore(routine, useWomensScoring)} DD
                </Typography>
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 0.5 }}
              >
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {routine.length} skills
                </Typography>
                {hasTriples && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        minWidth: "80px",
                        textAlign: "right",
                      }}
                    >
                      {useWomensScoring ? "Women's" : "Men's"} scoring
                    </Typography>
                    <Switch
                      checked={useWomensScoring}
                      onChange={(e) => setUseWomensScoring(e.target.checked)}
                      size="small"
                      sx={{
                        "& .MuiSwitch-switchBase": {
                          color: "white",
                          "&.Mui-checked": {
                            color: "white",
                          },
                          "&.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "rgba(255, 255, 255, 0.3)",
                          },
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Paper>

            {/* Routine Validation Warning */}
            <Collapse in={!routineIsValid && routine.length > 1}>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Invalid Routine - Position Mismatch
                </Typography>
                {validationErrors.map((error, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {error}
                  </Typography>
                ))}
                <Typography
                  variant="caption"
                  sx={{ mt: 1, display: "block", opacity: 0.8 }}
                >
                  This routine cannot be performed as skills must start from the
                  ending position of the previous skill.
                </Typography>
              </Alert>
            </Collapse>

            {/* Skills List */}
            <Stack spacing={1}>
              {routine.map((def, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1 }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Stack flex={1}>
                      <Typography variant="body1">
                        <strong>{idx + 1}.</strong> {def.name}
                      </Typography>
                      <Chip
                        label={formatPositionDisplay(def.position)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1, alignSelf: "flex-start" }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => onMoveSkill(idx, idx - 1)}
                        disabled={idx === 0}
                        title="Move up"
                        sx={{
                          width: 24,
                          height: 24,
                          color: "text.secondary",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <KeyboardArrowUpIcon
                          sx={{ fontSize: CONSTANTS.UI.ICON_SIZE_SMALL }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onMoveSkill(idx, idx + 1)}
                        disabled={idx === routine.length - 1}
                        title="Move down"
                        sx={{
                          width: 24,
                          height: 24,
                          color: "text.secondary",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <KeyboardArrowDownIcon
                          sx={{ fontSize: CONSTANTS.UI.ICON_SIZE_SMALL }}
                        />
                      </IconButton>
                      <ActionIconButton
                        variant="error"
                        size="small"
                        onClick={() => onRemoveSkill(idx)}
                        title="Remove skill"
                        sx={{ width: 24, height: 24 }}
                      >
                        <RemoveIcon
                          sx={{ fontSize: CONSTANTS.UI.ICON_SIZE_SMALL }}
                        />
                      </ActionIconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
