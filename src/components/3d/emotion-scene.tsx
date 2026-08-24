"use client";

import { ContactShadows, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, type Group } from "three";
import type { VirtualEmotionType } from "@/types/database";

export function EmotionScene({
  emotion,
  replayKey,
  leftColor,
  rightColor,
}: {
  emotion: VirtualEmotionType;
  replayKey: number;
  leftColor: string;
  rightColor: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.5, 6.2], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#fff3f6", "#342633", 1.35]} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff3e8" />
      <pointLight position={[-3, 2, 2]} intensity={16} distance={8} color="#f3a2b6" />
      <pointLight position={[3, 1, 1]} intensity={12} distance={7} color="#a98ac1" />
      <Couple emotion={emotion} replayKey={replayKey} leftColor={leftColor} rightColor={rightColor} />
      <Sparkles count={emotion === "celebrate" ? 70 : 32} scale={[4.8, 3.2, 2]} size={3} speed={0.55} color={emotion === "celebrate" ? "#ffd37a" : "#f29aae"} />
      <ContactShadows position={[0, -1.52, 0]} opacity={0.35} scale={6} blur={2.6} far={4} />
    </Canvas>
  );
}

function Couple({ emotion, replayKey, leftColor, rightColor }: {
  emotion: VirtualEmotionType;
  replayKey: number;
  leftColor: string;
  rightColor: string;
}) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const started = useRef(0);
  useEffect(() => { started.current = 0; }, [replayKey, emotion]);

  useFrame((state, delta) => {
    if (!left.current || !right.current) return;
    started.current += delta;
    const t = started.current;
    const close = ["hug", "kiss", "cuddle", "comfort", "hold_hands"].includes(emotion);
    const distance = close ? (emotion === "kiss" ? 0.43 : 0.62) : 1.18;
    const bounce = emotion === "celebrate" || emotion === "happy"
      ? Math.abs(Math.sin(t * 4.2)) * 0.28
      : Math.sin(t * 1.8) * 0.025;
    left.current.position.x = MathUtils.damp(left.current.position.x, -distance, 4.5, delta);
    right.current.position.x = MathUtils.damp(right.current.position.x, distance, 4.5, delta);
    left.current.position.y = MathUtils.damp(left.current.position.y, bounce, 6, delta);
    right.current.position.y = MathUtils.damp(right.current.position.y, bounce + (emotion === "celebrate" ? Math.sin(t * 4.2 + Math.PI) * 0.08 : 0), 6, delta);
    const lean = close ? (emotion === "kiss" ? 0.19 : 0.1) : 0;
    left.current.rotation.z = MathUtils.damp(left.current.rotation.z, -lean, 5, delta);
    right.current.rotation.z = MathUtils.damp(right.current.rotation.z, lean, 5, delta);
    left.current.rotation.y = MathUtils.damp(left.current.rotation.y, close ? -0.12 : 0, 4, delta);
    right.current.rotation.y = MathUtils.damp(right.current.rotation.y, close ? 0.12 : 0, 4, delta);
    if (emotion === "flying_kiss") left.current.rotation.z += Math.sin(t * 5) * 0.004;
    state.camera.lookAt(0, 0.15, 0);
  });

  return (
    <group position={[0, 0.1, 0]}>
      <group ref={left}><Avatar color={leftColor} hair="#49303c" side={-1} emotion={emotion} /></group>
      <group ref={right}><Avatar color={rightColor} hair="#27212d" side={1} emotion={emotion} /></group>
    </group>
  );
}

function Avatar({ color, hair, side, emotion }: {
  color: string;
  hair: string;
  side: -1 | 1;
  emotion: VirtualEmotionType;
}) {
  const arms = useRef<Group>(null);
  const head = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (arms.current) {
      const embracing = ["hug", "cuddle", "comfort"].includes(emotion);
      arms.current.rotation.x = MathUtils.lerp(arms.current.rotation.x, embracing ? -1.02 : emotion === "celebrate" ? -2.35 : -0.12, 0.08);
      arms.current.rotation.z = MathUtils.lerp(arms.current.rotation.z, embracing ? side * -0.42 : 0, 0.08);
    }
    if (head.current) {
      head.current.rotation.z = emotion === "kiss" ? side * -0.16 : Math.sin(t * 1.4 + side) * 0.025;
    }
  });
  const smile = ["happy", "love", "celebrate", "hug", "kiss", "flying_kiss"].includes(emotion);
  return (
    <group scale={0.92}>
      <mesh position={[0, -0.3, 0]} castShadow>
        <capsuleGeometry args={[0.48, 1.05, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.04} />
      </mesh>
      <group ref={arms} position={[0, 0.12, 0]}>
        <Limb x={-0.57} rotation={0.16} color="#e9b59e" />
        <Limb x={0.57} rotation={-0.16} color="#e9b59e" />
      </group>
      <group ref={head} position={[0, 0.96, 0]}>
        <mesh castShadow><sphereGeometry args={[0.59, 32, 24]} /><meshStandardMaterial color="#efbea7" roughness={0.48} /></mesh>
        <mesh position={[0, 0.28, -0.02]} scale={[1.03, 0.7, 1]}><sphereGeometry args={[0.58, 24, 18]} /><meshStandardMaterial color={hair} roughness={0.7} /></mesh>
        <mesh position={[-0.2, 0.08, 0.53]}><sphereGeometry args={[0.045, 16, 12]} /><meshStandardMaterial color="#33242b" /></mesh>
        <mesh position={[0.2, 0.08, 0.53]}><sphereGeometry args={[0.045, 16, 12]} /><meshStandardMaterial color="#33242b" /></mesh>
        <mesh position={[0, -0.15, 0.55]} rotation={[0, 0, smile ? 0 : Math.PI]} scale={[1, smile ? 1 : 0.7, 1]}>
          <torusGeometry args={[0.12, 0.018, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#a74f62" />
        </mesh>
        <mesh position={[-0.3, -0.07, 0.49]}><circleGeometry args={[0.07, 18]} /><meshBasicMaterial color="#efa0aa" transparent opacity={0.42} /></mesh>
        <mesh position={[0.3, -0.07, 0.49]}><circleGeometry args={[0.07, 18]} /><meshBasicMaterial color="#efa0aa" transparent opacity={0.42} /></mesh>
      </group>
      <mesh position={[-0.22, -1.25, 0]}><capsuleGeometry args={[0.14, 0.55, 6, 12]} /><meshStandardMaterial color="#5a485a" /></mesh>
      <mesh position={[0.22, -1.25, 0]}><capsuleGeometry args={[0.14, 0.55, 6, 12]} /><meshStandardMaterial color="#5a485a" /></mesh>
    </group>
  );
}

function Limb({ x, rotation, color }: { x: number; rotation: number; color: string }) {
  return <mesh position={[x, -0.2, 0]} rotation={[0, 0, rotation]} castShadow><capsuleGeometry args={[0.12, 0.76, 6, 12]} /><meshStandardMaterial color={color} roughness={0.55} /></mesh>;
}
