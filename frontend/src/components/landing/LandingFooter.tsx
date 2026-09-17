import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#who-its-for", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-ink-100 bg-paper">
      <div className="lp-container py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm">
            <img
              src="/otoqoute logo.png"
              alt="OtoQuote AI"
              width={160}
              height={40}
              className="h-7 w-auto"
              loading="lazy"
              decoding="async"
            />
            <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
              Construction quotation software for Nigerian tradespeople. Describe the job, get the
              itemised quotation, send a document with your name on it.
            </p>
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-300">
              Built in Nigeria · Priced in Naira
            </p>
          </div>

          <nav aria-label="Product">
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-900">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded text-[14px] text-ink-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-900">
              Account
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="rounded text-[14px] text-ink-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Create an account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="rounded text-[14px] text-ink-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Sign in
                </button>
              </li>
            </ul>
          </nav>

          {/* Contact: the support address already used in-app. A phone number
              and physical address should be added here once they're real —
              placeholders were removed rather than carried over. */}
          <div>
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-900">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="mailto:support@otoquote.ai"
                  className="inline-flex items-center gap-2 rounded text-[14px] text-ink-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  <Mail size={14} aria-hidden="true" />
                  support@otoquote.ai
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-ink-100 pt-6 text-[13px] text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OtoQuote AI. All rights reserved.</p>
          <p>Quotation figures shown on this page are illustrative examples.</p>
        </div>
      </div>
    </footer>
  );
}
