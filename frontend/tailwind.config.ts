import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Archivo: a sturdy grotesque — technical and confident at large sizes
        // without reading as a construction-company logotype.
        display: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
        // Used for refs, quantities, units and measurement marks.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "doc": {
          primary: "hsl(var(--doc-primary))",
          "primary-foreground": "hsl(var(--doc-primary-foreground))",
          secondary: "hsl(var(--doc-secondary))",
          "secondary-foreground": "hsl(var(--doc-secondary-foreground))",
        },
        chat: {
          bg: "hsl(var(--chat-bg))",
          "bubble-user": "hsl(var(--bubble-user))",
          "bubble-user-fg": "hsl(var(--bubble-user-foreground))",
          "bubble-ai": "hsl(var(--bubble-ai))",
          "bubble-ai-fg": "hsl(var(--bubble-ai-foreground))",
        },
        badge: {
          pending: "hsl(var(--badge-pending))",
          "pending-fg": "hsl(var(--badge-pending-foreground))",
          approved: "hsl(var(--badge-approved))",
          "approved-fg": "hsl(var(--badge-approved-foreground))",
          invoiced: "hsl(var(--badge-invoiced))",
          "invoiced-fg": "hsl(var(--badge-invoiced-foreground))",
          archived: "hsl(var(--badge-archived))",
          "archived-fg": "hsl(var(--badge-archived-foreground))",
          ai: "hsl(var(--badge-ai))",
          myprice: "hsl(var(--badge-myprice))",
        },
        nav: {
          bg: "hsl(var(--nav-bg))",
          active: "hsl(var(--nav-active))",
          inactive: "hsl(var(--nav-inactive))",
        },
        // ── Marketing-site palette ────────────────────────────────────────
        // The three OtoQuote brand colours, named so landing sections stop
        // hard-coding hex values, plus an ink ramp for typography. Headlines
        // use ink rather than brand blue — blue-on-everything is what made
        // the old page read as a template.
        // Signal Orange and Emerald are brand *fill* colours — at label sizes
        // neither clears 4.5:1 on white, so each has a darkened `-ink` variant
        // that is the only one allowed to carry text.
        brand: {
          blue: "#0056D2",
          "blue-700": "#0046AC",
          "blue-50": "#EEF4FE",
          orange: "#F58220",
          "orange-ink": "#A34E0D",
          "orange-50": "#FEF4EA",
          green: "#009A44",
          "green-ink": "#00702F",
          "green-50": "#E9F7EF",
        },
        // 500 and 300 are the muted text tones for LIGHT backgrounds (5.9:1
        // and 5.0:1 on white). 400 is the muted tone for DARK panels, where
        // 300 would be too close to the background. 100/50 are fills and
        // rules only — never text.
        ink: {
          DEFAULT: "#0C1522",
          900: "#0C1522",
          700: "#26364B",
          500: "#54657D",
          400: "#8A9AB0",
          300: "#5B6A84",
          100: "#DCE3ED",
          50: "#EEF2F7",
        },
        paper: "#FBFCFE",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // Landing marquee — translate-only so it stays on the compositor.
        "marquee-x": {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        "caret-blink": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "marquee-x": "marquee-x 42s linear infinite",
        "caret-blink": "caret-blink 1s steps(1) infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
