import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";

/**
 * Each card pairs a trade with the kind of sentence that trade would actually
 * type. The trades are the ones in the sign-up form; the example prompts are
 * phrased with the units and terms the backend's knowledge base expects.
 */
const AUDIENCES = [
  { trade: "Electricians", prompt: "Wire a 3-bedroom flat — 32 points, 8-way DB, surface conduit." },
  { trade: "Plumbers", prompt: "Plumb 3 toilets and a kitchen. 3/4\" UPVC supply, 4\" PVC waste." },
  { trade: "Builders & Masons", prompt: "Block-work to lintel level, 3-bedroom bungalow, 6-inch blocks." },
  { trade: "Painters", prompt: "Putty and two coats emulsion — 4 rooms plus the corridor." },
  { trade: "Tilers", prompt: "42 sqm floor in 60×60, plus skirting all round." },
  { trade: "Carpenters", prompt: "Six flush doors with frames and mortice locks." },
  { trade: "Welders & Fabricators", prompt: "Balcony railing, 12 metres, 2-inch box iron." },
  { trade: "AC & Generator Technicians", prompt: "Install 4 split units, 1.5HP, with copper runs." },
];

export function AudienceSection() {
  return (
    <section
      id="who-its-for"
      className="scroll-mt-20 border-y border-ink-100 bg-white py-16 sm:py-20 lg:py-28"
    >
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="06">Who it's for</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">
              If you have to put a number on a job, it was built for you.
            </SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              You pick your trade and your state when you sign up. From then on the material lists,
              the units and the labour rates come out matched to the work you actually do.
            </SectionLead>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((item, i) => (
            <Reveal
              as="li"
              key={item.trade}
              delay={(i % 4) * 60}
              className="group flex flex-col gap-3 bg-white p-5 transition-colors duration-300 hover:bg-paper"
            >
              <h3 className="font-display text-[15px] font-bold leading-snug text-ink-900">
                {item.trade}
              </h3>
              <p className="rounded-lg border border-dashed border-ink-100 bg-paper px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink-500 transition-colors duration-300 group-hover:border-brand-blue/25 group-hover:text-ink-700">
                “{item.prompt}”
              </p>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={100}>
          <p className="mt-8 text-[14.5px] leading-relaxed text-ink-500">
            Also borehole drillers, refrigeration technicians, interior installers, roofing
            contractors and small construction firms —{" "}
            <span className="font-medium text-ink-900">
              plus a general option for any trade not on the list
            </span>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
