import { forwardRef, useRef } from 'react';
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';

const Athlete = forwardRef<THREE.Group, any>((props, ref) => {
  const JumpPhase = 1.7;
  const BouncePhase = JumpPhase / 10;
  const CycleTime = JumpPhase + BouncePhase;
  let Gravity = -9.81; // m/s^2
  
  // Refs for animated joints
  const leftShoulderRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    const cycleTime = state.clock.elapsedTime % CycleTime;
    let curTime = cycleTime;
    let height = 0;
    if ( curTime > JumpPhase ) {
      curTime -= JumpPhase;
      // Bounce phase
      let landingVelocity = Gravity * JumpPhase * 0.5;
      let finalVelocity = -landingVelocity;
      let bounceAcceleration = (finalVelocity - landingVelocity) / BouncePhase;
      height = (landingVelocity * curTime) + ((0.5 * bounceAcceleration) * (curTime * curTime));
    } else {

      height = ((0.5 * Gravity) * (curTime * curTime)) - (( ((Gravity*JumpPhase)/2)*curTime));
    } 
    
    // Animate shoulder rotation following a sine wave: 0 -> PI -> 0 (use original cycleTime)
    const shoulderRotation = (Math.PI * Math.sin((Math.PI * cycleTime) / CycleTime))- (Math.PI / 8);
    
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.position.y = height;
    }
    
    if (leftShoulderRef.current) {
      leftShoulderRef.current.rotation.x = -shoulderRotation;
    }
    if (rightShoulderRef.current) {
      rightShoulderRef.current.rotation.x = -shoulderRotation;
    }
  });
  
  // Create materials for box faces: [right, left, top, bottom, front, back]
  const orangeMaterial = new THREE.MeshStandardMaterial({ color: 'orange' });
  const darkOrangeMaterial = new THREE.MeshStandardMaterial({ color: '#9d0808' });
  const boxMaterials = [
    orangeMaterial,     // right (+X)
    orangeMaterial,     // left (-X)
    orangeMaterial,     // top (+Y)
    orangeMaterial,     // bottom (-Y)
    orangeMaterial,     // front (+Z)
    darkOrangeMaterial  // back (-Z)
  ];
  
  // Dimensions
  const legWidth = 0.15;
  const legDepth = 0.2;
  const legSegmentLength = 0.48;
  const gap = 0.1;
  const torsoWidth = 0.4;
  const torsoLength = 0.58;
  const headSize = 0.28;
  const armLength = 0.48;
  const armWidth = 0.12;
  
  // Total leg length from hip to bottom of shin
  const totalLegLength = 2 * legSegmentLength + gap;
  
  // Position all body parts so that bottom of shin is at y=0 when height=0
  
  return (
    <group {...props} ref={ref}>
      {/* Left Leg */}
      <group position={[-0.15, totalLegLength, 0]}> {/* Left hip joint */}
        {/* Upper leg (thigh) */}
        <mesh position={[0, -(legSegmentLength / 2), 0]} renderOrder={1} material={boxMaterials}>
          <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
        </mesh>
        {/* Knee joint */}
        <group position={[0, -(legSegmentLength + gap), 0]}>
          {/* Lower leg (shin) */}
          <mesh position={[0, -(legSegmentLength / 2), 0]} renderOrder={1} material={boxMaterials}>
            <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
          </mesh>
        </group>
      </group>
      
      {/* Right Leg */}
      <group position={[0.15, totalLegLength, 0]}> {/* Right hip joint */}
        {/* Upper leg (thigh) */}
        <mesh position={[0, -(legSegmentLength / 2), 0]} renderOrder={1} material={boxMaterials}>
          <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
        </mesh>
        {/* Knee joint */}
        <group position={[0, -(legSegmentLength + gap), 0]}>
          {/* Lower leg (shin) */}
          <mesh position={[0, -(legSegmentLength / 2), 0]} renderOrder={1} material={boxMaterials}>
            <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
          </mesh>
        </group>
      </group>
      
      {/* Torso */}
      <group position={[0, totalLegLength + gap, 0]}> {/* Torso base joint */}
        <mesh position={[0, torsoLength / 2, 0]} renderOrder={1} material={boxMaterials}>
          <boxGeometry args={[torsoWidth, torsoLength, legDepth]} />
        </mesh>
        
        {/* Head */}
        <group position={[0, torsoLength + gap, 0]}> {/* Neck joint */}
          <mesh position={[0, headSize / 2, 0]} renderOrder={1} material={boxMaterials}>
            <boxGeometry args={[headSize, headSize, legDepth]} />
          </mesh>
        </group>
        
        {/* Left Arm */}
        <group ref={leftShoulderRef} position={[-(torsoWidth / 2 + gap), torsoLength - 0.1, 0]}> {/* Left shoulder */}
          <mesh position={[0, -(armLength / 2), 0]} renderOrder={1} material={boxMaterials}>
            <boxGeometry args={[armWidth, armLength, legDepth]} />
          </mesh>
        </group>
        
        {/* Right Arm */}
        <group ref={rightShoulderRef} position={[torsoWidth / 2 + gap, torsoLength - 0.1, 0]}> {/* Right shoulder */}
          <mesh position={[0, -(armLength / 2), 0]} renderOrder={1} material={boxMaterials}>
            <boxGeometry args={[armWidth, armLength, legDepth]} />
          </mesh>
        </group>
      </group>
    </group>
  )
});

export default Athlete;
