import { ServiceCard } from '@/entities/service';
import { useI18n } from '@/shared/i18n';
import { Section } from '@/shared/ui';

export function Services() {
  const { t } = useI18n();
  return (
    <Section id="services" title={t.services.title} lead={t.services.lead}>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-window)] bg-line shadow-[0_0_0_1px_var(--line)] sm:grid-cols-2 lg:grid-cols-3">
        {t.services.items.map((service) => (
          <ServiceCard key={service.id} service={service} stackLabel={t.services.stackLabel} />
        ))}
      </ul>
    </Section>
  );
}
