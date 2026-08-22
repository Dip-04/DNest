import Link from "next/link";
import { ArrowRight, BookHeart, CalendarHeart, Heart, LockKeyhole, MapPinned, Sparkles } from "lucide-react";

const features = [
  { icon: BookHeart, title: "Keep the story of us", text: "Save photos and the stories around them in a timeline that becomes more precious with time." },
  { icon: CalendarHeart, title: "Make distance feel smaller", text: "Count down to the next hello, plan the visit, and keep important days close." },
  { icon: Sparkles, title: "Small rituals, real connection", text: "A daily question, a thoughtful note, or one quiet tap that says you’re on my mind." },
];

export default function LandingPage() {
  return <main className="min-h-screen overflow-hidden">
    <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
      <Link href="/" className="display text-2xl font-bold"><Heart className="mr-2 inline size-5 fill-[var(--rose)] text-[var(--rose)]" />DNest</Link>
      <div className="flex gap-2"><Link className="btn btn-secondary" href="/sign-in">Sign in</Link><Link className="btn btn-primary hidden sm:inline-flex" href="/sign-up">Create your Nest</Link></div>
    </nav>
    <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <span className="eyebrow">A private world for two</span>
        <h1 className="display mt-5 max-w-3xl text-6xl leading-[.96] font-semibold sm:text-7xl">Our little place,<br/><em className="text-[var(--rose-deep)]">no matter the distance.</em></h1>
        <p className="muted mt-7 max-w-xl text-lg leading-8">DNest keeps your memories, plans, love notes, and small daily rituals together—far from the noise of a feed or chat thread.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link className="btn btn-primary" href="/sign-up">Start our Nest <ArrowRight className="size-4" /></Link><a className="btn btn-secondary" href="#inside">See inside</a></div>
        <p className="muted mt-5 flex items-center gap-2 text-sm"><LockKeyhole className="size-4" />Exactly two members. Private by design.</p>
      </div>
      <div className="relative mx-auto w-full max-w-lg" aria-label="DNest memory preview">
        <div className="surface card rotate-2 p-4"><div className="aspect-[4/3] rounded-[1.25rem] bg-[linear-gradient(145deg,#6f7889,#d5a795_55%,#f5d8b7)] p-6 text-white"><div className="flex h-full flex-col justify-between"><span className="chip w-fit !bg-white/20 !text-white">August 14 · Mumbai</span><div><p className="display text-4xl">The sunset we nearly missed</p><p className="mt-2 text-sm text-white/85">We stayed until the sky turned peach and forgot what time it was.</p></div></div></div></div>
        <div className="surface card absolute -bottom-12 -left-5 -rotate-3 sm:-left-12"><span className="text-2xl">✈️</span><p className="display mt-3 text-2xl">17 days</p><p className="muted text-sm">until you’re together</p></div>
      </div>
    </section>
    <section id="inside" className="mx-auto max-w-6xl px-5 py-28"><span className="eyebrow">Everything around talking</span><h2 className="display mt-3 max-w-2xl text-4xl sm:text-5xl">A home for what ordinary messaging leaves behind.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{features.map(({icon: Icon,title,text})=><article className="surface card" key={title}><Icon className="size-6 text-[var(--rose)]"/><h3 className="display mt-7 text-2xl">{title}</h3><p className="muted mt-3 leading-7">{text}</p></article>)}</div></section>
    <section className="mx-auto mb-20 max-w-6xl px-5"><div className="surface card grid gap-8 bg-[var(--surface)] p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-end"><div><MapPinned className="size-7 text-[var(--plum)]"/><h2 className="display mt-5 text-4xl">This place belongs only to you two.</h2><p className="muted mt-3 max-w-2xl">No followers, no searchable profiles, no public moments. Every shared thing stays inside your Nest.</p></div><Link className="btn btn-primary" href="/sign-up">Create your private space</Link></div></section>
  </main>;
}
