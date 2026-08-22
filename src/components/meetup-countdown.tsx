"use client";
import { useEffect, useState } from "react";
import { countdown } from "@/lib/date";

export function MeetupCountdown({ target }: { target: string }) {
  const [value, setValue] = useState(() => countdown(target));
  useEffect(() => {
    const timer = setInterval(() => setValue(countdown(target)), 60_000);
    return () => clearInterval(timer);
  }, [target]);
  if (value.isPast)
    return <p className="display text-3xl">Today is the day ♥</p>;
  return (
    <div
      aria-label={`${value.days} days, ${value.hours} hours, ${value.minutes} minutes until meetup`}
      className="countdown-grid grid grid-cols-3 gap-2"
    >
      {[
        [value.days, "days"],
        [value.hours, "hours"],
        [value.minutes, "minutes"],
      ].map(([number, label]) => (
        <div className="countdown-unit" key={label}>
          <strong className="display block text-3xl">{number}</strong>
          <span className="text-xs opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
}
