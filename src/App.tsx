import { useState, useEffect } from 'react';
import { Stack, Button, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Simulator, { positions } from './components/Simulator';
import type { Skill } from './components/AthleteController';
import type { SkillDefinition } from './models/SkillDefinition';

function App() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>([]);

  // Load skill definitions from JSON file
  useEffect(() => {
    fetch('/skills.json')
      .then(response => response.json())
      .then((data: SkillDefinition[]) => {
        setSkillDefinitions(data);
        console.log('Loaded skill definitions:', data);
      })
      .catch(error => console.error('Error loading skills:', error));
  }, []);

  // Convert a SkillDefinition to a timed Skill for animation
  function skillDefinitionToSkill(definition: SkillDefinition): Skill {
    const keyframes = [];
    const timestamps = [];
    
    // Start position
    keyframes.push({
      height: 0,
      rotation: 0,
      twist: 0,
      joints: positions.straightArmsUp,
    });
    timestamps.push(0);
    
    // Mid position (if there's rotation)
    if (definition.flips > 0) {
      keyframes.push({
        height: 0,
        rotation: 0.25,
        twist: 0,
        joints: positions.straightArmsDown,
      });
      timestamps.push(0.1);

      keyframes.push({
        height: 0,
        rotation: definition.flips * 0.5,
        twist: definition.twists * 0.5,
        joints: positions.straightArmsDown,
      });
      timestamps.push(0.5);
      
      // Near-end position for smooth landing
      keyframes.push({
        height: 0,
        rotation: definition.flips * 0.95,
        twist: definition.twists,
        joints: positions.straightArmsUp,
      });
      timestamps.push(0.9);
    }
    
    // End position
    keyframes.push({
      height: 0,
      rotation: definition.flips,
      twist: definition.twists,
      joints: positions.straightArmsUp,
    });
    timestamps.push(1.0);
    
    return {
      positions: keyframes,
      timestamps: timestamps,
    };
  }

  function generateSkills() {
    console.log("Generating skills from definitions");
    // Convert all skill definitions to animated skills
    if (skillDefinitions.length > 0) {
      const animatedSkills = skillDefinitions.map(def => skillDefinitionToSkill(def));
      setSkills(animatedSkills);
    }
  }

  function playSkill(definition: SkillDefinition) {
    const skill = skillDefinitionToSkill(definition);
    setSkills([skill]);
  }
  
  return (
    <Stack p={1} flexGrow={1} justifyContent="center" alignItems="center">
      <Button variant="contained" onClick={generateSkills} disabled={skillDefinitions.length === 0}>
        Generate Skills
      </Button>
      <Stack direction="row" sx={{
        minWidth: "50%",
        justifyContent: "space-around"}} >
        <Stack id="routineHolder" >
          Routines
        </Stack>
        <Stack sx={{minWidth: '50%'}}>
          Skill Library
          {skillDefinitions.map((def, idx) => (
            <Stack key={idx} direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" onClick={() => playSkill(def)} color="primary">
                <PlayArrowIcon />
              </IconButton>
              <div>{def.name} - {def.flips}x{def.twists}</div>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Simulator skills={skills} />

      <Button variant="contained" onClick={() => setSkills([])} >
        Clear Skills
      </Button>
    </Stack>
  )
}

export default App
