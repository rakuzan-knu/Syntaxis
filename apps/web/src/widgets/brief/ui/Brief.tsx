import { BriefComposer } from '@/features/compose-brief';
import { useI18n } from '@/shared/i18n';
import { Desktop, PlainCaption, Section } from '@/shared/ui';

export function Brief() {
  const { t } = useI18n();
  return (
    <Section id="brief" title={t.brief.title} lead={t.brief.lead}>
      <Desktop className="mt-10">
        <BriefComposer />
      </Desktop>
      <PlainCaption label={t.ui.plainLabel} text={t.brief.plain} />
    </Section>
  );
}
