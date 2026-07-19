import React from 'react';
import { GraduationCap, ScanLine, Sparkles, LineChart } from 'lucide-react';

const FEATURES = [
  { icon: ScanLine, title: 'Local OCR', desc: 'Reads handwritten scripts privately, on-device.' },
  { icon: Sparkles, title: 'RAG grading', desc: 'Scores against your syllabus with explanations.' },
  { icon: LineChart, title: 'Adaptive', desc: 'Learns from your corrections over time.' },
];

/** Split-screen auth shell: violet brand panel + form. Warm, restrained, no blue. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        {/* soft depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <GraduationCap size={22} />
          </span>
          <div>
            <p className="text-lg font-bold leading-none tracking-tight">PaperPilot</p>
            <p className="mt-1 text-xs text-primary-foreground/70">Autopilot for paper grading</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
            Grade subjective answers with clarity and consistency.
          </h2>
          <div className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/12">
                  <f.icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-sm text-primary-foreground/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} PaperPilot · AI-assisted evaluation
        </p>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm pp-animate-in">
          {/* mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">PaperPilot</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
