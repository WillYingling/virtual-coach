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
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useCallback } from "react";
import Simulator from "./Simulator";
import type { Skill } from "./AthleteController";
import type { RenderProperties } from "../utils/skillConverter";
import {
  skillDefinitionToSkill,
  getRenderPropertiesForSkill,
} from "../utils/skillConverter";
import type { SkillDefinition } from "../models/SkillDefinition";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

interface SimulatorModalProps {
  open: boolean;
  skills: Skill[];
  skillDefinitions?: SkillDefinition[];
  skillNames?: string[];
  onClose: () => void;
}

export default function SimulatorModal({
  open,
  skills: initialSkills,
  skillDefinitions = [],
  skillNames = [],
  onClose,
}: SimulatorModalProps) {
  const [jumpPhaseLength, setJumpPhaseLength] = useState(2);
  const [restartKey, setRestartKey] = useState(0);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentSkillName, setCurrentSkillName] = useState<string>(
    skillNames[0] || "",
  );
  const [modalKey, setModalKey] = useState(0);
  const [fpvEnabled, setFpvEnabled] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Advanced render properties - initialized with lazy computation
  const [renderProps, setRenderProps] = useState<RenderProperties>(() => {
    if (skillDefinitions.length > 0) {
      return getRenderPropertiesForSkill(skillDefinitions[0]);
    }
    return {
      stallRotation: 0.125,
      kickoutRotation: 0.5,
      positionTransitionDuration: 0.15,
    };
  });

  // Helper function to generate skills from definitions
  const generateSkillsFromDefinitions = useCallback(
    (renderProperties: RenderProperties) => {
      if (skillDefinitions.length > 0) {
        let cumulativeTwist = 0;
        const newSkills: Skill[] = [];

        for (const definition of skillDefinitions) {
          const skill = skillDefinitionToSkill(
            definition,
            cumulativeTwist,
            renderProperties,
          );
          newSkills.push(skill);

          // Update cumulative twist for next skill
          if (skill.positions && skill.positions.length > 0) {
            cumulativeTwist +=
              skill.positions[skill.positions.length - 1].twist;
          }
        }

        return newSkills;
      }
      return initialSkills;
    },
    [skillDefinitions, initialSkills],
  );

  // Regenerated skills based on render properties
  const [skills, setSkills] = useState<Skill[]>(() => {
    // Initialize skills with proper render properties if skill definitions are available
    if (skillDefinitions.length > 0) {
      const initialProps = getRenderPropertiesForSkill(skillDefinitions[0]);
      return generateSkillsFromDefinitions(initialProps);
    }
    return initialSkills;
  });

  // Track if we need to update render props for new skill definitions
  const [lastSkillDefinitions, setLastSkillDefinitions] =
    useState(skillDefinitions);

  // Check if skill definitions have changed and update accordingly
  if (skillDefinitions !== lastSkillDefinitions) {
    setLastSkillDefinitions(skillDefinitions);

    if (skillDefinitions.length > 0) {
      const newRenderProps = getRenderPropertiesForSkill(skillDefinitions[0]);
      const newSkills = generateSkillsFromDefinitions(newRenderProps);

      // Update both render props and skills
      setRenderProps(newRenderProps);
      setSkills(newSkills);
      setRestartKey((prev) => prev + 1); // Restart animation
    } else {
      setSkills(initialSkills);
    }
  }

  const regenerateSkills = useCallback(
    (newRenderProps: RenderProperties) => {
      const newSkills = generateSkillsFromDefinitions(newRenderProps);
      setSkills(newSkills);
      setRestartKey((prev) => prev + 1); // Restart the animation with new skills
    },
    [generateSkillsFromDefinitions],
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

  const handleClose = () => {
    // Reset modal key to force remount next time it opens
    setModalKey((prev) => prev + 1);
    onClose();
  };

  const handleJumpPhaseLengthChange = (
    _event: Event,
    newValue: number | number[],
  ) => {
    setJumpPhaseLength(newValue as number);
  };

  const handleRenderPropChange = (
    property: keyof RenderProperties,
    value: number,
  ) => {
    const newRenderProps = { ...renderProps, [property]: value };
    setRenderProps(newRenderProps);
    regenerateSkills(newRenderProps);
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <IconButton onClick={handleClose} size="small">
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
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={fpvEnabled}
                    onChange={(e) => setFpvEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="First Person View"
              />
            </Box>
          </Stack>

          {/* Advanced Controls */}
          {skillDefinitions.length > 0 && (
            <Accordion
              expanded={advancedExpanded}
              onChange={(e, isExpanded) => setAdvancedExpanded(isExpanded)}
              sx={{ mt: 2, boxShadow: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Advanced Render Properties
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Stall Rotation ({renderProps.stallRotation.toFixed(3)})
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Rotation amount during the stall phase of the skill
                    </Typography>
                    <Slider
                      value={renderProps.stallRotation}
                      onChange={(e, value) =>
                        handleRenderPropChange("stallRotation", value as number)
                      }
                      min={0}
                      max={0.5}
                      step={0.01}
                      size="small"
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Kickout Rotation ({renderProps.kickoutRotation.toFixed(3)}
                      )
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Rotation amount during the kickout phase of the skill
                    </Typography>
                    <Slider
                      value={renderProps.kickoutRotation}
                      onChange={(e, value) =>
                        handleRenderPropChange(
                          "kickoutRotation",
                          value as number,
                        )
                      }
                      min={0.1}
                      max={0.75}
                      step={0.01}
                      size="small"
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Position Transition Duration (
                      {renderProps.positionTransitionDuration.toFixed(3)})
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Duration of transition into and out of the skill position
                    </Typography>
                    <Slider
                      value={renderProps.positionTransitionDuration}
                      onChange={(e, value) =>
                        handleRenderPropChange(
                          "positionTransitionDuration",
                          value as number,
                        )
                      }
                      min={0.05}
                      max={0.4}
                      step={0.01}
                      size="small"
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>

        {/* Simulator */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Simulator
            key={modalKey}
            skills={skills}
            skillNames={skillNames}
            jumpPhaseLength={jumpPhaseLength}
            restartKey={restartKey}
            onCurrentSkillChange={handleCurrentSkillChange}
            fpvEnabled={fpvEnabled}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
