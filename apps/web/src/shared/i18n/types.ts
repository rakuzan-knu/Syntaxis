import type { LegalSlug } from '@/shared/config/legal';

export type Locale = 'uk' | 'en';

export interface ServiceItem {
  id: string;
  title: string;
  summary: string;
  includes: readonly string[];
  stack: string;
}

export interface Correction {
  usual: string;
  ours: string;
}

export interface ProcessStep {
  title: string;
  text: string;
  duration: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Choice {
  value: string;
  label: string;
}

export interface GlossaryItem {
  term: string;
  text: string;
}

export interface SectionCopy {
  title: string;
  lead: string;
  window: string;
  benefit: string;
  hints: readonly string[];
  callouts: readonly string[];
  chapters: readonly string[];
  glossary: readonly GlossaryItem[];
}

export interface ConsultantWords {
  bright: string;
  balanced: string;
  bold: string;
  sweet: string;
  espresso: string;
  filter: string;
  turkish: string;
  milk: string;
  budget: string;
}

export type ConsultantSignals = { readonly [Key in keyof ConsultantWords]: readonly string[] };

export interface DemoProduct {
  sku: string;
  name: string;
  note: string;
  price: number;
  description: string;
  origin: string;
}

export type LegalBlock = string | readonly string[];

export interface LegalSection {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: readonly LegalSection[];
}

export type LegalDocuments = Readonly<Record<LegalSlug, LegalDocument>>;

export interface Dictionary {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
    ogImageAlt: string;
  };
  nav: {
    label: string;
    work: string;
    services: string;
    terms: string;
    process: string;
    brief: string;
    faq: string;
  };
  header: {
    skip: string;
    home: string;
    cta: string;
    localeLabel: string;
  };
  ui: {
    explain: string;
    hideExplain: string;
    benefitLabel: string;
    plainLabel: string;
    glossaryLabel: string;
    palette: {
      open: string;
      title: string;
      placeholder: string;
      empty: string;
      groups: { go: string; demo: string; other: string };
      sections: {
        hero: string;
        design: string;
        api: string;
        deploy: string;
        security: string;
        performance: string;
        outstaff: string;
      };
      replay: string;
      language: string;
      telegram: string;
      shortcuts: string;
      hints: { move: string; run: string; close: string };
    };
    shortcuts: {
      title: string;
      close: string;
      items: readonly { keys: readonly string[]; text: string }[];
    };
    windows: {
      close: string;
      minimize: string;
      zoom: string;
      restoreAll: string;
      restore: string;
      reset: string;
      dock: string;
    };
    player: {
      label: string;
      play: string;
      pause: string;
      replay: string;
      yours: string;
      guide: string;
    };
  };
  hero: {
    title: string;
    lead: string;
    cta: string;
    secondary: string;
    hint: string;
  };
  build: {
    window: string;
    chapters: readonly string[];
    hints: readonly string[];
    callouts: readonly string[];
    tabs: { code: string; preview: string; audit: string };
    devices: { desktop: string; mobile: string };
    accentLabel: string;
    accentNames: readonly string[];
    suggestions: readonly string[];
    acceptSuggestion: string;
    demoBadge: string;
    runAudit: string;
    auditing: string;
    audit: { performance: string; accessibility: string; bestPractices: string; seo: string };
    auditNote: string;
    demo: {
      brand: string;
      nav: readonly string[];
      headline: string;
      sub: string;
      cta: string;
      products: readonly DemoProduct[];
      addToCart: string;
      added: string;
      currency: string;
      cartLabel: string;
      catalog: { title: string; lead: string; all: string };
      product: { back: string; origin: string; grind: string; weight: string };
      grinds: readonly Choice[];
      weights: readonly Choice[];
      cart: {
        title: string;
        empty: string;
        browse: string;
        quantity: string;
        remove: string;
        subtotal: string;
        delivery: string;
        free: string;
        freeFrom: string;
        total: string;
        checkout: string;
      };
      checkout: {
        title: string;
        name: string;
        namePlaceholder: string;
        nameError: string;
        city: string;
        cities: readonly Choice[];
        payment: string;
        payments: readonly Choice[];
        place: string;
        placing: string;
        summary: string;
      };
      order: { title: string; text: string; number: string; again: string };
      notFound: { title: string; text: string; home: string };
      consultant: {
        open: string;
        title: string;
        status: string;
        greeting: string;
        placeholder: string;
        send: string;
        close: string;
        typing: string;
        starters: readonly string[];
        askTaste: string;
        tasteChips: readonly string[];
        askBrew: string;
        brewChips: readonly string[];
        recommend: string;
        recommendAny: string;
        reasons: ConsultantWords;
        brews: { espresso: string; filter: string; turkish: string; milk: string };
        add: string;
        added: string;
        toCart: string;
        note: string;
        signals: ConsultantSignals;
      };
      guide: { add: string; open: string; checkout: string; place: string };
    };
    browser: {
      address: string;
      back: string;
      forward: string;
      reload: string;
      newTab: string;
      closeTab: string;
      tabs: string;
      newTabTitle: string;
      newTabSearch: string;
      shortcuts: string;
      offlineTitle: string;
      offlineText: string;
      offlineBack: string;
    };
  };
  design: SectionCopy & {
    controls: { accent: string; radius: string; density: string; font: string };
    densities: readonly Choice[];
    fonts: readonly Choice[];
    kit: {
      title: string;
      text: string;
      emailLabel: string;
      emailPlaceholder: string;
      primary: string;
      secondary: string;
      badge: string;
      toggle: string;
      tabs: readonly string[];
    };
    figma: {
      file: string;
      pages: string;
      pageNames: { subscribe: string; checkout: string };
      layers: string;
      panels: { layers: string; design: string; prototype: string; inspect: string };
      tools: {
        move: string;
        hand: string;
        undo: string;
        redo: string;
        zoomIn: string;
        zoomOut: string;
        zoom: string;
        fit: string;
        comment: string;
      };
      show: string;
      hide: string;
      lock: string;
      unlock: string;
      present: string;
      exitPresent: string;
      presentHint: string;
      copy: string;
      copied: string;
      variables: {
        title: string;
        mode: string;
        name: string;
        light: string;
        dark: string;
        note: string;
      };
      props: {
        page: string;
        text: string;
        size: string;
        weight: string;
        color: string;
        radius: string;
        padding: string;
        shadow: string;
        accentNote: string;
        width: string;
        state: string;
      };
      states: readonly Choice[];
      exportSvg: string;
      comments: { placeholder: string; send: string; reply: string; author: string; you: string };
      weights: readonly Choice[];
      shadows: readonly Choice[];
      flow: { title: string; trigger: string; navigate: string; animation: string; empty: string };
      inspectEmpty: string;
      editHint: string;
      collaborator: string;
      checkout: {
        back: string;
        title: string;
        plan: string;
        delivery: string;
        total: string;
        pay: string;
      };
    };
  };
  api: SectionCopy & {
    send: string;
    sending: string;
    quantity: string;
    city: string;
    cities: readonly Choice[];
    payment: string;
    payments: readonly Choice[];
    responseLabel: string;
    idle: string;
    product: string;
    scenarioLabel: string;
    integrations: {
      tab: string;
      lead: string;
      names: { crm: string; shipping: string; telegram: string; email: string };
      delivered: string;
      waiting: string;
      retry: string;
      crmDown: string;
    };
    scenarios: { ok: string; outOfStock: string; declined: string };
    environments: { production: string; staging: string };
    customer: {
      title: string;
      idle: string;
      products: string;
      created: string;
      pay: string;
      outOfStock: string;
      declined: string;
      paid: string;
      notFound: string;
      webhook: string;
      invalid: string;
    };
    plain: {
      idle: string;
      sending: string;
      products: string;
      created: string;
      outOfStock: string;
      declined: string;
      paid: string;
      notFound: string;
      webhook: string;
      invalid: string;
      staging: string;
    };
    nextHint: string;
    modes: { form: string; json: string };
    code: { tab: string; copy: string; copied: string };
    load: {
      button: string;
      title: string;
      start: string;
      again: string;
      close: string;
      rps: string;
      p95: string;
      instances: string;
      errors: string;
      requests: string;
      plain: string;
    };
  };
  deploy: SectionCopy & {
    run: string;
    running: string;
    again: string;
    steps: readonly string[];
    logs: readonly (readonly string[])[];
    success: string;
    duration: string;
    list: string;
    live: string;
    actions: { redeploy: string; broken: string; rollback: string };
    instant: string;
    newAge: string;
    history: readonly { sha: string; message: string; age: string; headline: string }[];
    broken: { sha: string; message: string; logs: readonly string[]; failed: string };
    plain: {
      idle: string;
      building: string;
      ready: string;
      failed: string;
      rollback: string;
      selected: string;
    };
    preview: {
      button: string;
      promote: string;
      badge: string;
      branch: string;
      message: string;
      sha: string;
      headline: string;
    };
    canary: {
      button: string;
      badge: string;
      title: string;
      stable: string;
      next: string;
      chart: string;
      threshold: string;
      elapsed: string;
      watching: string;
      rollback: string;
      result: string;
      commit: { sha: string; message: string };
      plain: { canary: string; canaryRollback: string };
    };
    plainExtra: { preview: string; promoted: string; logs: string };
  };
  security: SectionCopy & {
    gradeLabel: string;
    headers: readonly { id: string; name: string; description: string }[];
    responseLabel: string;
    blocked: string;
    exposed: string;
    attackLabel: string;
    attacks: readonly { id: string; name: string; blocked: string; succeeded: string }[];
    victim: {
      title: string;
      idle: string;
      review: string;
      reviewText: string;
      stolen: string;
      prize: string;
      refused: string;
      notSecure: string;
      password: string;
      intercepted: string;
      permission: string;
      allow: string;
      deny: string;
      blocked: string;
    };
    plain: { idle: string; off: string; on: string; blocked: string; succeeded: string };
    server: { title: string; items: readonly { id: string; name: string; description: string }[] };
    incidents: {
      title: string;
      blocked: string;
      through: string;
      empty: string;
      stoppedBy: string;
      passed: string;
      alert: string;
    };
    serverAttacks: readonly { id: string; name: string; blocked: string; succeeded: string }[];
    scenes: {
      login: string;
      email: string;
      attempts: string;
      locked: string;
      cracked: string;
      search: string;
      noResults: string;
      leaked: string;
    };
    audit: { title: string; fix: string; fixAll: string; clean: string; owasp: string };
  };
  performance: SectionCopy & {
    optimizations: readonly { id: string; label: string; detail: string }[];
    metrics: { score: string; lcp: string; inp: string; cls: string; weight: string };
    reset: string;
    networkLabel: string;
    networks: readonly Choice[];
    deviceLabel: string;
    devices: readonly Choice[];
    race: { button: string; before: string; after: string; loaded: string };
    explain: { fcp: string; lcp: string; tbt: string; cls: string; si: string; inp: string };
    explainHint: string;
    plain: {
      idle: string;
      applied: string;
      removed: string;
      conditions: string;
      race: string;
    };
    views: { report: string; real: string; images: string; budget: string };
    budget: {
      title: string;
      lead: string;
      needs: { dates: string; utils: string; charts: string };
      skip: string;
      pass: string;
      fail: string;
      base: string;
      lcp: string;
      mergeable: string;
      blocked: string;
      fix: string;
      plain: string;
    };
    real: {
      title: string;
      note: string;
      interact: string;
      waiting: string;
      waterfall: string;
      loaded: string;
      plain: string;
    };
    images: { before: string; after: string; hint: string; slider: string; plain: string };
  };
  outstaff: SectionCopy & {
    pr: {
      title: string;
      number: string;
      branch: string;
      author: string;
      description: string;
      checks: readonly string[];
      review: { author: string; text: string };
      commits: readonly { message: string; sha: string; time: string }[];
      notification: string;
    };
    approve: string;
    merge: string;
    merged: string;
    checksPassed: string;
    points: readonly { title: string; text: string }[];
    cta: string;
    message: string;
    requestChanges: string;
    you: string;
    commentLine: string;
    commentPlaceholder: string;
    commentButton: string;
    cancel: string;
    suggestions: readonly string[];
    changesText: string;
    reply: string;
    fixCommit: { message: string; sha: string; time: string };
    deploying: string;
    plain: {
      idle: string;
      checking: string;
      ready: string;
      fixing: string;
      fixed: string;
      approved: string;
      merged: string;
    };
    preview: {
      bot: string;
      ready: string;
      updated: string;
      text: string;
      url: string;
      headline: string;
      open: string;
      close: string;
    };
    report: {
      tab: string;
      title: string;
      total: string;
      hours: string;
      days: readonly string[];
      dayHours: readonly number[];
      tasks: readonly { title: string; hours: number; status: 'merged' | 'review' | 'progress' }[];
      statuses: { merged: string; review: string; progress: string };
      note: string;
    };
  };
  services: {
    title: string;
    lead: string;
    stackLabel: string;
    items: readonly ServiceItem[];
  };
  terms: {
    title: string;
    lead: string;
    usualLabel: string;
    oursLabel: string;
    items: readonly Correction[];
    foundingTitle: string;
    foundingText: string;
  };
  process: {
    title: string;
    lead: string;
    steps: readonly ProcessStep[];
  };
  brief: {
    title: string;
    lead: string;
    window: string;
    projectTemplate: string;
    focusTemplate: string;
    detailsTemplate: string;
    projectLabel: string;
    focusLabel: string;
    timelineLabel: string;
    budgetLabel: string;
    projects: readonly Choice[];
    focuses: readonly Choice[];
    timelines: readonly Choice[];
    budgets: readonly Choice[];
    previewLabel: string;
    online: string;
    greeting: string;
    builderLabel: string;
    send: string;
    copy: string;
    copied: string;
    hint: string;
    steps: readonly string[];
    typing: string;
    replies: Readonly<Record<string, string>>;
    replyNote: string;
    hints: readonly string[];
    plain: string;
    estimate: { title: string; weeks: string; note: string; deliverablesTitle: string };
    deliverables: Readonly<Record<string, readonly string[]>>;
  };
  faq: {
    title: string;
    items: readonly FaqItem[];
  };
  closing: {
    title: string;
    lead: string;
    cta: string;
    response: string;
  };
  footer: {
    tagline: string;
    rights: string;
    telegram: string;
    location: string;
    languageLabel: string;
    servicesLabel: string;
    companyLabel: string;
    contactLabel: string;
    legalLabel: string;
    response: string;
  };
  legal: {
    breadcrumb: string;
    home: string;
    updated: string;
    contents: string;
    related: string;
    questionsTitle: string;
    questionsText: string;
    titles: Readonly<Record<LegalSlug, string>>;
  };
  notFound: {
    title: string;
    text: string;
    back: string;
  };
}
