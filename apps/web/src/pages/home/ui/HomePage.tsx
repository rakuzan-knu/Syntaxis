import { ApiDemo } from '@/widgets/api-demo';
import { Brief } from '@/widgets/brief';
import { Closing } from '@/widgets/closing';
import { DeployDemo } from '@/widgets/deploy-demo';
import { DesignDemo } from '@/widgets/design-demo';
import { Faq } from '@/widgets/faq';
import { Hero } from '@/widgets/hero';
import { OutstaffDemo } from '@/widgets/outstaff-demo';
import { PerformanceDemo } from '@/widgets/performance-demo';
import { Process } from '@/widgets/process';
import { SecurityDemo } from '@/widgets/security-demo';
import { Services } from '@/widgets/services';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { Terms } from '@/widgets/terms';
import { useI18n } from '@/shared/i18n';
import { useDocumentTitle } from '@/shared/lib';

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
    </>
  );
}
