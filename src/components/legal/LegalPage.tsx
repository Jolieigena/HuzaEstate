import Link from "next/link";

export type LegalBlock = string | { list: string[] };
export interface LegalSection {
  id: string;
  heading: string;
  body: LegalBlock[];
}
export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const OTHER_PAGES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/seller-terms", label: "Seller Terms & Conditions" },
];

/** A long-form legal page: title, date, a numbered list of its sections that jumps to them, then the sections themselves. The text
 *  lives in src/lib/legal so it can be edited without touching the layout. */
export default function LegalPage({ doc, path }: { doc: LegalDocument; path: string }) {
  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-wider text-[#219b31]">HuzaEstate</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Last updated {doc.updated}</p>
        <p className="mt-6 text-base leading-relaxed text-slate-700">{doc.intro}</p>

        <nav aria-label="Sections" className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">On this page</h2>
          <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {doc.sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-sm font-semibold text-slate-700 hover:text-[#219b31] hover:underline">
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {doc.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-black text-slate-900">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-700">
                {section.body.map((block, i) =>
                  typeof block === "string" ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-2 pl-6 marker:text-[#2ec440]">
                      {block.list.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-slate-200 pt-8">
          <p className="text-sm font-semibold text-slate-500">Also read</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {OTHER_PAGES.filter((page) => page.href !== path).map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-sm font-bold text-[#219b31] hover:underline">
                  {page.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-sm font-bold text-[#219b31] hover:underline">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
