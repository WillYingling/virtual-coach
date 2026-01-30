import { Stack, AppBar, Toolbar, Typography, Box } from "@mui/material";
import SportsGymnasticsIcon from "@mui/icons-material/SportsGymnastics";
import { useCallback } from "react";
import RoutineBuilder from "./components/RoutineBuilder";
import SkillLibrary from "./components/SkillLibrary";
import SimulatorModal from "./components/SimulatorModal";
import type { SkillDefinition } from "./models/SkillDefinition";
import { useSkillDefinitions, useRoutine } from "./hooks/useSkills";
import { useSimulator } from "./hooks/useSimulator";

function App() {
  const { skillDefinitions, selectedPositions, selectPosition } =
    useSkillDefinitions();
  const {
    routine,
    addToRoutine,
    clearRoutine,
    randomizeRoutine,
    removeSkill,
    moveSkill,
  } = useRoutine(skillDefinitions);
  const {
    skills,
    skillNames,
    skillDefinitions: simulatorSkillDefinitions,
    simulatorOpen,
    playSkill,
    playRoutine,
    closeSimulator,
  } = useSimulator();

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePlaySkill = useCallback(
    (definition: SkillDefinition) => {
      const selectedPos = selectedPositions[definition.name];
      playSkill(definition, selectedPos);
    },
    [selectedPositions, playSkill],
  );

  const handleAddToRoutine = useCallback(
    (definition: SkillDefinition) => {
      const selectedPos = selectedPositions[definition.name];
      addToRoutine(definition, selectedPos);
    },
    [selectedPositions, addToRoutine],
  );

  const handlePlayRoutine = useCallback(() => {
    playRoutine(routine);
  }, [routine, playRoutine]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: "100dvh", sm: "100vh" }, // Use dynamic viewport height on mobile
        minHeight: "100vh", // Fallback for older browsers
        bgcolor: "grey.50",
        maxWidth: "none",
      }}
    >
      <AppBar
        position="static"
        elevation={1}
        sx={{
          bgcolor: "primary.main",
          flexShrink: 0,
          width: "100vw",
          maxWidth: "none",
        }}
      >
        <Toolbar sx={{ px: 0, width: "100%" }}>
          {" "}
          {/* Remove horizontal padding */}
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <SportsGymnasticsIcon sx={{ mr: 2 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
            >
              Trampoline Skill Generator
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          py: { xs: 0.5, sm: 3 }, // Reduce mobile padding to save height
          px: 0, // Remove all horizontal padding for true full width
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxWidth: "none",
        }}
      >
        <Box
          sx={{
            maxWidth: "none",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 0.5, sm: 1, md: 2 }} // Reduce spacing for more usable space
            sx={{
              maxWidth: "none",
              flex: 1,
              overflow: "hidden",
              px: { xs: 1, sm: 2, md: 3 }, // Add more padding on desktop to prevent edge touching
            }}
          >
            <RoutineBuilder
              routine={routine}
              onPlayRoutine={handlePlayRoutine}
              onClearRoutine={clearRoutine}
              onRandomizeRoutine={randomizeRoutine}
              onRemoveSkill={removeSkill}
              onMoveSkill={moveSkill}
              skillDefinitionsLength={skillDefinitions.length}
            />

            <SkillLibrary
              skillDefinitions={skillDefinitions}
              selectedPositions={selectedPositions}
              onPlaySkill={handlePlaySkill}
              onAddToRoutine={handleAddToRoutine}
              onSelectPosition={selectPosition}
            />
          </Stack>
        </Box>
      </Box>

      <SimulatorModal
        open={simulatorOpen}
        skills={skills}
        skillDefinitions={simulatorSkillDefinitions}
        skillNames={skillNames}
        onClose={closeSimulator}
      />
    </Box>
  );
}

export default App;
