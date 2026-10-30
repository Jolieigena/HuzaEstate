"use client";

import { useLanguage } from "@/lib/i18n/language";

/** A text in the chosen language, for shared components that are not client components themselves (see PageFrame in
 *  professional/ui.tsx): the text is looked up in the language lists, and shows as written when there is no translation. */
export default function Tr({ text, values }: { text: string; values?: Record<string, string | number> }) {
  const { t } = useLanguage();
  return <>{t(text, values)}</>;
}
