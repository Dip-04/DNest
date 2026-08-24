import { mkdir, writeFile } from "node:fs/promises";
import {
  AnimationClip,
  Bone,
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NumberKeyframeTrack,
  Quaternion,
  QuaternionKeyframeTrack,
  Shape,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  TorusGeometry,
  VectorKeyframeTrack,
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`;
      this.onloadend?.({ target: this });
    });
  }
};

const outputDirectory = new URL("../public/models/", import.meta.url);
const skin = new MeshPhysicalMaterial({ color: "#efb99f", roughness: 0.52, clearcoat: 0.08 });
const eye = new MeshPhysicalMaterial({ color: "#3a211b", roughness: 0.2, clearcoat: 0.7 });
const white = new MeshStandardMaterial({ color: "#fffaf7", roughness: 0.42 });
const sole = new MeshStandardMaterial({ color: "#ded9db", roughness: 0.65 });
const mouth = new MeshStandardMaterial({ color: "#a74d63", roughness: 0.48, side: DoubleSide });

function material(color, roughness = 0.58, clearcoat = 0.04) {
  return new MeshPhysicalMaterial({ color, roughness, clearcoat });
}

function mesh(name, geometry, surface, position = [0, 0, 0], scale = [1, 1, 1]) {
  const value = new Mesh(geometry, surface);
  value.name = name;
  value.position.set(...position);
  value.scale.set(...scale);
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function bone(name, position, parent) {
  const value = new Bone();
  value.name = name;
  value.position.set(...position);
  parent.add(value);
  return value;
}

function heartGeometry() {
  const shape = new Shape();
  shape.moveTo(0, -0.08);
  shape.bezierCurveTo(-0.34, -0.28, -0.48, 0.2, -0.2, 0.28);
  shape.bezierCurveTo(-0.06, 0.34, 0, 0.22, 0, 0.16);
  shape.bezierCurveTo(0, 0.22, 0.06, 0.34, 0.2, 0.28);
  shape.bezierCurveTo(0.48, 0.2, 0.34, -0.28, 0, -0.08);
  return new ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.012, bevelSegments: 2 });
}

function addBlinkMorph(eyeMesh) {
  const positions = eyeMesh.geometry.attributes.position;
  const target = positions.clone();
  for (let index = 0; index < target.count; index += 1) {
    target.setY(index, target.getY(index) * 0.06);
  }
  eyeMesh.geometry.morphAttributes.position = [target];
  eyeMesh.morphTargetInfluences = [0];
  eyeMesh.morphTargetDictionary = { blink: 0 };
}

function addSmileMorph(mouthMesh) {
  const positions = mouthMesh.geometry.attributes.position;
  const target = positions.clone();
  for (let index = 0; index < target.count; index += 1) {
    const x = target.getX(index);
    target.setY(index, target.getY(index) - Math.abs(x) * 0.24);
  }
  mouthMesh.geometry.morphAttributes.position = [target];
  mouthMesh.morphTargetInfluences = [0];
  mouthMesh.morphTargetDictionary = { smile: 0 };
}

function addFingerBones(hand, side) {
  const fingers = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
  return fingers.flatMap((finger, index) => {
    const spread = (index - 2) * 0.035;
    const first = bone(`${finger}1_${side}`, [spread, -0.12, 0.015], hand);
    const second = bone(`${finger}2_${side}`, [0, -0.09, 0], first);
    return [first, second];
  });
}

function buildSkeleton() {
  const armature = new Bone();
  armature.name = "Armature";
  const hips = bone("Hips", [0, 1.62, 0], armature);
  const spine = bone("Spine", [0, 0.4, 0], hips);
  const chest = bone("Chest", [0, 0.44, 0], spine);
  const neck = bone("Neck", [0, 0.5, 0], chest);
  const head = bone("Head", [0, 0.31, 0], neck);
  const upperArmL = bone("UpperArm_L", [-0.5, 0.31, 0], chest);
  const lowerArmL = bone("LowerArm_L", [0, -0.61, 0], upperArmL);
  const handL = bone("Hand_L", [0, -0.5, 0], lowerArmL);
  const upperArmR = bone("UpperArm_R", [0.5, 0.31, 0], chest);
  const lowerArmR = bone("LowerArm_R", [0, -0.61, 0], upperArmR);
  const handR = bone("Hand_R", [0, -0.5, 0], lowerArmR);
  const upperLegL = bone("UpperLeg_L", [-0.24, -0.08, 0], hips);
  const lowerLegL = bone("LowerLeg_L", [0, -0.78, 0], upperLegL);
  const footL = bone("Foot_L", [0, -0.73, 0], lowerLegL);
  const upperLegR = bone("UpperLeg_R", [0.24, -0.08, 0], hips);
  const lowerLegR = bone("LowerLeg_R", [0, -0.78, 0], upperLegR);
  const footR = bone("Foot_R", [0, -0.73, 0], lowerLegR);
  const fingers = [...addFingerBones(handL, "L"), ...addFingerBones(handR, "R")];
  return {
    armature,
    bones: [armature, hips, spine, chest, neck, head, upperArmL, lowerArmL, handL, upperArmR, lowerArmR, handR, upperLegL, lowerLegL, footL, upperLegR, lowerLegR, footR, ...fingers],
    map: { hips, spine, chest, neck, head, upperArmL, lowerArmL, handL, upperArmR, lowerArmR, handR, upperLegL, lowerLegL, footL, upperLegR, lowerLegR, footR },
  };
}

function addFace(headBone, variant) {
  const headMesh = mesh("Face", new SphereGeometry(0.46, 32, 24), skin, [0, 0.08, 0], [0.92, 1.03, 0.9]);
  headBone.add(headMesh);
  for (const [name, x] of [["Eye_L", -0.17], ["Eye_R", 0.17]]) {
    const eyeMesh = mesh(name, new SphereGeometry(0.088, 20, 16), eye, [x, 0.12, 0.39], [1, 1.22, 0.42]);
    addBlinkMorph(eyeMesh);
    headBone.add(eyeMesh);
    const shine = mesh(`${name}_Shine`, new SphereGeometry(0.018, 10, 8), white, [x - 0.02, 0.16, 0.425]);
    headBone.add(shine);
  }
  const mouthMesh = mesh("Mouth", new TorusGeometry(0.09, 0.014, 8, 20, Math.PI), mouth, [0, -0.1, 0.425]);
  mouthMesh.rotation.z = Math.PI;
  addSmileMorph(mouthMesh);
  headBone.add(mouthMesh);
  const blushMaterial = new MeshStandardMaterial({ color: "#ef8498", transparent: true, opacity: 0.34, side: DoubleSide });
  headBone.add(mesh("Blush_L", new CircleGeometry(0.07, 18), blushMaterial, [-0.28, -0.015, 0.405], [1.25, 0.55, 1]));
  headBone.add(mesh("Blush_R", new CircleGeometry(0.07, 18), blushMaterial, [0.28, -0.015, 0.405], [1.25, 0.55, 1]));
  if (variant === "boy") addBoyHair(headBone);
  else addGirlHair(headBone);
}

function addBoyHair(headBone) {
  const hair = material("#25181d", 0.72);
  headBone.add(mesh("Hair_Cap", new SphereGeometry(0.47, 24, 18), hair, [0, 0.25, -0.03], [1.02, 0.72, 1.02]));
  const locks = [[-0.31, 0.31, 0.25, -0.3], [-0.14, 0.43, 0.29, -0.1], [0.06, 0.43, 0.3, 0.15], [0.25, 0.35, 0.25, 0.3], [0.38, 0.2, 0.16, 0.45], [-0.42, 0.18, 0.17, -0.5]];
  for (const [x, y, length, rotation] of locks) {
    const lock = mesh(`Hair_Lock_${x}`, new CapsuleGeometry(0.075, length, 5, 10), hair, [x, y, 0.25]);
    lock.rotation.z = rotation;
    headBone.add(lock);
  }
}

function addGirlHair(headBone) {
  const hair = material("#392027", 0.68);
  headBone.add(mesh("Hair_Cap", new SphereGeometry(0.49, 28, 20), hair, [0, 0.24, -0.04], [1.03, 0.76, 1.04]));
  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index += 1) {
      const lock = mesh(`Hair_Wave_${side}_${index}`, new CapsuleGeometry(0.085, 0.66 + index * 0.05, 6, 12), hair, [side * (0.38 + index * 0.045), -0.13 - index * 0.13, -0.04]);
      lock.rotation.z = side * (0.08 + index * 0.035);
      lock.rotation.x = index % 2 ? 0.16 : -0.1;
      headBone.add(lock);
    }
  }
  const accessory = material("#f19ab1", 0.38, 0.25);
  headBone.add(mesh("Hair_Accessory", heartGeometry(), accessory, [0.38, 0.26, 0.34], [0.35, 0.35, 0.35]));
}

function addRigidLimb(parent, name, length, radius, surface, lower = false) {
  const limb = mesh(name, new CapsuleGeometry(radius, length - radius * 2, 8, 14), surface, [0, -length / 2, 0]);
  if (lower) limb.scale.set(0.92, 1, 0.92);
  parent.add(limb);
}

function addOutfit(root, rig, variant) {
  const isBoy = variant === "boy";
  const cloth = material(isBoy ? "#191820" : "#e99ab3", isBoy ? 0.7 : 0.62, 0.02);
  const lower = material(isBoy ? "#24232b" : "#fff7f2", 0.66);
  const torsoGeometry = new CapsuleGeometry(isBoy ? 0.43 : 0.45, 0.75, 10, 20);
  torsoGeometry.translate(0, 2.2, 0);
  const count = torsoGeometry.attributes.position.count;
  torsoGeometry.setAttribute("skinIndex", new BufferAttribute(new Uint16Array(count * 4).fill(rig.bones.indexOf(rig.map.chest), 0, count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let index = 0; index < count; index += 1) weights[index * 4] = 1;
  torsoGeometry.setAttribute("skinWeight", new BufferAttribute(weights, 4));
  const torso = new SkinnedMesh(torsoGeometry, cloth);
  torso.name = isBoy ? "Hoodie_Body" : "Sweater_Body";
  root.add(torso);
  torso.bind(new Skeleton(rig.bones));

  addRigidLimb(rig.map.upperArmL, "Sleeve_Upper_L", 0.61, 0.16, cloth);
  addRigidLimb(rig.map.lowerArmL, "Sleeve_Lower_L", 0.5, 0.145, cloth, true);
  addRigidLimb(rig.map.upperArmR, "Sleeve_Upper_R", 0.61, 0.16, cloth);
  addRigidLimb(rig.map.lowerArmR, "Sleeve_Lower_R", 0.5, 0.145, cloth, true);
  rig.map.handL.add(mesh("Hand_L_Mesh", new SphereGeometry(0.13, 16, 12), skin, [0, -0.08, 0], [0.82, 1.2, 0.7]));
  rig.map.handR.add(mesh("Hand_R_Mesh", new SphereGeometry(0.13, 16, 12), skin, [0, -0.08, 0], [0.82, 1.2, 0.7]));

  if (isBoy) {
    rig.map.chest.add(mesh("Hood", new TorusGeometry(0.34, 0.11, 10, 24), cloth, [0, 0.22, -0.2], [1, 1.1, 0.7]));
    const heart = mesh("Hoodie_Heart", heartGeometry(), white, [0.24, 0.16, 0.39], [0.18, 0.18, 0.18]);
    rig.map.chest.add(heart);
  } else {
    rig.map.hips.add(mesh("Skirt", new CylinderGeometry(0.48, 0.58, 0.48, 24), lower, [0, -0.12, 0]));
  }

  addRigidLimb(rig.map.upperLegL, isBoy ? "Cargo_Upper_L" : "Thigh_L", 0.78, isBoy ? 0.21 : 0.17, isBoy ? lower : skin);
  addRigidLimb(rig.map.upperLegR, isBoy ? "Cargo_Upper_R" : "Thigh_R", 0.78, isBoy ? 0.21 : 0.17, isBoy ? lower : skin);
  addRigidLimb(rig.map.lowerLegL, isBoy ? "Cargo_Lower_L" : "Sock_L", 0.73, isBoy ? 0.19 : 0.145, isBoy ? lower : white, true);
  addRigidLimb(rig.map.lowerLegR, isBoy ? "Cargo_Lower_R" : "Sock_R", 0.73, isBoy ? 0.19 : 0.145, isBoy ? lower : white, true);
  for (const [side, foot] of [["L", rig.map.footL], ["R", rig.map.footR]]) {
    foot.add(mesh(`Sneaker_${side}`, new BoxGeometry(0.32, 0.2, 0.57), white, [0, -0.08, 0.16], [1, 1, 1]));
    foot.add(mesh(`Sole_${side}`, new BoxGeometry(0.34, 0.055, 0.59), sole, [0, -0.19, 0.17]));
  }
}

function quaternion(x = 0, y = 0, z = 0) {
  const value = new Quaternion().setFromEuler(new Euler(x, y, z));
  return [value.x, value.y, value.z, value.w];
}

function poseTrack(name, times, rotations) {
  return new QuaternionKeyframeTrack(`${name}.quaternion`, times, rotations.flatMap((rotation) => quaternion(...rotation)));
}

const poses = {
  walk: { arms: [-0.12, 0, 0.2], head: [0, 0, 0], chest: [0, 0, 0] },
  hug: { arms: [-1.18, 0, 0.34], head: [0.04, 0, 0.08], chest: [0.05, 0, 0] },
  kiss: { arms: [-0.72, 0, 0.18], head: [0.08, 0.08, 0.16], chest: [0.08, 0, 0] },
  forehead_kiss: { arms: [-0.88, 0, 0.25], head: [0.18, 0.04, 0.1], chest: [0.09, 0, 0] },
  cuddle: { arms: [-1.05, 0, 0.28], head: [0.06, 0, 0.14], chest: [0.08, 0, 0.06] },
  love: { arms: [-0.92, 0, 0.62], head: [-0.04, 0, 0], chest: [0, 0, 0] },
  happy: { arms: [-1.55, 0, 0.22], head: [-0.08, 0, 0], chest: [0, 0, 0] },
  miss_you: { arms: [-0.3, 0, 0.12], head: [0.24, 0, 0], chest: [0.16, 0, 0] },
  flying_kiss: { arms: [-1.22, 0, 0.48], head: [-0.02, 0.06, 0], chest: [0, 0, 0] },
  need_you: { arms: [-0.62, 0, 0.92], head: [0.14, 0, 0], chest: [0.1, 0, 0] },
  celebrate: { arms: [-2.35, 0, 0.38], head: [-0.12, 0, 0], chest: [0, 0, 0] },
  dance: { arms: [-1.75, 0, 0.55], head: [-0.08, 0, 0.08], chest: [0, 0, 0.12] },
  hold_hands: { arms: [-0.78, 0, 0.64], head: [-0.03, 0, 0.05], chest: [0, 0, 0] },
  comfort: { arms: [-1.08, 0, 0.32], head: [0.08, 0, 0.12], chest: [0.08, 0, 0] },
  sleep_cuddle: { arms: [-0.94, 0, 0.3], head: [0.22, 0, 0.18], chest: [0.12, 0, 0.08] },
};

function makeClips(variant) {
  const times = [0, 0.55, 1.7, 2.7, 3.5];
  const clips = [];
  const blink = [0, 0, 1, 0, 0, 0, 1, 0];
  const blinkTimes = [0, 1.2, 1.28, 1.36, 2.7, 3.25, 3.33, 3.42];
  const idleTracks = [
    poseTrack("Chest", [0, 1.5, 3], [[0, 0, -0.018], [0.025, 0, 0.018], [0, 0, -0.018]]),
    poseTrack("Head", [0, 1.5, 3], [[0, 0, 0.025], [0, 0, -0.025], [0, 0, 0.025]]),
    new NumberKeyframeTrack("Eye_L.morphTargetInfluences[blink]", blinkTimes, blink),
    new NumberKeyframeTrack("Eye_R.morphTargetInfluences[blink]", blinkTimes, blink),
  ];
  clips.push(new AnimationClip("idle", 3.42, idleTracks));
  for (const [name, pose] of Object.entries(poses)) {
    const side = variant === "boy" ? 1 : -1;
    const left = [pose.arms[0], pose.arms[1], pose.arms[2] * side];
    const right = [pose.arms[0], pose.arms[1], -pose.arms[2] * side];
    if (name === "flying_kiss") {
      if (variant === "boy") right[2] = -1.25;
      else left[2] = 1.25;
    }
    if (name === "hold_hands") {
      if (variant === "boy") left[2] = 1.05;
      else right[2] = -1.05;
    }
    const tracks = [
      poseTrack("UpperArm_L", times, [[0, 0, 0.08], left, left, left, [0, 0, 0.08]]),
      poseTrack("UpperArm_R", times, [[0, 0, -0.08], right, right, right, [0, 0, -0.08]]),
      poseTrack("LowerArm_L", times, [[0, 0, 0], [-0.35, 0, 0], [-0.62, 0, 0], [-0.45, 0, 0], [0, 0, 0]]),
      poseTrack("LowerArm_R", times, [[0, 0, 0], [-0.35, 0, 0], [-0.62, 0, 0], [-0.45, 0, 0], [0, 0, 0]]),
      poseTrack("Head", times, [[0, 0, 0], pose.head, pose.head, pose.head, [0, 0, 0]]),
      poseTrack("Chest", times, [[0, 0, 0], pose.chest, pose.chest, pose.chest, [0, 0, 0]]),
      new NumberKeyframeTrack("Mouth.morphTargetInfluences[smile]", times, [0, 0.35, ["happy", "celebrate", "love"].includes(name) ? 1 : 0.55, 0.45, 0]),
      new NumberKeyframeTrack("Eye_L.morphTargetInfluences[blink]", blinkTimes, blink),
      new NumberKeyframeTrack("Eye_R.morphTargetInfluences[blink]", blinkTimes, blink),
    ];
    if (["happy", "celebrate", "dance", "walk"].includes(name)) {
      tracks.push(new VectorKeyframeTrack("Hips.position", times, [0,1.62,0, 0,1.72,0, 0,1.92,0, 0,1.7,0, 0,1.62,0]));
      tracks.push(poseTrack("UpperLeg_L", times, [[0,0,0],[-0.2,0,0],[0.25,0,0],[-0.15,0,0],[0,0,0]]));
      tracks.push(poseTrack("UpperLeg_R", times, [[0,0,0],[0.2,0,0],[-0.25,0,0],[0.15,0,0],[0,0,0]]));
    }
    clips.push(new AnimationClip(name, 3.5, tracks));
  }
  return clips;
}

function createAvatar(variant) {
  const root = new Group();
  root.name = variant === "boy" ? "BoyAvatar" : "GirlAvatar";
  root.userData = {
    asset: `${variant}.glb`,
    authoring: "DNest procedural character pipeline",
    units: "meters",
    forward: "+Z",
    rig: "DNestCoupleRig_v1",
  };
  const rig = buildSkeleton();
  root.add(rig.armature);
  addFace(rig.map.head, variant);
  addOutfit(root, rig, variant);
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (object.isSkinnedMesh) object.skeleton.calculateInverses();
  });
  return { root, clips: makeClips(variant) };
}

async function exportAvatar(variant) {
  const { root, clips } = createAvatar(variant);
  const exporter = new GLTFExporter();
  const output = await exporter.parseAsync(root, {
    binary: true,
    animations: clips,
    onlyVisible: false,
    trs: true,
  });
  await writeFile(new URL(`${variant}.glb`, outputDirectory), Buffer.from(output));
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([exportAvatar("boy"), exportAvatar("girl")]);
