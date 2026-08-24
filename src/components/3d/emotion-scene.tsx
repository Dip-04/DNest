"use client";

import { ContactShadows, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { LoopOnce, LoopRepeat, MathUtils, type AnimationAction, type Group } from "three";
import type { VirtualEmotionType } from "@/types/database";

export function EmotionScene({
  emotion,
  replayKey,
}: {
  emotion: VirtualEmotionType;
  replayKey: number;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.45]}
      camera={{ position: [0, 1.35, 6.5], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#fff4f7", "#30232f", 1.45]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff1e9" castShadow />
      <pointLight position={[-3, 2, 2]} intensity={16} distance={8} color="#f3a2b6" />
      <pointLight position={[3, 1, 1]} intensity={12} distance={7} color="#a98ac1" />
      <Suspense fallback={null}>
        <Couple emotion={emotion} replayKey={replayKey} />
      </Suspense>
      <Sparkles
        count={emotion === "celebrate" ? 76 : emotion === "love" ? 46 : 24}
        scale={[4.8, 3.2, 2]}
        size={emotion === "celebrate" ? 3.5 : 2.6}
        speed={emotion === "celebrate" ? 0.9 : 0.45}
        color={emotion === "celebrate" ? "#ffd37a" : "#f29aae"}
      />
      <ContactShadows position={[0, -1.46, 0]} opacity={0.34} scale={6} blur={2.7} far={4} />
    </Canvas>
  );
}

function Couple({ emotion, replayKey }: { emotion: VirtualEmotionType; replayKey: number }) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const started = useRef(0);

  useEffect(() => {
    started.current = 0;
  }, [emotion, replayKey]);

  useFrame((state, delta) => {
    if (!left.current || !right.current) return;
    started.current += delta;
    const time = started.current;
    const distance = interactionDistance(emotion, time);
    const facing = interactionFacing(emotion);
    const sway = emotion === "celebrate" ? Math.sin(time * 5) * 0.06 : 0;
    left.current.position.x = MathUtils.damp(left.current.position.x, -distance, 4.8, delta);
    right.current.position.x = MathUtils.damp(right.current.position.x, distance, 4.8, delta);
    left.current.rotation.y = MathUtils.damp(left.current.rotation.y, facing, 5, delta);
    right.current.rotation.y = MathUtils.damp(right.current.rotation.y, -facing, 5, delta);
    left.current.rotation.z = MathUtils.damp(left.current.rotation.z, sway, 6, delta);
    right.current.rotation.z = MathUtils.damp(right.current.rotation.z, -sway, 6, delta);
    state.camera.lookAt(0, 0.05, 0);
  });

  return (
    <group position={[0, -1.45, 0]} scale={0.76}>
      <group ref={left} position={[-1.15, 0, 0]}>
        <RiggedAvatar url="/models/boy.glb" emotion={emotion} replayKey={replayKey} />
      </group>
      <group ref={right} position={[1.15, 0, 0]}>
        <RiggedAvatar url="/models/girl.glb" emotion={emotion} replayKey={replayKey} />
      </group>
      {emotion === "flying_kiss" && <TravelingHeart replayKey={replayKey} />}
    </group>
  );
}

function RiggedAvatar({ url, emotion, replayKey }: {
  url: "/models/boy.glb" | "/models/girl.glb";
  emotion: VirtualEmotionType;
  replayKey: number;
}) {
  const root = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, root);

  useEffect(() => {
    const idle = actions.idle;
    const interaction = actions[emotion];
    if (!interaction) return;
    Object.values(actions).forEach((action) => action?.fadeOut(0.22));
    interaction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    interaction.setLoop(LoopOnce, 1).clampWhenFinished = true;
    interaction.fadeIn(0.28).play();

    const finish = ({ action }: { action: AnimationAction }) => {
      if (action !== interaction || !idle) return;
      interaction.fadeOut(0.35);
      idle.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.4).play();
    };
    mixer.addEventListener("finished", finish);
    return () => {
      mixer.removeEventListener("finished", finish);
      interaction.fadeOut(0.2);
    };
  }, [actions, emotion, mixer, replayKey]);

  return <group ref={root}><primitive object={scene} dispose={null} /></group>;
}

function TravelingHeart({ replayKey }: { replayKey: number }) {
  const heart = useRef<Group>(null);
  const started = useRef(0);
  useEffect(() => { started.current = 0; }, [replayKey]);
  useFrame((_, delta) => {
    if (!heart.current) return;
    started.current += delta;
    const progress = MathUtils.clamp((started.current - 0.8) / 1.6, 0, 1);
    heart.current.position.x = MathUtils.lerp(-0.72, 0.72, progress);
    heart.current.position.y = 2.55 + Math.sin(progress * Math.PI) * 0.42;
    heart.current.scale.setScalar(Math.sin(progress * Math.PI) * 0.95);
    heart.current.rotation.z += delta * 2.2;
  });
  return <group ref={heart}>
    <mesh position={[-0.07, 0, 0]}><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
    <mesh position={[0.07, 0, 0]}><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
    <mesh position={[0, -0.09, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.17, 0.17, 0.1]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
  </group>;
}

function interactionDistance(emotion: VirtualEmotionType, time: number) {
  if ((emotion === "miss_you" || emotion === "need_you") && time < 0.9) return 1.42;
  if (emotion === "kiss") return 0.43;
  if (["hug", "cuddle", "comfort", "miss_you", "need_you"].includes(emotion)) return 0.54;
  if (emotion === "hold_hands") return 0.78;
  if (emotion === "love") return 0.88;
  return 1.14;
}

function interactionFacing(emotion: VirtualEmotionType) {
  if (emotion === "kiss") return 0.82;
  if (["hug", "cuddle", "comfort", "miss_you", "need_you"].includes(emotion)) return 0.64;
  if (["hold_hands", "love"].includes(emotion)) return 0.46;
  return 0.12;
}

useGLTF.preload("/models/boy.glb");
useGLTF.preload("/models/girl.glb");
