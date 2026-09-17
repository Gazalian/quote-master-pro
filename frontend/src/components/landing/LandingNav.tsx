import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#who-its-for", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Only the border/shadow changes on scroll — the bar itself never resizes,
  // so nothing below it shifts.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-paper/85 backdrop-blur-md transition-colors duration-200 ${
        scrolled ? "border-ink-100" : "border-transparent"
      }`}
    >
      <nav aria-label="Main" className="lp-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <a
            href="#top"
            className="-ml-1 flex min-h-[44px] shrink-0 items-center rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
          >
            <img
              src="/otoqoute logo.png"
              alt="OtoQuote AI"
              width={160}
              height={40}
              className="h-7 w-auto sm:h-8"
              loading="eager"
              decoding="async"
            />
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="flex min-h-[44px] items-center rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Start free
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="landing-mobile-menu"
          className="border-t border-ink-100 bg-paper md:hidden"
        >
          <div className="lp-container py-3">
            <ul className="space-y-0.5">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-ink-700 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 border-t border-ink-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/auth");
                }}
                className="w-full rounded-lg bg-ink-900 px-4 py-3.5 text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                Start free
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/auth");
                }}
                className="w-full rounded-lg border border-ink-100 px-4 py-3.5 text-base font-semibold text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
