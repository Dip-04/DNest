import {
  Cloud,
  CloudRain,
  Heart,
  Leaf,
  MoonStar,
  Sparkles,
  SunMedium,
  Sunrise,
} from "lucide-react";
import { setMood } from "@/features/shared/actions";

const moods = [
  ["Loved", Heart],
  ["Happy", SunMedium],
  ["Calm", Leaf],
  ["Excited", Sparkles],
  ["Missing You", Sunrise],
  ["Tired", MoonStar],
  ["Stressed", CloudRain],
  ["Low", Cloud],
] as const;

export function MoodPicker({
  nestId,
  timezone,
  current,
}: {
  nestId: string;
  timezone: string;
  current?: string;
}) {
  return (
    <form action={setMood}>
      <input type="hidden" name="nest_id" value={nestId} />
      <input type="hidden" name="timezone" value={timezone} />
      <div className="mood-grid" role="group" aria-label="Choose today’s mood">
        {moods.map(([mood, Icon]) => (
          <button
            className={`mood-button ${current === mood ? "is-selected" : ""}`}
            type="submit"
            name="mood"
            value={mood}
            aria-label={mood}
            aria-pressed={current === mood}
            key={mood}
          >
            <Icon className="size-4" />
            <span>{mood}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
