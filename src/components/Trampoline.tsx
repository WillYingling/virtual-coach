import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Trampoline({
  athleteRef,
}: {
  athleteRef: React.RefObject<THREE.Group | null>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  useFrame(() => {
    if (!meshRef.current || !athleteRef.current) return;

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position;

    // Store original positions on first frame
    if (!originalPositions.current) {
      originalPositions.current =
        positionAttribute.array.slice() as Float32Array;
    }

    const athletePos = athleteRef.current.position;

    // Deform each vertex based on distance from athlete
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = originalPositions.current[i * 3];
      const y = originalPositions.current[i * 3 + 1];
      const z = originalPositions.current[i * 3 + 2];

      // Since plane is rotated -90deg around X, local Y becomes world Z
      // In local space: x,y,z → In world space after rotation: x,z,-y
      const worldX = x;
      const worldZ = y;

      const dx = worldX - athletePos.x;
      const dz = worldZ - athletePos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Deform based on proximity (trampoline effect)
      const maxDeform = 0.5; // Maximum deformation depth (matches bottom of athlete)
      const radius = 3; // Radius of influence
      const totalLegLength = 1.06; // Distance from root to feet
      // const heightThreshold = totalLegLength + 0.5; // Deform when feet are within 0.5m above trampoline (unused)

      // Calculate feet position
      const feetHeight = athletePos.y - totalLegLength;

      if (distance < radius && feetHeight < 0.5) {
        // Deformation strength based on how close feet are to ground (0 = at ground, 0.5 = no deform)
        const heightFactor = Math.max(0, 1 - feetHeight / 0.5);
        const deformation = -maxDeform * (1 - distance / radius) * heightFactor;
        positionAttribute.setZ(i, z + deformation);
      } else {
        positionAttribute.setZ(i, z);
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals(); // For proper lighting
  });

  return (
    <>
      {/* Blue border outline around platform */}
      {/* Top border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -3.1]}>
        <planeGeometry args={[4.05, 0.5]} />
        <meshStandardMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>
      {/* Bottom border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 3.1]}>
        <planeGeometry args={[4.05, 0.5]} />
        <meshStandardMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>
      {/* Left border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.775, -0.01, 0]}>
        <planeGeometry args={[0.5, 5.2]} />
        <meshStandardMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>
      {/* Right border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.775, -0.01, 0]}>
        <planeGeometry args={[0.5, 5.2]} />
        <meshStandardMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.05, 5.2, 32, 32]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

export default Trampoline;
