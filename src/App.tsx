import { useState } from 'react';
import { Stack, Button } from '@mui/material';
import Simulator from './components/Simulator';

function App() {
  const [skills, setSkills] = useState<string[]>([]);

  function generateSkills() {
    console.log("Generating skills");
    setSkills(["Skill 1", "Skill 2", "Skill3"])
  }
  
  return (
    <Stack p={1} flexGrow={1} justifyContent="center" alignItems="center">
      <Button variant="contained" onClick={generateSkills}>
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
        </Stack>
      </Stack>

      <Simulator />
    </Stack>
  )
}

export default App
