import type { Choice, Dictionary, Locale } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';

export interface BriefSelection {
  project: string;
  focuses: readonly string[];
  timeline: string;
  budget: string;
}

type BriefCopy = Dictionary['brief'];

function labelOf(choices: readonly Choice[], value: string): string {
  return choices.find((choice) => choice.value === value)?.label ?? value;
}

export function defaultSelection(copy: BriefCopy): BriefSelection {
  return {
    project: copy.projects[1]?.value ?? '',
    focuses: copy.focuses.slice(0, 2).map((choice) => choice.value),
    timeline: copy.timelines[1]?.value ?? '',
    budget: copy.budgets.at(-1)?.value ?? '',
  };
}

export function composeBrief(selection: BriefSelection, copy: BriefCopy, locale: Locale): string {
  const sentences = [
    fillTemplate(copy.projectTemplate, { project: labelOf(copy.projects, selection.project) }),
  ];

  const focuses = copy.focuses
    .filter((choice) => selection.focuses.includes(choice.value))
    .map((choice) => choice.label);
  if (focuses.length > 0) {
    const list = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
      focuses,
    );
    sentences.push(fillTemplate(copy.focusTemplate, { focus: list }));
  }

  sentences.push(
    fillTemplate(copy.detailsTemplate, {
      timeline: labelOf(copy.timelines, selection.timeline),
      budget: labelOf(copy.budgets, selection.budget),
    }),
  );

  return sentences.join(' ');
}

export function toggleFocus(selection: BriefSelection, value: string): BriefSelection {
  const focuses = selection.focuses.includes(value)
    ? selection.focuses.filter((focus) => focus !== value)
    : [...selection.focuses, value];
  return { ...selection, focuses };
}
