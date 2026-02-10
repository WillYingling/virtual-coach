import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
// import FrameMarker from "./FrameMarker";
import AthleteController, { type Skill } from "./AthleteController";
import * as THREE from "three";

export const positions = {
  Tuck: {
    leftShoulder: (7 * Math.PI) / 4,
    rightShoulder: (7 * Math.PI) / 4,
    leftThigh: (-3 * Math.PI) / 4,
    rightThigh: (-3 * Math.PI) / 4,

    leftShin: (3 * Math.PI) / 4,
    rightShin: (3 * Math.PI) / 4,
  },
  Pike: {
    leftShoulder: (7 * Math.PI) / 4,
    rightShoulder: (7 * Math.PI) / 4,
    leftThigh: (-3 * Math.PI) / 4,
    rightThigh: (-3 * Math.PI) / 4,

    leftShin: 0,
    rightShin: 0,
  },
  StraightArmsUp: {
    leftShoulder: Math.PI,
    rightShoulder: Math.PI,
    leftThigh: 0,
    rightThigh: 0,

    leftShin: 0,
    rightShin: 0,
  },
  StraightArmsDown: {
    leftShoulder: 2 * Math.PI,
    rightShoulder: 2 * Math.PI,
    leftThigh: 0,
    rightThigh: 0,

    leftShin: 0,
    rightShin: 0,
  },
  Straddle: {
    leftShoulder: (7 * Math.PI) / 4,
    rightShoulder: (7 * Math.PI) / 4,
    leftThigh: (-3 * Math.PI) / 4,
    rightThigh: (-3 * Math.PI) / 4,
    leftThighSpread: -Math.PI / 4,
    rightThighSpread: -Math.PI / 4,
    leftShin: 0,
    rightShin: 0,
  },
  HandsAndKnees: {
    leftShoulder: (3 * Math.PI) / 2,
    rightShoulder: (3 * Math.PI) / 2,
    leftThigh: -Math.PI / 2,
    rightThigh: -Math.PI / 2,
    leftShin: Math.PI / 2,
    rightShin: Math.PI / 2,
  },
};

const trampolineHeight = 1.6;

interface SimulatorProps {
  skills: Skill[];
  skillNames?: string[];
  jumpPhaseLength?: number;
  restartKey?: number;
  onCurrentSkillChange?: (skillIndex: number, skillName?: string) => void;
  fpvEnabled?: boolean;
}

function Simulator({
  skills,
  skillNames,
  jumpPhaseLength = 2,
  restartKey = 0,
  onCurrentSkillChange,
  fpvEnabled = false,
}: SimulatorProps) {
  // Rotate camera position 45 degrees around Z axis
  const angle = Math.PI / 4; // 45 degrees
  const x = 0 * Math.cos(angle) - 5 * Math.sin(angle);
  const y = 0 * Math.sin(angle) + 5 * Math.cos(angle);
  const z = 18;

  return (
    <Canvas
      style={{ width: "100%", height: "500px", borderRadius: "8px" }}
      camera={{ position: [x, y, z], fov: 55 }}
    >
      {/* Sky background */}
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 20, 60]} />

      {/* Lighting */}
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[10, 20, 10]} intensity={1} />

      {/* Ground plane - positioned below the trampoline */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -trampolineHeight, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a7c59" side={THREE.DoubleSide} />
      </mesh>

      {/* Grid for spatial reference - positioned below trampoline */}
      <Grid
        position={[0, -trampolineHeight + 0.01, 0]}
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#ffffff"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3a5a49"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Directional markers - colored walls to show front (gold) and back (silver) */}
      <mesh position={[0, 3, -20]} receiveShadow>
        <boxGeometry args={[40, 6, 1]} />
        <meshStandardMaterial color="#d4af37" />
      </mesh>

      <mesh position={[0, 3, 20]} receiveShadow>
        <boxGeometry args={[40, 6, 1]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>

      {!fpvEnabled && (
        <OrbitControls target={[0, 5, 0]} enableZoom={true} enablePan={false} />
      )}
      <AthleteController
        skills={skills}
        skillNames={skillNames}
        jumpPhaseLength={jumpPhaseLength}
        restartKey={restartKey}
        onCurrentSkillChange={onCurrentSkillChange}
        fpvEnabled={fpvEnabled}
      />
      {/* Frame marker at origin for debugging */}
      {/* <FrameMarker position={[0, 0, 0]} size={2} /> */}
    </Canvas>
  );
}

export default Simulator;
