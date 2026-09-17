/**
 * OtoQuote marketing site.
 *
 * Narrative order: problem → the turn → how it works → revisions →
 * where prices come from → what you get → who it's for → why → pricing → CTA.
 *
 * Section components live in `components/landing/`. Nothing here imports from
 * the authenticated app beyond the feature flags, and no animation library is
 * used — see `components/landing/primitives.tsx` for the motion approach.
 */

import PWAInstallPrompt from "@/components/PWAInstallPrompt";

import { AudienceSection } from "@/components/landing/AudienceSection";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { PriceTrust } from "@/components/landing/PriceTrust";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RevisionDemo } from "@/components/landing/RevisionDemo";
import { TradeStrip } from "@/components/landing/TradeStrip";
import { WhyOtoQuote } from "@/components/landing/WhyOtoQuote";

const LandingPage = () => (
  // `overflow-x-clip` is the guard rail for the rotated/offset decorative
  // elements — they must never be able to widen the document on a 320px phone.
  <div className="lp min-h-screen overflow-x-clip">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
    >
      Skip to content
    </a>

    <PWAInstallPrompt />
    <LandingNav />

    <main id="main">
      <Hero />
      <TradeStrip />
      <ProblemSection />
      <HowItWorks />
      <RevisionDemo />
      <PriceTrust />
      <FeatureBento />
      <AudienceSection />
      <WhyOtoQuote />
      <PricingSection />
      <ClosingCTA />
    </main>

    <LandingFooter />
  </div>
);

export default LandingPage;
