import { Canvas } from "@react-three/fiber";
import { OrbitControls } from '@react-three/drei';
import FrameMarker from './FrameMarker';
import AthleteController, { type Skill } from './AthleteController';

export const positions = {
  tuck: {
    leftShoulder: 3*Math.PI / 2,  // Equivalent to -π/2, but interpolates shorter path from π
    rightShoulder: 3*Math.PI / 2,
    leftThigh: -3*Math.PI/4,
    rightThigh: -3*Math.PI/4,

    leftShin: 3*Math.PI/4,
    rightShin: 3*Math.PI/4,
  },
  pike: {
    leftShoulder: 3*Math.PI / 2,
    rightShoulder: 3*Math.PI / 2,
    leftThigh: -3*Math.PI/4,
    rightThigh: -3*Math.PI/4,

    leftShin: 0,
    rightShin: 0,
  },
  straightArmsUp: {
    leftShoulder: Math.PI,
    rightShoulder: Math.PI,
    leftThigh: 0,
    rightThigh: 0,

    leftShin: 0,
    rightShin: 0,
  },
  straightArmsDown: {
    leftShoulder: 2*Math.PI,
    rightShoulder: 2*Math.PI,
    leftThigh: 0,
    rightThigh: 0,

    leftShin: 0,
    rightShin: 0,
  },
};

interface SimulatorProps {
  skills: Skill[];
}

function Simulator({ skills }: SimulatorProps) {
  // Rotate camera position 45 degrees around Z axis
  const angle = Math.PI / 4; // 45 degrees
  const x = 0 * Math.cos(angle) - 5 * Math.sin(angle);
  const y = 0 * Math.sin(angle) + 5 * Math.cos(angle);
  const z = 18;
  
  
  return (
    <Canvas style={{ width: '90vw', height: '400px', border: '1px solid red' }}
        camera={{ position: [x, y, z], fov: 55 }}
    >
        <OrbitControls target={[0, 5, 0]} enableZoom={true} enablePan={false} />
        <AthleteController skills={skills} />
        {/* Frame marker at origin for debugging */}
        <FrameMarker position={[0, 0, 0]} size={2} />
        <ambientLight intensity={Math.PI / 2} />
    </Canvas>
  );
}

export default Simulator;
