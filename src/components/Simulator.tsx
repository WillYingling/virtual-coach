import { useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from '@react-three/drei';
import Athlete from './Athlete';
import Trampoline from './Trampoline';
import FrameMarker from './FrameMarker';
import * as THREE from 'three';

function Simulator() {
  const athleteRef = useRef<THREE.Group>(null);
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
        <Athlete ref={athleteRef} />
        
        <Trampoline athleteRef={athleteRef} />
        {/* Frame marker at origin for debugging */}
        <FrameMarker position={[0, 0, 0]} size={2} />
        <ambientLight intensity={Math.PI / 2} />
    </Canvas>
  );
}

export default Simulator;
