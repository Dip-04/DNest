"use client";

import { ContactShadows, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  AnimationClip,
  Bone,
  Euler,
  KeyframeTrack,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  NumberKeyframeTrack,
  Object3D,
  Quaternion,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
  type AnimationAction,
  type Group,
  type Mesh,
} from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { EMOTION_ANIMATION_NAMES, type EmotionAvatarKind } from "@/lib/emotion-avatar";
import type { VirtualEmotionType } from "@/types/database";

type AvatarSide = "left" | "right";

export function EmotionScene({
  emotion,
  replayKey,
  leftAvatar,
  rightAvatar,
  senderSide,
}: {
  emotion: VirtualEmotionType;
  replayKey: number;
  leftAvatar: EmotionAvatarKind;
  rightAvatar: EmotionAvatarKind;
  senderSide: AvatarSide;
}) {
  return (
    <Canvas
      dpr={[1, 1.4]}
      camera={{ position: [0, 1.28, 6.3], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#fff4f7", "#30232f", 1.45]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff1e9" castShadow />
      <pointLight position={[-3, 2, 2]} intensity={14} distance={8} color="#f3a2b6" />
      <pointLight position={[3, 1, 1]} intensity={11} distance={7} color="#a98ac1" />
      <Suspense fallback={null}>
        <Couple emotion={emotion} replayKey={replayKey} leftAvatar={leftAvatar} rightAvatar={rightAvatar} senderSide={senderSide} />
      </Suspense>
      <Sparkles
        count={emotion === "celebrate" ? 76 : emotion === "love" ? 46 : 24}
        scale={[4.8, 3.2, 2]}
        size={emotion === "celebrate" ? 3.5 : 2.6}
        speed={emotion === "celebrate" ? 0.9 : 0.45}
        color={emotion === "celebrate" ? "#ffd37a" : "#f29aae"}
      />
      <ContactShadows position={[0, -1.46, 0]} opacity={0.36} scale={6} blur={2.6} far={4} />
    </Canvas>
  );
}

function Couple({ emotion, replayKey, leftAvatar, rightAvatar, senderSide }: {
  emotion: VirtualEmotionType;
  replayKey: number;
  leftAvatar: EmotionAvatarKind;
  rightAvatar: EmotionAvatarKind;
  senderSide: AvatarSide;
}) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const started = useRef(0);

  useEffect(() => { started.current = 0; }, [emotion, replayKey]);
  useFrame((state, delta) => {
    if (!left.current || !right.current) return;
    started.current += delta;
    const distance = interactionDistance(emotion, started.current);
    const facing = interactionFacing(emotion);
    const sway = emotion === "celebrate" ? Math.sin(started.current * 5) * 0.05 : 0;
    left.current.position.x = MathUtils.damp(left.current.position.x, -distance, 4.8, delta);
    right.current.position.x = MathUtils.damp(right.current.position.x, distance, 4.8, delta);
    left.current.rotation.y = MathUtils.damp(left.current.rotation.y, facing, 5, delta);
    right.current.rotation.y = MathUtils.damp(right.current.rotation.y, -facing, 5, delta);
    left.current.rotation.z = MathUtils.damp(left.current.rotation.z, sway, 6, delta);
    right.current.rotation.z = MathUtils.damp(right.current.rotation.z, -sway, 6, delta);
    state.camera.lookAt(0, 0.02, 0);
  });

  return <group position={[0, -1.45, 0]} scale={1.25}>
    <group ref={left} position={[-1, 0, 0]}>
      <RiggedAvatar kind={leftAvatar} side="left" isSender={senderSide === "left"} emotion={emotion} replayKey={replayKey} />
    </group>
    <group ref={right} position={[1, 0, 0]}>
      <RiggedAvatar kind={rightAvatar} side="right" isSender={senderSide === "right"} emotion={emotion} replayKey={replayKey} />
    </group>
    {emotion === "flying_kiss" && <TravelingHeart replayKey={replayKey} senderSide={senderSide} />}
  </group>;
}

function RiggedAvatar({ kind, side, isSender, emotion, replayKey }: {
  kind: EmotionAvatarKind;
  side: AvatarSide;
  isSender: boolean;
  emotion: VirtualEmotionType;
  replayKey: number;
}) {
  const root = useRef<Group>(null);
  const url = kind === "male" ? "/models/boy.glb" : "/models/girl.glb";
  const source = useGLTF(url).scene;
  const model = useMemo(() => {
    const cloned = cloneSkeleton(source) as Group;
    cloned.traverse((object) => {
      const renderable = object as Mesh;
      if (!renderable.isMesh) return;
      renderable.castShadow = true;
      renderable.receiveShadow = true;
      renderable.frustumCulled = true;
    });
    return cloned;
  }, [source]);
  const clips = useMemo(() => createEmotionClips(model, kind, side, isSender), [isSender, kind, model, side]);
  const { actions, mixer } = useAnimations(clips, root);

  useEffect(() => {
    const idle = actions.idle;
    const interaction = actions[emotion];
    if (!interaction) return;
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    interaction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    interaction.setLoop(LoopOnce, 1).clampWhenFinished = true;
    interaction.fadeIn(0.28).play();
    const finish = ({ action }: { action: AnimationAction }) => {
      if (action !== interaction || !idle) return;
      interaction.fadeOut(0.32);
      idle.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.38).play();
    };
    mixer.addEventListener("finished", finish);
    return () => {
      mixer.removeEventListener("finished", finish);
      interaction.fadeOut(0.18);
    };
  }, [actions, emotion, mixer, replayKey]);

  const scale = kind === "male" ? 0.95 : 1.1;
  return <group ref={root} scale={scale}><primitive object={model} dispose={null} /></group>;
}

type Rig = {
  hips?: Bone;
  chest?: Bone;
  head?: Bone;
  upperArmL?: Bone;
  upperArmR?: Bone;
  lowerArmL?: Bone;
  lowerArmR?: Bone;
  upperLegL?: Bone;
  upperLegR?: Bone;
};

type Pose = {
  upperArmL: [number, number, number];
  upperArmR: [number, number, number];
  lowerArmL?: [number, number, number];
  lowerArmR?: [number, number, number];
  head?: [number, number, number];
  chest?: [number, number, number];
};

const IDLE_POSE: Pose = {
  upperArmL: [0, 0, 1.14],
  upperArmR: [0, 0, -1.14],
  lowerArmL: [0, 0, 0],
  lowerArmR: [0, 0, 0],
};

function createEmotionClips(root: Object3D, kind: EmotionAvatarKind, side: AvatarSide, isSender: boolean) {
  const rig = resolveRig(root, kind);
  const clips = [createIdleClip(rig, root)];
  const emotions = EMOTION_ANIMATION_NAMES.filter((name): name is VirtualEmotionType => name !== "idle");
  for (const emotion of emotions)
    clips.push(createInteractionClip(emotion, rig, root, poseFor(emotion, side, isSender)));
  return clips;
}

function resolveRig(root: Object3D, kind: EmotionAvatarKind): Rig {
  const aliases = kind === "male" ? {
    hips: ["root"], chest: ["spine004", "spine4"], head: ["spine006", "spine6"],
    upperArmL: ["upperarml"], upperArmR: ["upperarmr"], lowerArmL: ["forearml"], lowerArmR: ["forearmr"],
    upperLegL: ["thighl"], upperLegR: ["thighr"],
  } : {
    hips: ["jhip"], chest: ["jspine3"], head: ["jhead"],
    upperArmL: ["jlupperarm"], upperArmR: ["jrupperarm"], lowerArmL: ["jlforearm"], lowerArmR: ["jrforearm"],
    upperLegL: ["jlthigh"], upperLegR: ["jrthigh"],
  };
  const bones: Bone[] = [];
  root.traverse((object) => { if ((object as Bone).isBone) bones.push(object as Bone); });
  return Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, bones.find((bone) => names.includes(normalizeName(bone.name)))]));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function poseFor(emotion: VirtualEmotionType, side: AvatarSide, isSender: boolean): Pose {
  const inward = side === "left" ? 1 : -1;
  if (emotion === "hug") return embracePose(0.48);
  if (emotion === "kiss") return { ...embracePose(0.82), head: [0.08, inward * 0.08, inward * 0.12], chest: [0.06, 0, 0] };
  if (emotion === "cuddle") return { ...embracePose(0.58), head: [0.1, 0, inward * 0.16], chest: [0.08, 0, inward * 0.05] };
  if (emotion === "love") return { ...embracePose(0.34), lowerArmL: [-1.02, 0, 0], lowerArmR: [-1.02, 0, 0], head: [-0.05, 0, 0] };
  if (emotion === "happy") return { upperArmL: [-0.7, 0, 0.2], upperArmR: [-0.7, 0, -0.2], lowerArmL: [-0.9, 0, 0], lowerArmR: [-0.9, 0, 0], head: [-0.08, 0, 0] };
  if (emotion === "miss_you") return isSender
    ? { ...IDLE_POSE, head: [0.22, 0, 0], chest: [0.14, 0, 0] }
    : { ...embracePose(0.45), head: [0.06, 0, inward * 0.1] };
  if (emotion === "flying_kiss") {
    if (!isSender) return { ...IDLE_POSE, head: [-0.04, 0, inward * 0.06] };
    return side === "left"
      ? { ...IDLE_POSE, upperArmR: [-1.28, 0, -0.32], lowerArmR: [-1.18, 0, 0], head: [-0.04, inward * 0.05, 0] }
      : { ...IDLE_POSE, upperArmL: [-1.28, 0, 0.32], lowerArmL: [-1.18, 0, 0], head: [-0.04, inward * 0.05, 0] };
  }
  if (emotion === "need_you") return isSender
    ? { upperArmL: [-0.5, 0, 0.42], upperArmR: [-0.5, 0, -0.42], lowerArmL: [-0.2, 0, 0], lowerArmR: [-0.2, 0, 0], head: [0.14, 0, 0] }
    : embracePose(0.48);
  if (emotion === "celebrate") return { upperArmL: [-1.85, 0, 0.22], upperArmR: [-1.85, 0, -0.22], lowerArmL: [-0.35, 0, 0], lowerArmR: [-0.35, 0, 0], head: [-0.12, 0, 0] };
  if (emotion === "hold_hands") return side === "left"
    ? { ...IDLE_POSE, upperArmR: [-0.72, 0, -0.54], lowerArmR: [-0.46, 0, 0], head: [-0.04, inward * 0.05, 0] }
    : { ...IDLE_POSE, upperArmL: [-0.72, 0, 0.54], lowerArmL: [-0.46, 0, 0], head: [-0.04, inward * 0.05, 0] };
  return isSender ? embracePose(0.46) : { ...embracePose(0.65), head: [0.15, 0, inward * 0.12], chest: [0.1, 0, 0] };
}

function embracePose(spread: number): Pose {
  return {
    upperArmL: [-1.02, 0, spread], upperArmR: [-1.02, 0, -spread],
    lowerArmL: [-0.62, 0, 0], lowerArmR: [-0.62, 0, 0],
  };
}

function createIdleClip(rig: Rig, root: Object3D) {
  const times = [0, 1.5, 3];
  const tracks = poseTracks(rig, times, [IDLE_POSE, { ...IDLE_POSE, head: [-0.025, 0, 0.025], chest: [0.025, 0, 0] }, IDLE_POSE]);
  tracks.push(...facialTracks(root, times, true));
  return new AnimationClip("idle", 3, tracks);
}

function createInteractionClip(emotion: VirtualEmotionType, rig: Rig, root: Object3D, target: Pose) {
  const times = [0, 0.55, 1.55, 2.65, 3.5];
  const tracks = poseTracks(rig, times, [IDLE_POSE, target, target, target, IDLE_POSE]);
  if (rig.hips && ["happy", "celebrate"].includes(emotion)) {
    const base = rig.hips.position;
    tracks.push(new VectorKeyframeTrack(`${rig.hips.uuid}.position`, times, [base.x,base.y,base.z, base.x,base.y+0.06,base.z, base.x,base.y+0.2,base.z, base.x,base.y+0.04,base.z, base.x,base.y,base.z]));
  }
  tracks.push(...facialTracks(root, times, false, ["happy", "love", "celebrate", "kiss"].includes(emotion)));
  return new AnimationClip(emotion, 3.5, tracks);
}

function poseTracks(rig: Rig, times: number[], poses: Pose[]): KeyframeTrack[] {
  const tracks: KeyframeTrack[] = [];
  for (const key of ["upperArmL", "upperArmR", "lowerArmL", "lowerArmR", "head", "chest"] as const) {
    const bone = rig[key];
    if (!bone) continue;
    const deltas = poses.map((pose) => pose[key] ?? [0, 0, 0]);
    tracks.push(new QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, deltas.flatMap((delta) => rotated(bone.quaternion, delta))));
  }
  return tracks;
}

function rotated(base: Quaternion, delta: [number, number, number]) {
  const value = base.clone().multiply(new Quaternion().setFromEuler(new Euler(...delta)));
  return [value.x, value.y, value.z, value.w];
}

function facialTracks(root: Object3D, times: number[], idle: boolean, smiling = false) {
  const tracks: NumberKeyframeTrack[] = [];
  root.traverse((object) => {
    const face = object as Mesh & { morphTargetDictionary?: Record<string, number>; morphTargetInfluences?: number[] };
    if (!face.morphTargetDictionary || !face.morphTargetInfluences) return;
    for (const [name, index] of Object.entries(face.morphTargetDictionary)) {
      const normalized = normalizeName(name);
      if (normalized.includes("eyelid")) {
        const values = idle ? [0, 1, 0] : [0, 0.12, 0, 0.12, 0];
        tracks.push(new NumberKeyframeTrack(`${face.uuid}.morphTargetInfluences[${index}]`, times, values));
      }
      if (normalized.includes("mouth")) {
        const peak = smiling ? 0.72 : 0.28;
        tracks.push(new NumberKeyframeTrack(`${face.uuid}.morphTargetInfluences[${index}]`, times, idle ? [0, 0.12, 0] : [0, peak * 0.5, peak, peak * 0.6, 0]));
      }
    }
  });
  return tracks;
}

function TravelingHeart({ replayKey, senderSide }: { replayKey: number; senderSide: AvatarSide }) {
  const heart = useRef<Group>(null);
  const started = useRef(0);
  useEffect(() => { started.current = 0; }, [replayKey]);
  useFrame((_, delta) => {
    if (!heart.current) return;
    started.current += delta;
    const progress = MathUtils.clamp((started.current - 0.8) / 1.6, 0, 1);
    const direction = senderSide === "left" ? 1 : -1;
    heart.current.position.x = MathUtils.lerp(-0.62 * direction, 0.62 * direction, progress);
    heart.current.position.y = 1.55 + Math.sin(progress * Math.PI) * 0.35;
    heart.current.scale.setScalar(Math.sin(progress * Math.PI) * 0.72);
    heart.current.rotation.z += delta * 2.2;
  });
  return <group ref={heart}>
    <mesh position={[-0.07, 0, 0]}><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
    <mesh position={[0.07, 0, 0]}><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
    <mesh position={[0, -0.09, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.17, 0.17, 0.1]} /><meshStandardMaterial color="#ff6689" emissive="#b51e4d" emissiveIntensity={0.65} /></mesh>
  </group>;
}

function interactionDistance(emotion: VirtualEmotionType, time: number) {
  if ((emotion === "miss_you" || emotion === "need_you") && time < 0.9) return 1.2;
  if (emotion === "kiss") return 0.36;
  if (["hug", "cuddle", "comfort", "miss_you", "need_you"].includes(emotion)) return 0.43;
  if (emotion === "hold_hands") return 0.66;
  if (emotion === "love") return 0.75;
  return 0.92;
}

function interactionFacing(emotion: VirtualEmotionType) {
  if (emotion === "kiss") return 0.78;
  if (["hug", "cuddle", "comfort", "miss_you", "need_you"].includes(emotion)) return 0.58;
  if (["hold_hands", "love"].includes(emotion)) return 0.4;
  return 0.1;
}
