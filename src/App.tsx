import { useState, useEffect } from "react";
import { Stack, Button, IconButton, ButtonGroup } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Simulator from "./components/Simulator";
import type { Skill } from "./components/AthleteController";
import type { SkillDefinition } from "./models/SkillDefinition";
import { Position } from "./models/SkillDefinition";
import { skillDefinitionToSkill } from "./utils/skillConverter";

function App() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>(
    [],
  );
  const [routine, setRoutine] = useState<SkillDefinition[]>([]);
  const [renderProperties, setRenderProperties] = useState({
    stallDuration: 0.1,
    stallRotation: 0.1,
    kickoutDuration: 0.5,
    kickoutRotation: 0.5,
  });

  // Load skill definitions from JSON file
  useEffect(() => {
    fetch("/skills.json")
      .then((response) => response.json())
      .then((data: SkillDefinition[]) => {
        setSkillDefinitions(data);
        console.log("Loaded skill definitions:", data);
      })
      .catch((error) => console.error("Error loading skills:", error));
  }, []);

  function generateSkills() {
    console.log("Generating skills from definitions");
    // Convert all skill definitions to animated skills
    if (skillDefinitions.length > 0) {
      const animatedSkills = skillDefinitions.map((def) =>
        skillDefinitionToSkill(def, renderProperties),
      );
      setSkills(animatedSkills);
    }
  }

  function playSkill(definition: SkillDefinition) {
    const skill = skillDefinitionToSkill(definition, renderProperties);
    setSkills([skill]);
  }

  function playSkillWithPosition(
    definition: SkillDefinition,
    position: Position,
  ) {
    const modifiedDef = { ...definition, position };
    const skill = skillDefinitionToSkill(modifiedDef, renderProperties);
    setSkills([skill]);
  }

  function addToRoutine(definition: SkillDefinition) {
    setRoutine([...routine, definition]);
  }

  function playRoutine() {
    if (routine.length > 0) {
      const animatedSkills = routine.map((def) =>
        skillDefinitionToSkill(def, renderProperties),
      );
      setSkills(animatedSkills);
    }
  }

  function clearRoutine() {
    setRoutine([]);
  }

  return (
    <Stack p={1} flexGrow={1} justifyContent="center" alignItems="center">
      <Button
        variant="contained"
        onClick={generateSkills}
        disabled={skillDefinitions.length === 0}
      >
        Generate Skills
      </Button>
      <Stack
        direction="row"
        sx={{
          minWidth: "50%",
          justifyContent: "space-around",
        }}
      >
        <Stack
          id="routineHolder"
          sx={{
            minWidth: "25%",
            border: "2px solid #1976d2",
            borderRadius: 2,
            p: 2,
            mr: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <strong>Routines</strong>
            {routine.length > 0 && (
              <>
                <IconButton size="small" onClick={playRoutine} color="primary">
                  <PlayArrowIcon />
                </IconButton>
                <IconButton size="small" onClick={clearRoutine} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </Stack>
          {routine.map((def, idx) => (
            <div key={idx}>
              {idx + 1}. {def.name} ({def.position})
            </div>
          ))}
        </Stack>
        <Stack
          sx={{
            minWidth: "50%",
            border: "2px solid #2e7d32",
            borderRadius: 2,
            p: 2,
          }}
        >
          <strong>Skill Library</strong>
          {skillDefinitions.map((def, idx) => (
            <Stack key={idx} direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                onClick={() => playSkill(def)}
                color="primary"
              >
                <PlayArrowIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => addToRoutine(def)}
                color="success"
              >
                <AddIcon />
              </IconButton>
              <div>
                {def.name} - {def.flips}x{def.twists}
              </div>
              {def.possiblePositions && def.possiblePositions.length > 1 && (
                <ButtonGroup size="small" variant="outlined">
                  {def.possiblePositions.map((pos) => (
                    <Button
                      key={pos}
                      onClick={() => playSkillWithPosition(def, pos)}
                    >
                      {pos}
                    </Button>
                  ))}
                </ButtonGroup>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Simulator skills={skills} />

      <Button variant="contained" onClick={() => setSkills([])}>
        Clear Skills
      </Button>
    </Stack>
  );
}

export default App;
