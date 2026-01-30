import { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import FrameMarker from "./FrameMarker";
import { PerspectiveCamera } from "@react-three/drei";

// Complete athlete position state
export interface AthletePosition {
  height?: number;
  rotation: number; // Rotation around X-axis (number of rotations, 1.0 = 2π) - somersault
  twist: number; // Rotation around Y-axis (number of rotations, 1.0 = 2π) - twist
  joints: {
    leftShoulder: number; // Rotation angle in radians (1 DOF)
    rightShoulder: number; // Rotation angle in radians (1 DOF)
    leftThigh: number; // Hip joint rotation angle in radians (1 DOF)
    rightThigh: number; // Hip joint rotation angle in radians (1 DOF)
    leftShin: number; // Knee joint rotation angle in radians (1 DOF)
    rightShin: number; // Knee joint rotation angle in radians (1 DOF)
  };
}

const fpvDownwardLookAngle = Math.PI / 6;

interface AthleteProps {
  athletePosition?: AthletePosition;
  fpvEnabled?: boolean;
}

const Athlete = forwardRef<THREE.Group, AthleteProps>((props, ref) => {
  const { fpvEnabled = false } = props;
  // Refs for animated joints
  const leftShoulderRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const leftThighRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);

  // Subscribe this component to the render-loop, rotate the mesh every frame
  // Separate refs for flip and twist groups
  const flipGroupRef = useRef<THREE.Group>(null);
  const twistGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // Apply position from props if provided
    if (props.athletePosition) {
      const { height, rotation, twist, joints } = props.athletePosition;

      // Apply height to main group
      if (
        ref &&
        typeof ref !== "function" &&
        ref.current &&
        height !== undefined
      ) {
        ref.current.position.y = height;
      }

      // Apply flip (X rotation) around world X axis first
      if (flipGroupRef.current) {
        flipGroupRef.current.rotation.x = rotation * 2 * Math.PI;
      }

      // Apply twist (Y rotation) around body axis
      if (twistGroupRef.current) {
        twistGroupRef.current.rotation.y = twist * 2 * Math.PI;
      }

      // Apply joint rotations
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = joints.leftShoulder;
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = joints.rightShoulder;
      }
      if (leftThighRef.current) {
        leftThighRef.current.rotation.x = joints.leftThigh;
      }
      if (rightThighRef.current) {
        rightThighRef.current.rotation.x = joints.rightThigh;
      }
      if (leftShinRef.current) {
        leftShinRef.current.rotation.x = joints.leftShin;
      }
      if (rightShinRef.current) {
        rightShinRef.current.rotation.x = joints.rightShin;
      }
    }
  });

  // Create materials for box faces: [right, left, top, bottom, front, back]
  const orangeMaterial = new THREE.MeshStandardMaterial({ color: "orange" });
  const darkOrangeMaterial = new THREE.MeshStandardMaterial({
    color: "#9d0808",
  });
  const boxMaterials = [
    orangeMaterial, // right (+X)
    orangeMaterial, // left (-X)
    orangeMaterial, // top (+Y)
    orangeMaterial, // bottom (-Y)
    orangeMaterial, // front (+Z)
    darkOrangeMaterial, // back (-Z)
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

  // Total leg length from hip to bottom of shin (calculated but not used)
  // const totalLegLength = 2 * legSegmentLength + gap;

  // Position root at hip level - feet will be at y=-totalLegLength when standing

  return (
    <group {...props} ref={ref}>
      {/* Frame marker at athlete root */}
      {/* <FrameMarker position={[0, 0, 0]} size={1} /> */}
      {/* Flip group - applies X rotation around world axis first */}
      <group ref={flipGroupRef}>
        {/* Twist group - applies Y rotation around body axis */}
        <group ref={twistGroupRef}>
          {/* Left Leg */}
          <group ref={leftThighRef} position={[-0.15, 0, 0]}>
            {/* Upper leg (thigh) */}
            <mesh
              position={[0, -(legSegmentLength / 2), 0]}
              renderOrder={1}
              material={boxMaterials}
            >
              <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
            </mesh>
            {/* Knee joint */}
            <group
              ref={leftShinRef}
              position={[0, -(legSegmentLength + gap), 0]}
            >
              {/* Lower leg (shin) */}
              <mesh
                position={[0, -(legSegmentLength / 2), 0]}
                renderOrder={1}
                material={boxMaterials}
              >
                <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
              </mesh>
            </group>
          </group>

          {/* Right Leg */}
          <group ref={rightThighRef} position={[0.15, 0, 0]}>
            {/* Upper leg (thigh) */}
            <mesh
              position={[0, -(legSegmentLength / 2), 0]}
              renderOrder={1}
              material={boxMaterials}
            >
              <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
            </mesh>
            {/* Knee joint */}
            <group
              ref={rightShinRef}
              position={[0, -(legSegmentLength + gap), 0]}
            >
              {/* Lower leg (shin) */}
              <mesh
                position={[0, -(legSegmentLength / 2), 0]}
                renderOrder={1}
                material={boxMaterials}
              >
                <boxGeometry args={[legWidth, legSegmentLength, legDepth]} />
              </mesh>
            </group>
          </group>

          {/* Torso */}
          <group position={[0, gap, 0]}>
            <mesh
              position={[0, torsoLength / 2, 0]}
              renderOrder={1}
              material={boxMaterials}
            >
              <boxGeometry args={[torsoWidth, torsoLength, legDepth]} />
            </mesh>

            {/* Head */}
            <group position={[0, torsoLength + gap, 0]}>
              <FrameMarker position={[0, 0, 0]} size={0} />
              <PerspectiveCamera
                makeDefault={fpvEnabled}
                fov={fpvEnabled ? 90 : 55}
                position={[0, headSize / 2, legDepth / 2 + 0.05]}
                rotation={[fpvDownwardLookAngle, Math.PI, 0]}
              />
              <mesh
                position={[0, headSize / 2, 0]}
                renderOrder={1}
                material={boxMaterials}
              >
                <boxGeometry args={[headSize, headSize, legDepth]} />
              </mesh>
            </group>

            {/* Left Arm */}
            <group
              ref={leftShoulderRef}
              position={[-(torsoWidth / 2 + gap), torsoLength - 0.1, 0]}
            >
              <mesh
                position={[0, -(armLength / 2), 0]}
                renderOrder={1}
                material={boxMaterials}
              >
                <boxGeometry args={[armWidth, armLength, legDepth]} />
              </mesh>
            </group>

            {/* Right Arm */}
            <group
              ref={rightShoulderRef}
              position={[torsoWidth / 2 + gap, torsoLength - 0.1, 0]}
            >
              <mesh
                position={[0, -(armLength / 2), 0]}
                renderOrder={1}
                material={boxMaterials}
              >
                <boxGeometry args={[armWidth, armLength, legDepth]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

export default Athlete;
