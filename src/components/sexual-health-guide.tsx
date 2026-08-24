import {
  BookOpenHeart,
  HeartHandshake,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const topics = [
  {
    icon: Sparkles,
    title: "Cycle, ovulation & fertility",
    summary: "Understand what the calendar colors mean.",
    body: "A cycle begins on the first day of menstrual bleeding. Ovulation is when an ovary releases an egg. Sperm can sometimes survive for up to five days, while an egg usually survives for about 24 hours—so pregnancy can be possible before ovulation as well as shortly after it.",
  },
  {
    icon: HeartHandshake,
    title: "Pregnancy possibility",
    summary: "High, Medium and Low are estimates—not certainties.",
    body: "High marks the predicted ovulation day and the two days before it. Medium marks the other estimated fertile-window days. Low means pregnancy is less likely, not impossible. Stress, illness, travel, postpartum changes and irregular cycles can shift ovulation.",
  },
  {
    icon: MessageCircleHeart,
    title: "Consent, comfort & communication",
    summary: "Both people’s boundaries and comfort matter every time.",
    body: "Consent should be freely given, specific, informed and reversible at any time. Check in, listen without pressure, and stop if either person is unsure or uncomfortable. Talk about pace, touch, protection, privacy and aftercare before intimacy—not only during it.",
  },
  {
    icon: ShieldCheck,
    title: "Safer sex & STI protection",
    summary: "Protection supports both partners’ health.",
    body: "Using a new condom or appropriate barrier correctly for each sex act reduces the risk of many sexually transmitted infections and pregnancy, but does not remove all risk. STI testing, honest conversations about results, and recommended vaccines are also part of shared care.",
  },
  {
    icon: BookOpenHeart,
    title: "Contraception & emergency options",
    summary: "Choose a method that fits health needs and future plans.",
    body: "Options include condoms, pills, injections, implants and intrauterine devices. Effectiveness, side effects and suitability differ. Emergency contraception may help after unprotected sex or method failure and works best when accessed promptly; a clinician or pharmacist can guide the right option.",
  },
  {
    icon: Stethoscope,
    title: "When to seek healthcare",
    summary: "Pain and concerning changes deserve attention.",
    body: "Seek medical advice for severe or persistent pelvic pain, very heavy bleeding, bleeding after sex, missed periods with pregnancy possibility, unusual discharge or sores, STI exposure, or any symptom that worries you. Urgent or severe symptoms need prompt local medical care.",
  },
];

export function SexualHealthGuide() {
  return (
    <section className="sexual-health-guide surface card mt-6">
      <div className="max-w-3xl">
        <span className="eyebrow">Learn & understand together</span>
        <h2 className="display mt-2 text-4xl">Sexual health, without shame or guesswork</h2>
        <p className="muted mt-2 text-sm leading-6">
          Clear basics for understanding bodies, pregnancy possibility, protection,
          consent and each other’s needs.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {topics.map(({ icon: Icon, title, summary, body }) => (
          <details className="sexual-health-topic" key={title}>
            <summary>
              <span className="sexual-health-icon"><Icon /></span>
              <span><strong>{title}</strong><small>{summary}</small></span>
            </summary>
            <p>{body}</p>
          </details>
        ))}
      </div>
      <p className="muted mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5">
        Educational information only. For personal contraception, pregnancy, pain
        or infection concerns, speak with a qualified healthcare professional. Read
        more from{" "}
        <a href="https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning" target="_blank" rel="noreferrer">ACOG</a>,{" "}
        <a href="https://www.cdc.gov/contraception/about/index.html" target="_blank" rel="noreferrer">CDC contraception guidance</a>, and{" "}
        <a href="https://www.who.int/news-room/fact-sheets/detail/comprehensive-sexuality-education" target="_blank" rel="noreferrer">WHO sexual-health education</a>.
      </p>
    </section>
  );
}
