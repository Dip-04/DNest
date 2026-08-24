import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_CLIPS = [
  "idle",
  "walk",
  "hug",
  "kiss",
  "forehead_kiss",
  "cuddle",
  "love",
  "happy",
  "miss_you",
  "flying_kiss",
  "need_you",
  "celebrate",
  "dance",
  "hold_hands",
  "comfort",
  "sleep_cuddle",
];

async function readGlb(name: "boy" | "girl") {
  const binary = await readFile(path.join(process.cwd(), "public", "models", `${name}.glb`));
  expect(binary.toString("utf8", 0, 4)).toBe("glTF");
  expect(binary.readUInt32LE(4)).toBe(2);
  const jsonLength = binary.readUInt32LE(12);
  const json = JSON.parse(binary.toString("utf8", 20, 20 + jsonLength).trim());
  return { binary, json };
}

describe("production couple avatars", () => {
  it.each(["boy", "girl"] as const)("validates %s.glb for the web animation pipeline", async (name) => {
    const { binary, json } = await readGlb(name);
    const clips = json.animations.map((clip: { name: string }) => clip.name);
    const nodeNames = new Set(json.nodes.map((node: { name?: string }) => node.name));
    const morphPrimitives = json.meshes.flatMap((mesh: { primitives: { targets?: unknown[] }[] }) => mesh.primitives)
      .filter((primitive: { targets?: unknown[] }) => primitive.targets?.length);

    expect(binary.byteLength).toBeLessThan(600 * 1024);
    expect(json.skins[0].joints.length).toBe(38);
    expect(morphPrimitives.length).toBeGreaterThanOrEqual(3);
    expect(clips).toEqual(expect.arrayContaining(REQUIRED_CLIPS));
    for (const bone of ["Hips", "Head", "Hand_L", "Hand_R", "Index1_L", "Index1_R"])
      expect(nodeNames.has(bone)).toBe(true);
  });
});
