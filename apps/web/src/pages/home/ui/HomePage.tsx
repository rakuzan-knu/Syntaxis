import { CommandPalette } from '@/features/command-palette';
import { Closing } from '@/widgets/closing';
import { Faq } from '@/widgets/faq';
import { Hero } from '@/widgets/hero';
import { Process } from '@/widgets/process';
import { Services } from '@/widgets/services';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { Terms } from '@/widgets/terms';
import { useI18n } from '@/shared/i18n';
import { deferred, useDocumentTitle } from '@/shared/lib';

const DesignDemo = deferred(() => import('@/widgets/design-demo').then((m) => m.DesignDemo));
const ApiDemo = deferred(() => import('@/widgets/api-demo').then((m) => m.ApiDemo));
const DeployDemo = deferred(() => import('@/widgets/deploy-demo').then((m) => m.DeployDemo));
const SecurityDemo = deferred(() => import('@/widgets/security-demo').then((m) => m.SecurityDemo));
const PerformanceDemo = deferred(() =>
  import('@/widgets/performance-demo').then((m) => m.PerformanceDemo),
);
const OutstaffDemo = deferred(() => import('@/widgets/outstaff-demo').then((m) => m.OutstaffDemo));
const Brief = deferred(() => import('@/widgets/brief').then((m) => m.Brief));

export function HomePage() {
  const { t } = useI18n();
  useDocumentTitle(t.meta.title);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <div id="work" className="scroll-mt-16">
          <DesignDemo />
          <ApiDemo />
          <DeployDemo />
          <SecurityDemo />
          <PerformanceDemo />
          <OutstaffDemo />
        </div>
        <Services />
        <Terms />
        <Process />
        <Brief />
        <Faq />
        <Closing />
      </main>
      <SiteFooter />
      <CommandPalette />
    </>
  );
}
