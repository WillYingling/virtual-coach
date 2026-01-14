import { forwardRef } from 'react';
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';

const Athlete = forwardRef<THREE.Group, any>((props, ref) => {
  const JumpPhase = 0.0001;
  const BouncePhase = JumpPhase / 10;
  const CycleTime = JumpPhase + BouncePhase;
  let Gravity = -9.81; // m/s^2
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    let curTime = state.clock.elapsedTime % CycleTime;
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
    
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.position.y = height;
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
  
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <group {...props} ref={ref}>
      <mesh position={[0, 0, 0]} renderOrder={1} material={boxMaterials}>
        <boxGeometry args={[0.5, 1, 0.2]} />
      </mesh>
      
      <mesh position={[0, 1.1, 0]} renderOrder={1} material={boxMaterials}>
        <boxGeometry args={[0.5, 1, 0.2]} />
      </mesh>
    </group>
  )
});

export default Athlete;
