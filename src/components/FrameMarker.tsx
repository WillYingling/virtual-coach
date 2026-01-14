function FrameMarker({ position = [0, 0, 0], size = 1 }: { position?: [number, number, number], size?: number }) {
  return (
    <group position={position}>
      {/* X axis - Red */}
      <mesh position={[size / 2, 0, 0]}>
        <boxGeometry args={[size, 0.05, 0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {/* Y axis - Green */}
      <mesh position={[0, size / 2, 0]}>
        <boxGeometry args={[0.05, size, 0.05]} />
        <meshBasicMaterial color="green" />
      </mesh>
      {/* Z axis - Blue */}
      <mesh position={[0, 0, size / 2]}>
        <boxGeometry args={[0.05, 0.05, size]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>
  );
}

export default FrameMarker;
