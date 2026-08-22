import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export function AuthCard({
  title,
  subtitle,
  action,
  submitLabel,
  fields,
  hiddenFields,
  footer,
  message,
}: {
  title: string;
  subtitle: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  fields: {
    name: string;
    label: string;
    type: string;
    autoComplete: string;
    placeholder?: string;
  }[];
  hiddenFields?: Record<string, string>;
  footer?: React.ReactNode;
  message?: string;
}) {
  return (
    <main className="auth-page relative grid min-h-screen place-items-center p-5">
      <ThemeToggle className="absolute right-5 top-5" />
      <section className="auth-shell surface grid w-full max-w-5xl overflow-hidden lg:grid-cols-[.92fr_1.08fr]">
        <div
          className="auth-art hidden min-h-[42rem] place-items-center lg:grid"
          aria-hidden
        >
          <div className="auth-nest">
            <span />
            <span />
            <span />
            <div className="auth-room">
              <i />
              <i />
            </div>
          </div>
          <div className="auth-polaroid auth-polaroid-one">
            <i />
          </div>
          <div className="auth-polaroid auth-polaroid-two">
            <i />
          </div>
        </div>
        <div className="p-7 sm:p-10 lg:p-14">
          <Link
            href="/"
            className="display mb-10 flex items-center gap-2 text-2xl font-bold"
          >
            <BrandMark className="size-10 text-[var(--rose-deep)]" />
            DNest
          </Link>
          <span className="eyebrow">Private by design</span>
          <h1 className="display mt-3 text-4xl">{title}</h1>
          <p className="muted mt-2 leading-6">{subtitle}</p>
          {message && (
            <p
              role="status"
              className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3 text-sm text-[var(--rose-deep)]"
            >
              {message}
            </p>
          )}
          <form action={action} className="mt-7 grid gap-4">
            {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
              <input type="hidden" name={name} value={value} key={name} />
            ))}
            {fields.map((field) => (
              <label className="label" key={field.name}>
                {field.label}
                <input
                  className="field"
                  required
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
            <button className="btn btn-primary mt-2" type="submit">
              {submitLabel}
            </button>
          </form>
          {footer && (
            <div className="muted mt-6 text-center text-sm">{footer}</div>
          )}
        </div>
      </section>
    </main>
  );
}
