import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  IconButton,
  Button,
  Slider,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useState } from "react";
import Simulator from "./Simulator";
import type { Skill } from "./AthleteController";

interface SimulatorModalProps {
  open: boolean;
  skills: Skill[];
  skillNames?: string[];
  onClose: () => void;
}

export default function SimulatorModal({
  open,
  skills,
  skillNames = [],
  onClose,
}: SimulatorModalProps) {
  const [jumpPhaseLength, setJumpPhaseLength] = useState(2);
  const [restartKey, setRestartKey] = useState(0);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentSkillName, setCurrentSkillName] = useState<string>(
    skillNames[0] || "",
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleCurrentSkillChange = (skillIndex: number, skillName?: string) => {
    setCurrentSkillIndex(skillIndex);
    setCurrentSkillName(skillName || "");
  };

  const handleRestart = () => {
    setRestartKey((prev) => prev + 1);
    // Reset to first skill when restarting
    setCurrentSkillIndex(0);
    setCurrentSkillName(skillNames[0] || "");
  };

  const handleJumpPhaseLengthChange = (
    _event: Event,
    newValue: number | number[],
  ) => {
    setJumpPhaseLength(newValue as number);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? "100vh" : "80vh",
          maxHeight: isMobile ? "100vh" : "80vh",
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" component="div">
            3D Simulator
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent
        sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Control Panel */}
        <Box
          sx={{
            p: isMobile ? 1.5 : 2,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={isMobile ? 2 : 3}
            alignItems={isMobile ? "stretch" : "center"}
          >
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestart}
              size="small"
              sx={{
                alignSelf: isMobile ? "flex-start" : "auto",
                maxWidth: isMobile ? "150px" : "auto",
              }}
            >
              Restart
            </Button>

            {/* Current Skill Display */}
            <Box sx={{ minWidth: isMobile ? "auto" : 200 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Skill
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {currentSkillName || "No skill"}
                {skills.length > 1 &&
                  ` (${currentSkillIndex + 1}/${skills.length})`}
              </Typography>
            </Box>

            <Box sx={{ minWidth: isMobile ? "auto" : 200 }}>
              <Typography variant="body2" gutterBottom>
                Air Time
              </Typography>
              <Slider
                value={jumpPhaseLength}
                onChange={handleJumpPhaseLengthChange}
                min={0.75}
                max={3.2}
                step={0.1}
                size="small"
                sx={{
                  width: isMobile ? "100%" : 180,
                  maxWidth: isMobile ? "300px" : "180px",
                }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Simulator */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Simulator
            skills={skills}
            skillNames={skillNames}
            jumpPhaseLength={jumpPhaseLength}
            restartKey={restartKey}
            onCurrentSkillChange={handleCurrentSkillChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
