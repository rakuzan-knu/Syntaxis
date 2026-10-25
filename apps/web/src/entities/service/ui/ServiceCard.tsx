import type { ServiceItem } from '@/shared/i18n';

interface ServiceCardProps {
  service: ServiceItem;
  stackLabel: string;
}

export function ServiceCard({ service, stackLabel }: ServiceCardProps) {
  return (
    <li id={`service-${service.id}`} className="flex flex-col bg-surface p-6 md:p-7">
      <h3 className="text-step-1 font-semibold tracking-[-0.015em]">{service.title}</h3>
      <p className="mt-2 text-step--1 text-muted">{service.summary}</p>
      <ul className="mt-5 space-y-1.5 text-step--1">
        {service.includes.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.6em] size-1 shrink-0 rounded-full bg-accent"
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-6 font-mono text-step--2 text-faint">
        <span className="sr-only">{stackLabel}: </span>
        {service.stack}
      </p>
    </li>
  );
}
