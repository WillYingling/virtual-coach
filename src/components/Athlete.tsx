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

// Athlete body segment dimensions (in meters)
const BODY_DIMENSIONS = {
  legWidth: 0.15,
  legDepth: 0.2,
  legSegmentLength: 0.48,
  gap: 0.1,
  torsoWidth: 0.4,
  torsoLength: 0.58,
  headSize: 0.28,
  armLength: 0.48,
  armWidth: 0.12,
} as const;

// Realistic body segment mass percentages (normalized to sum to 1.0)
const SEGMENT_MASSES = {
  head: 0.086, // ~8% of body mass
  torso: 0.538, // ~50% of body mass
  thigh: 0.108, // ~10% per thigh
  shin: 0.048, // ~4.5% per shin
  arm: 0.032, // ~3% per arm
} as const;

interface AthleteProps {
  athletePosition?: AthletePosition;
  fpvEnabled?: boolean;
}

/**
 * Calculate the center of mass as a weighted average of all segment centers.
 * Weights are based on realistic body segment mass percentages.
 * This version uses the world positions of segments, accounting for joint rotations.
 */
function calculateCenterOfMass(
  leftThighRef: React.RefObject<THREE.Group | null>,
  rightThighRef: React.RefObject<THREE.Group | null>,
  leftShinRef: React.RefObject<THREE.Group | null>,
  rightShinRef: React.RefObject<THREE.Group | null>,
  leftShoulderRef: React.RefObject<THREE.Group | null>,
  rightShoulderRef: React.RefObject<THREE.Group | null>,
  twistGroupRef: React.RefObject<THREE.Group | null>,
): THREE.Vector3 | null {
  const { legSegmentLength, gap, torsoLength, headSize, armLength } =
    BODY_DIMENSIONS;

  if (!twistGroupRef.current) return null;

  const segments: Array<{ position: THREE.Vector3; mass: number }> = [];
  const tempVector = new THREE.Vector3();

  // Helper to get world position of a point within a group
  const getWorldPosition = (
    group: THREE.Group | null,
    localPos: THREE.Vector3,
  ) => {
    if (!group) return null;
    const worldPos = localPos.clone();
    group.localToWorld(worldPos);
    return worldPos;
  };

  // Left thigh center
  if (leftThighRef.current) {
    const pos = getWorldPosition(
      leftThighRef.current,
      new THREE.Vector3(0, -(legSegmentLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.thigh });
  }

  // Left shin center
  if (leftShinRef.current) {
    const pos = getWorldPosition(
      leftShinRef.current,
      new THREE.Vector3(0, -(legSegmentLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.shin });
  }

  // Right thigh center
  if (rightThighRef.current) {
    const pos = getWorldPosition(
      rightThighRef.current,
      new THREE.Vector3(0, -(legSegmentLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.thigh });
  }

  // Right shin center
  if (rightShinRef.current) {
    const pos = getWorldPosition(
      rightShinRef.current,
      new THREE.Vector3(0, -(legSegmentLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.shin });
  }

  // Torso center (no ref, it's in the twist group directly)
  twistGroupRef.current.localToWorld(
    tempVector.set(0, gap + torsoLength / 2, 0),
  );
  segments.push({ position: tempVector.clone(), mass: SEGMENT_MASSES.torso });

  // Head center
  twistGroupRef.current.localToWorld(
    tempVector.set(0, gap + torsoLength + gap + headSize / 2, 0),
  );
  segments.push({ position: tempVector.clone(), mass: SEGMENT_MASSES.head });

  // Left arm center
  if (leftShoulderRef.current) {
    const pos = getWorldPosition(
      leftShoulderRef.current,
      new THREE.Vector3(0, -(armLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.arm });
  }

  // Right arm center
  if (rightShoulderRef.current) {
    const pos = getWorldPosition(
      rightShoulderRef.current,
      new THREE.Vector3(0, -(armLength / 2), 0),
    );
    if (pos) segments.push({ position: pos, mass: SEGMENT_MASSES.arm });
  }

  // Calculate weighted average
  if (segments.length === 0) return null;

  const centerOfMass = new THREE.Vector3();
  let totalMass = 0;

  for (const segment of segments) {
    centerOfMass.addScaledVector(segment.position, segment.mass);
    totalMass += segment.mass;
  }

  centerOfMass.divideScalar(totalMass);

  // Convert back to twist group's local coordinates
  twistGroupRef.current.worldToLocal(centerOfMass);

  return centerOfMass;
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

  // Ref for center of mass marker
  const centerOfMassMarkerRef = useRef<THREE.Group>(null);

  // Ref for offset group that moves body so COM is at origin
  const comOffsetGroupRef = useRef<THREE.Group>(null);

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

      // Update center of mass marker position and offset the entire body
      const centerOfMass = calculateCenterOfMass(
        leftThighRef,
        rightThighRef,
        leftShinRef,
        rightShinRef,
        leftShoulderRef,
        rightShoulderRef,
        twistGroupRef,
      );

      if (centerOfMass) {
        // Update marker position
        if (centerOfMassMarkerRef.current) {
          centerOfMassMarkerRef.current.position.copy(centerOfMass);
        }

        // Offset the entire body so the center of mass is at the origin
        // This makes rotations pivot around the center of mass
        if (comOffsetGroupRef.current) {
          comOffsetGroupRef.current.position.set(
            -centerOfMass.x,
            -centerOfMass.y,
            -centerOfMass.z,
          );
        }
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

  // Destructure body dimensions for use in component
  const {
    legWidth,
    legDepth,
    legSegmentLength,
    gap,
    torsoWidth,
    torsoLength,
    headSize,
    armLength,
    armWidth,
  } = BODY_DIMENSIONS;

  return (
    <group {...props} ref={ref}>
      {/* Flip group - applies X rotation around world axis first */}
      <group ref={flipGroupRef}>
        {/* Twist group - applies Y rotation around body axis */}
        <group ref={twistGroupRef}>
          {/* Offset group - moves body so center of mass is at origin for rotation */}
          <group ref={comOffsetGroupRef}>
            {/* Center of mass marker at origin after offset */}
            <group ref={centerOfMassMarkerRef}>
              <FrameMarker position={[0, 0, 0]} size={0} />
            </group>

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
            {/* End of COM offset group */}
          </group>
        </group>
      </group>
    </group>
  );
});

export default Athlete;
