import { describe, expect, it } from "vitest";
import { emotionAvatarForGender } from "@/lib/emotion-avatar";

describe("emotion avatar selection", () => {
  it("supports female-female, male-male and mixed couples", () => {
    expect(emotionAvatarForGender("Woman", "male")).toBe("female");
    expect(emotionAvatarForGender("female", "male")).toBe("female");
    expect(emotionAvatarForGender("Man", "female")).toBe("male");
    expect(emotionAvatarForGender("male", "female")).toBe("male");
  });

  it("uses a stable fallback when a profile has no saved gender", () => {
    expect(emotionAvatarForGender(null, "male")).toBe("male");
    expect(emotionAvatarForGender("", "female")).toBe("female");
  });
});
