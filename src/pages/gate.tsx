import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Gate() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string) ?? "";
    const email = (fd.get("email") as string) ?? "";
    const company = (fd.get("company") as string) ?? "";

    sessionStorage.setItem("scorecard_prospect", JSON.stringify({ name, email, company }));

    const ref = sessionStorage.getItem("scorecard_ref") ?? "direct";
    const utm = JSON.parse(sessionStorage.getItem("scorecard_utm") ?? "{}");

    fetch("https://formspree.io/f/xdayjjwp", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        company,
        _source: ref,
        _status: "assessment_started",
        _subject: `New scorecard lead — ${company}`,
        ...utm,
      }),
    }).catch(() => {});

    setIsSubmitting(false);
    setLocation("/assessment");
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground font-sans">
      <header className="w-full border-b border-primary/20 bg-[#f5f2ed]">
        <div className="container max-w-3xl mx-auto px-6 py-1.5">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="KL Advisory" className="h-[58px] w-auto" />
        </div>
      </header>

      <main className="flex-1 w-full container max-w-3xl mx-auto px-6 py-16 md:py-24 flex flex-col justify-center">
        <motion.div
          className="max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary border border-primary/30 rounded-full px-3 py-1 mb-6">
            12 Questions · 4 Minutes
          </span>

          <h1 className="text-4xl font-serif font-bold text-foreground leading-tight mb-4">
            Get your GCC market readiness report.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            Enter your details below to unlock the report.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="jane@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" required placeholder="Company name" />
            </div>

            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Your details are used only to send your report.
            </p>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Start the Assessment
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-dashed border-border">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Dev only</p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(
                    "scorecard_prospect",
                    JSON.stringify({ name: "Test User", email: "test@example.com", company: "Test Co" })
                  );
                  setLocation("/assessment");
                }}
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Skip and go to assessment
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
