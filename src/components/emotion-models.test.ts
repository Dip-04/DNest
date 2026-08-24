import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EMOTION_ANIMATION_NAMES } from "@/lib/emotion-avatar";

async function readGlb(name: "boy" | "girl") {
  const binary = await readFile(path.join(process.cwd(), "public", "models", `${name}.glb`));
  expect(binary.toString("utf8", 0, 4)).toBe("glTF");
  expect(binary.readUInt32LE(4)).toBe(2);
  const jsonLength = binary.readUInt32LE(12);
  const json = JSON.parse(binary.toString("utf8", 20, 20 + jsonLength).trim());
  return { binary, json };
}

describe("supplied couple avatars", () => {
  it("keeps Character_2 as the rigged male avatar", async () => {
    const { binary, json } = await readGlb("boy");
    const joints = json.skins.flatMap((value: { joints: number[] }) => value.joints);
    const names = joints.map((index: number) => json.nodes[index]?.name);

    expect(binary.byteLength).toBeLessThan(1.1 * 1024 * 1024);
    expect(new Set(joints).size).toBe(70);
    expect(names).toEqual(expect.arrayContaining(["Root", "upper_arm.L", "hand.L", "thigh.R"]));
  });

  it("keeps the supplied female avatar with its face controls", async () => {
    const { binary, json } = await readGlb("girl");
    const joints = json.skins.flatMap((value: { joints: number[] }) => value.joints);
    const names = joints.map((index: number) => json.nodes[index]?.name);
    const face = json.meshes.find((value: { name?: string }) => value.name === "Mesh_face");

    expect(binary.byteLength).toBeLessThan(5.2 * 1024 * 1024);
    expect(new Set(joints).size).toBe(61);
    expect(names).toEqual(expect.arrayContaining(["J_Hip", "J_Head", "J_L_Hand", "J_R_Thigh"]));
    expect(face.extras.targetNames).toEqual(expect.arrayContaining(["eyelids_01", "mouth_01"]));
  });

  it("defines a distinct runtime clip for every Virtual Feeling", () => {
    expect(EMOTION_ANIMATION_NAMES).toEqual([
      "idle", "hug", "kiss", "cuddle", "love", "happy", "miss_you",
      "flying_kiss", "need_you", "celebrate", "hold_hands", "comfort",
    ]);
  });
});
