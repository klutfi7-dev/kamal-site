import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { type ScorecardResult, type Classification, type ReadinessFactorBreakdown } from "@/lib/scoring";
import { AlertCircle, AlertTriangle, Info, Printer, ArrowRight, CheckCircle2, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CLASSIFICATION_STYLES: Record<Classification, { badge: string; heading: string }> = {
  Pioneer: {
    badge: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    heading: "This is unclaimed territory.",
  },
  "Strong Contender": {
    badge: "bg-sky-500/15 text-sky-300 border border-sky-400/30",
    heading: "The window is open. It will not stay that way.",
  },
  "Contested Contender": {
    badge: "bg-white/10 text-white/70 border border-white/20",
    heading: "Entry is possible. Sharp execution is what separates companies that break through.",
  },
  Entrant: {
    badge: "bg-muted text-muted-foreground border border-border",
    heading: "This category is mature. The standard approach to market entry will not work here.",
  },
  "Not Assessed": {
    badge: "bg-muted text-muted-foreground border border-border",
    heading: "Classification incomplete.",
  },
};

const CTA_COPY: Record<Classification, { heading: string; body: string }> = {
  Pioneer: {
    heading: "You have a clear GCC opportunity.",
    body: "Use the report to guide your next steps and see where the strongest opening is.",
  },
  "Strong Contender": {
    heading: "You are well positioned to compete.",
    body: "Use the report to focus on the factors that will move you forward fastest.",
  },
  "Contested Contender": {
    heading: "You are in a competitive market.",
    body: "Use the report to identify where execution needs to be sharper.",
  },
  Entrant: {
    heading: "The market needs a different approach.",
    body: "Use the report to see which foundations need to be built first.",
  },
  "Not Assessed": {
    heading: "Your report is ready.",
    body: "Use the report to review the highest-priority gaps.",
  },
};

const URGENCY_FLAG_TEXT: Record<string, string> = {
  registration_ownership:
    "You indicated you don't yet know what product registration ownership means in GCC. In most GCC markets, only the registered holder of a product can legally sell it. Not understanding this before entering distributor negotiations is how companies accept unfavourable terms by default — terms that can take 12 to 24 months and legal action to reverse.",
  prior_distributor:
    "Your current distributor holds your product registration. This is an active commercial constraint. Switching distributors, renegotiating terms, or pursuing direct market access all require resolving the registration position first.",
};

const READINESS_LABEL_STYLES: Record<string, string> = {
  Strong: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25",
  Developing: "text-sky-300 bg-sky-500/10 border border-sky-500/25",
  "Early Stage": "text-amber-400 bg-amber-500/10 border border-amber-500/25",
  Foundational: "text-muted-foreground bg-muted border border-border",
};

function ReadinessGauge({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none" stroke="currentColor" strokeWidth="8"
          className="text-primary"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold font-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function SignalIndicator({ signal }: { signal: ReadinessFactorBreakdown["signal"] }) {
  if (signal === "positive")
    return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />;
  if (signal === "concern")
    return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />;
  return <MinusCircle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />;
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />;
  if (severity === "high") return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
  return <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />;
}

function severityClasses(severity: string) {
  if (severity === "critical") return "border-red-400/25 bg-red-500/8 text-foreground";
  if (severity === "high") return "border-amber-400/25 bg-amber-500/8 text-foreground";
  return "border-primary/25 bg-primary/8 text-foreground";
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [prospect, setProspect] = useState<{ name: string; email: string; company: string } | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("scorecard_result");
      if (saved) {
        setResult(JSON.parse(saved));
      } else {
        setLocation("/");
      }
      const savedProspect = sessionStorage.getItem("scorecard_prospect");
      if (savedProspect) setProspect(JSON.parse(savedProspect));
    } catch (_e) {
      setLocation("/");
    }
  }, [setLocation]);

  if (!result) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
  }

  const styles = CLASSIFICATION_STYLES[result.classification];
  const readinessStyle = READINESS_LABEL_STYLES[result.readinessLabel] ?? READINESS_LABEL_STYLES["Foundational"];

  const calendlyUrl = prospect
    ? `https://calendly.com/klutfi7/meeting-kamal-lutfi?name=${encodeURIComponent(prospect.name)}&email=${encodeURIComponent(prospect.email)}${prospect.company ? `&a1=${encodeURIComponent(prospect.company)}` : ""}`
    : "https://calendly.com/klutfi7/meeting-kamal-lutfi";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground font-sans print:bg-white print:text-black">
      <header className="w-full border-b border-primary/20 bg-[#f5f2ed] print:border-b-2 print:border-black print:bg-white">
        <div className="container max-w-4xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="KL MedTech" className="h-[58px] w-auto print:h-8" />
          <span className="text-xs font-semibold uppercase tracking-widest text-black/30 hidden sm:block">
            GCC Market Readiness Scorecard
          </span>
        </div>
      </header>

      <main className="flex-1 w-full container max-w-4xl mx-auto px-6 py-12 print:py-6 space-y-12">

        {/* ── Report title / personalization ── */}
        <div className="pb-6 border-b border-border print:border-black">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 print:text-black/50">
            GCC Market Readiness Report
          </p>
          {prospect?.company ? (
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight print:text-black">
              {prospect.company}
            </h1>
          ) : (
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight print:text-black">
              GCC Market Readiness Report
            </h1>
          )}
          {prospect?.name && (
            <p className="text-sm text-muted-foreground mt-2 print:text-black/60">
              Prepared for {prospect.name}
              {prospect.company ? `, ${prospect.company}` : ""}
            </p>
          )}
        </div>

        {/* ── Your Situation ── */}
        {result.situationSummary && (
          <motion.section
            className="print:break-inside-avoid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Your Situation</p>
            <p className="text-xl md:text-2xl font-serif italic text-foreground/90 leading-relaxed pl-5 border-l-2 border-primary/50">
              {result.situationSummary}
            </p>
          </motion.section>
        )}

        {/* ── Urgency flags ── */}
        {result.urgencyFlags.length > 0 && (
          <motion.section
            className="print:break-inside-avoid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-xl border border-red-400/40 bg-red-500/8 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm font-semibold uppercase tracking-widest text-red-400">Requires Immediate Attention</p>
              </div>
              <div className="space-y-3">
                {result.urgencyFlags.map((flagId, idx) => (
                  URGENCY_FLAG_TEXT[flagId] ? (
                    <p key={idx} className="text-sm text-foreground/90 leading-relaxed">
                      {URGENCY_FLAG_TEXT[flagId]}
                    </p>
                  ) : null
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Classification + Readiness ── */}
        <motion.section
          className="space-y-4 print:break-inside-avoid"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground italic">
            The classification reflects your market position. The readiness score reflects what stands between you and it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-7 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                GCC Market Opportunity
              </p>
              <span className={`self-start px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${styles.badge}`}>
                {result.classification}
              </span>
              <h2 className="text-xl font-serif font-bold text-foreground leading-snug">
                {styles.heading}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.classificationDescription}
              </p>
              {result.classificationIsEstimated && (
                <div className="mt-1 flex items-start gap-2 rounded-md border border-amber-400/25 bg-amber-500/10 px-4 py-3">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    This classification is provisional — it's based on an unconfirmed estimate of your competitive density. Before acting on it, it's worth confirming how many direct competitors are active in your specific clinical application in GCC.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-7 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Execution Readiness
              </p>
              <div className="flex items-center gap-6">
                <ReadinessGauge score={result.readinessScore} />
                <div className="flex flex-col gap-2">
                  <span className={`self-start px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${readinessStyle}`}>
                    {result.readinessLabel}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {(() => {
                      const pos = result.readinessBreakdown.filter(f => f.signal === "positive").length;
                      const total = result.readinessBreakdown.length;
                      return `${pos} of ${total} factors are showing positive signals across regulatory clearance, market status, procurement pathway, target market, registration ownership, distribution history, and internal mandate.`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Readiness Breakdown ── */}
        {result.readinessBreakdown.length > 0 && (
          <motion.section
            className="print:break-inside-avoid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">What drove your readiness score</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Here is how each factor in your profile contributed to the score, and what it signals about your GCC readiness.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {result.readinessBreakdown.map((factor, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <SignalIndicator signal={factor.signal} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-2">
                        <span className="text-sm font-semibold text-foreground">{factor.questionLabel}</span>
                        <span className="text-xs text-muted-foreground/60">·</span>
                        <span className="text-xs text-muted-foreground italic">
                          {factor.answerLabel.length > 60 ? factor.answerLabel.slice(0, 57) + "…" : factor.answerLabel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{factor.interpretation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Structural risks ── */}
        {result.topRisks.length > 0 && (
          <motion.section
            className="print:break-inside-avoid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-serif font-bold text-foreground mb-5">Structural Risks in Your Profile</h2>
            <div className="grid grid-cols-1 gap-4">
              {result.topRisks.map((risk, idx) => (
                <div key={idx} className={`p-5 rounded-lg border ${severityClasses(risk.severity)}`}>
                  <div className="flex items-start gap-3">
                    <SeverityIcon severity={risk.severity} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-base">{risk.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border opacity-60">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed opacity-85">{risk.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Print-only contact block ── */}
        <div className="hidden print:block print:break-inside-avoid border border-black rounded-lg p-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "black" }}>Next Step</p>
          <p className="text-lg font-serif font-bold mb-1" style={{ color: "black" }}>
            {CTA_COPY[result.classification].heading}
          </p>
          <p className="text-sm mb-4" style={{ color: "#444" }}>
            {CTA_COPY[result.classification].body}
          </p>
          <p className="text-sm font-semibold" style={{ color: "black" }}>
            Book a 30-minute introductory call: <span className="font-normal">calendly.com/klutfi7/meeting-kamal-lutfi</span>
          </p>
          <p className="text-sm mt-1" style={{ color: "black" }}>
            Web: <span className="font-normal">kl-advisory.ae</span>
          </p>
        </div>

        {/* ── CTA / Booking ── */}
        <motion.section
          className="print:hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Next Step</p>
            <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
              {CTA_COPY[result.classification].heading}
            </h3>
            <p className="text-base text-foreground/70 leading-relaxed mb-8">
              {CTA_COPY[result.classification].body}
            </p>

            {/* Booking card */}
            <div className="bg-card border border-border rounded-xl p-6 max-w-md">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Next Step</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Book time if you want a deeper discussion</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                  Free
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {[
                  "A closer look at your product, commercial stage, and where you are headed",
                  "An understanding of your GCC priorities and what you are trying to achieve",
                  "A clear view of the best next move",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>

              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-primary-foreground rounded-md text-base font-semibold hover:bg-primary/90 transition-colors"
              >
                Book Time
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Utility actions */}
          <div className="flex items-center justify-center gap-6 mt-6 print:hidden">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-muted-foreground border-border hover:text-foreground"
            >
              <Printer className="w-4 h-4" />
              Save as PDF
            </Button>
            <button
              onClick={() => {
                sessionStorage.removeItem("scorecard_answers");
                sessionStorage.removeItem("scorecard_result");
                sessionStorage.removeItem("scorecard_prospect");
                setLocation("/assessment");
              }}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </motion.section>

        {/* ── Print footer ── */}
        <div className="hidden print:block border-t border-black pt-5">
          <div className="flex items-start justify-between text-xs" style={{ color: "black" }}>
            <div>
              <p className="font-bold">KL MedTech</p>
              <p style={{ color: "#555" }}>GCC Commercial Architecture for MedTech</p>
            </div>
            <div className="text-right">
              <p>kl-advisory.ae</p>
              <p style={{ color: "#555" }}>
                Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "#888" }}>
            This report is based on self-reported responses and is intended for the use of the named recipient only.
          </p>
        </div>

      </main>
    </div>
  );
}
