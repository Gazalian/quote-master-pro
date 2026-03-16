import type { Config } from "tailwindcss";

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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
