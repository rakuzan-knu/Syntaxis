import type { LegalDocuments } from '../types';

const UPDATED = '2026-10-25';

export const legalEn: LegalDocuments = {
  terms: {
    title: 'Terms of Service',
    description:
      'The rules for using the Syntaxis website: what the site is for, intellectual property, liability and governing law.',
    updated: UPDATED,
    intro:
      'These terms govern your use of this website. By opening and using it, you agree to them. If you do not agree, please do not use the site.',
    sections: [
      {
        id: 'about',
        title: 'Who we are',
        blocks: [
          'Syntaxis (“we”, “us”) is a team of three software engineers based in Ukraine who design and build custom websites and web applications. In these terms, “site” means this website, all its pages and the interactive demos on it.',
          'You can reach us on Telegram at @gmblesssed.',
        ],
      },
      {
        id: 'purpose',
        title: 'What the site is for',
        blocks: [
          'The site describes our services and shows examples of how we work. The information on it is for reference only.',
          'Nothing on the site is a public offer. Prices, timelines, warranties and other terms mentioned here are indicative. A binding agreement exists only once we and the client sign a separate contract or agree the scope in writing.',
        ],
      },
      {
        id: 'demos',
        title: 'Interactive demos',
        blocks: [
          'The site contains simulations of professional tools: an editor, a design tool, an API client, a deployment dashboard, browser developer tools, a performance report, a pull request and a chat. They run entirely in your browser and do not connect to real systems.',
          [
            'The “Zerno” coffee store, its products, orders, customers, commits and people shown in the demos are fictional.',
            'No real orders, payments or deployments are made.',
            'The brief composer only prepares a message. It opens Telegram with the text filled in, and you decide whether to send it.',
          ],
        ],
      },
      {
        id: 'use',
        title: 'Acceptable use',
        blocks: [
          'You may browse the site, share links to it and quote short fragments with attribution. You agree not to:',
          [
            'copy, republish or sell the site’s design, code, text or images without our written permission;',
            'disrupt the site, overload it or attempt to bypass its security measures;',
            'test the site for vulnerabilities outside the rules of our Security Policy;',
            'use the site for anything unlawful or to mislead others about a connection with us.',
          ],
        ],
      },
      {
        id: 'ip',
        title: 'Intellectual property',
        blocks: [
          'The site’s design, code, text, illustrations and the Syntaxis name and logo belong to us. All rights reserved.',
          'Open-source components used on the site remain under their own licences, listed in the Legal Notice.',
          'Rights to work we create for clients are set out in each client contract. As stated on the site, code, design files and access are transferred to the client.',
        ],
      },
      {
        id: 'links',
        title: 'Links to other services',
        blocks: [
          'The site links to Telegram and may link to other third-party services. We do not control them and are not responsible for their content or privacy practices. Their own terms apply when you use them.',
        ],
      },
      {
        id: 'liability',
        title: 'Disclaimer and liability',
        blocks: [
          'We keep the site accurate and available, but provide it “as is”, without guarantees that it will always be error-free or uninterrupted.',
          'To the extent permitted by law, we are not liable for indirect losses arising from the use of the site or reliance on its reference information. Nothing in these terms limits liability that cannot be limited by law or your statutory rights as a consumer.',
          'Our liability for services we provide to clients is governed by the relevant contract.',
        ],
      },
      {
        id: 'law',
        title: 'Governing law and disputes',
        blocks: [
          'These terms are governed by the laws of Ukraine. We will try to resolve any disagreement through talks first. If that fails, the dispute will be considered by the competent court under Ukrainian law, unless mandatory rules of your country of residence give you another right.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes to these terms',
        blocks: [
          'We may update these terms. The current version is always on this page, with the date of the latest update at the top. Continuing to use the site after an update means you accept the new version.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'What personal data Syntaxis processes, why, for how long, who else receives it and how to exercise your rights.',
    updated: UPDATED,
    intro:
      'We collect as little personal data as possible. The site has no forms, accounts, analytics, advertising or trackers. This policy explains what is still processed and how you can control it. It follows the Law of Ukraine “On Personal Data Protection” and the EU General Data Protection Regulation (GDPR).',
    sections: [
      {
        id: 'controller',
        title: 'Who is responsible',
        blocks: [
          'Syntaxis, a team of software engineers based in Ukraine, is the controller of the personal data described here. For any privacy question or request, write to us on Telegram at @gmblesssed.',
        ],
      },
      {
        id: 'data',
        title: 'What data we process',
        blocks: [
          'When you visit the site:',
          [
            'Technical request data processed automatically by our hosting provider: IP address, date and time, requested page, browser and device type, and referring page. We do not combine it with other data or use it to identify you.',
          ],
          'When you contact us:',
          [
            'Your Telegram name and username, and anything you choose to share in the conversation: project details, company name, contact details.',
          ],
          'When we work together:',
          [
            'The details needed to sign and perform the contract: names, company details, billing information and project correspondence.',
          ],
          'We do not knowingly collect special categories of data, such as health or biometric data, and ask you not to send them.',
        ],
      },
      {
        id: 'purposes',
        title: 'Why we process it and on what basis',
        blocks: [
          [
            'To deliver the site securely and protect it from abuse: our legitimate interest in running a reliable site (GDPR Art. 6(1)(f)).',
            'To answer your message and prepare an estimate: steps taken at your request before a contract (Art. 6(1)(b)).',
            'To perform the contract and keep project records: performance of a contract (Art. 6(1)(b)).',
            'To meet accounting, tax and other legal duties: legal obligation (Art. 6(1)(c)).',
          ],
          'We do not use your data for advertising, profiling or automated decision-making, and we never sell it.',
        ],
      },
      {
        id: 'recipients',
        title: 'Who else receives data',
        blocks: [
          [
            'Vercel Inc. (USA) hosts the site and processes technical request data on our behalf.',
            'Telegram processes messages you send us under its own privacy policy.',
            'Accountants, banks or authorities, only when required to perform a contract or by law.',
          ],
          'Some of these providers are outside Ukraine and the European Economic Area. Where this happens, transfers rely on safeguards recognised by law, such as the EU-US Data Privacy Framework or standard contractual clauses.',
        ],
      },
      {
        id: 'retention',
        title: 'How long we keep data',
        blocks: [
          [
            'Technical request data is kept by the hosting provider for a short period according to its log retention settings, usually no longer than 30 days.',
            'Messages that did not lead to a project are deleted within 12 months of the last contact.',
            'Project correspondence and contract data are kept for the duration of the contract and up to 3 years after it ends, or longer where the law requires.',
          ],
        ],
      },
      {
        id: 'rights',
        title: 'Your rights',
        blocks: [
          'You have the right to:',
          [
            'know whether we process your data and get a copy of it;',
            'correct inaccurate data;',
            'ask us to delete data or restrict its processing;',
            'object to processing based on our legitimate interest;',
            'receive data you gave us in a portable format;',
            'withdraw consent at any time, where processing is based on consent.',
          ],
          'To exercise a right, message us on Telegram. We will reply within 30 days, usually much sooner. You may also complain to the Ukrainian Parliament Commissioner for Human Rights or, if you live in the EU, to your local data protection authority.',
        ],
      },
      {
        id: 'security',
        title: 'How we protect data',
        blocks: [
          'The site is served only over HTTPS with strict security headers, loads no third-party scripts and stores no visitor data. Access to client data is limited to the team members working on the project.',
        ],
      },
      {
        id: 'children',
        title: 'Children',
        blocks: [
          'The site and our services are intended for businesses and adults. We do not knowingly process data of children under 16.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes to this policy',
        blocks: [
          'If we change how we process data, we will update this page and the date at the top.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    description:
      'Syntaxis does not use cookies, analytics or trackers. What that means for you and what happens on third-party sites.',
    updated: UPDATED,
    intro:
      'Short version: this site does not set cookies and does not store anything in your browser. That is why you do not see a cookie banner.',
    sections: [
      {
        id: 'what',
        title: 'What cookies are',
        blocks: [
          'Cookies are small text files a site saves in your browser. Similar technologies include local storage, session storage and tracking pixels. They can be used to remember settings, measure visits or show advertising.',
        ],
      },
      {
        id: 'ours',
        title: 'What this site uses',
        blocks: [
          [
            'No cookies, either our own or third-party.',
            'No local or session storage.',
            'No analytics, advertising pixels, fingerprinting or social media widgets.',
            'Fonts and images are served from our own domain, so opening a page sends no requests to other companies.',
          ],
          'The language and colour theme follow your browser settings and the address you open, so nothing has to be saved.',
        ],
      },
      {
        id: 'third-party',
        title: 'Third-party sites',
        blocks: [
          'When you follow a link to Telegram or another service, that service may set its own cookies under its own policy. This happens only after you leave our site.',
        ],
      },
      {
        id: 'control',
        title: 'How to control cookies',
        blocks: [
          'You can view, block and delete cookies in your browser settings. Blocking cookies will not affect how this site works.',
        ],
      },
      {
        id: 'changes',
        title: 'If this changes',
        blocks: [
          'If we ever add cookies or analytics, we will update this policy first and, where the law requires, ask for your consent before setting anything that is not strictly necessary.',
        ],
      },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    description:
      'How Syntaxis makes its website accessible: WCAG 2.2 AA target, what has been done, known limitations and how to report a barrier.',
    updated: UPDATED,
    intro:
      'We want everyone to be able to use this site, regardless of ability, device or connection. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.',
    sections: [
      {
        id: 'measures',
        title: 'What we have done',
        blocks: [
          [
            'Semantic HTML with landmarks, a logical heading structure and a “Skip to content” link.',
            'Everything works with a keyboard, with a clearly visible focus indicator.',
            'Text contrast of at least 4.5:1 in both light and dark themes.',
            'Animations respect the “reduce motion” setting, and demos jump straight to their final state.',
            'Text resizes up to 200% and the layout works from 360 px wide without horizontal scrolling.',
            'Every demo has an “Explain” mode and a plain-language caption describing what happened.',
            'The site is available in Ukrainian and English, with the language marked up for screen readers.',
          ],
        ],
      },
      {
        id: 'limitations',
        title: 'Known limitations',
        blocks: [
          [
            'The demos reproduce professional tools. Some interactions, such as moving layers on the design canvas, are easier with a mouse or touch, although the same settings are available through keyboard-accessible controls.',
            'Interface labels inside the demo windows stay in English, as in the real tools. Explanations around them are translated.',
          ],
          'We are working to remove these limitations. If any of them prevents you from getting information, write to us and we will provide it in another way.',
        ],
      },
      {
        id: 'testing',
        title: 'How we check',
        blocks: [
          'We test with automated tools such as Lighthouse, and manually with a keyboard, at different zoom levels and screen widths. We check again whenever the site changes significantly.',
        ],
      },
      {
        id: 'compatibility',
        title: 'Compatibility',
        blocks: [
          'The site is designed for current versions of Chrome, Edge, Firefox and Safari on desktop and mobile, and for the screen readers commonly used with them: NVDA, JAWS, VoiceOver and TalkBack.',
        ],
      },
      {
        id: 'feedback',
        title: 'Report a barrier',
        blocks: [
          'If something is hard to use or does not work with your assistive technology, message us on Telegram at @gmblesssed. Tell us the page, what you were trying to do and, if possible, your browser and assistive technology. We reply within a day.',
        ],
      },
    ],
  },
  legal: {
    title: 'Legal Notice',
    description:
      'Who runs the Syntaxis website, how to contact us, intellectual property and the open-source software used on the site.',
    updated: UPDATED,
    intro:
      'This page contains information about the operator of the site, intellectual property and the third-party software used.',
    sections: [
      {
        id: 'operator',
        title: 'Site operator',
        blocks: [
          [
            'Name: Syntaxis, a team of software engineers.',
            'Country: Ukraine.',
            'Contact: Telegram @gmblesssed.',
            'Activity: design and development of websites and web applications, and related consulting.',
          ],
          'The details of the party performing the work, including its legal status and registration details, are specified in each client contract.',
        ],
      },
      {
        id: 'ip',
        title: 'Intellectual property',
        blocks: [
          '© 2026 Syntaxis. All rights reserved. The text, design, illustrations, code and the Syntaxis name and logo on this site are protected by copyright and may not be used without our written permission, except as allowed by law.',
          'The site shows no third-party logos. Names of technologies are used only to describe our work and belong to their owners.',
        ],
      },
      {
        id: 'content',
        title: 'Content and demos',
        blocks: [
          'Information on the site is for reference and is not a public offer. The “Zerno” store and all people, orders and data in the demos are fictional. Any resemblance to real companies or people is coincidental.',
        ],
      },
      {
        id: 'open-source',
        title: 'Open-source software',
        blocks: [
          'The site is built with open-source software. We thank its authors.',
          [
            'React and React DOM, MIT License.',
            'Lucide icons, ISC License.',
            'Geologica typeface, SIL Open Font License 1.1.',
            'JetBrains Mono typeface, SIL Open Font License 1.1.',
            'Tailwind CSS and Vite, MIT License.',
          ],
        ],
      },
      {
        id: 'related',
        title: 'Related documents',
        blocks: [
          'How the site may be used is described in the Terms of Service, how data is handled in the Privacy Policy and the Cookie Policy, and how to report a vulnerability in the Security Policy.',
        ],
      },
    ],
  },
  security: {
    title: 'Security Policy',
    description:
      'How to report a vulnerability in the Syntaxis website responsibly: scope, rules, safe harbour and how quickly we respond.',
    updated: UPDATED,
    intro:
      'Security is part of every project we build, including this site. If you find a vulnerability, please report it to us privately so we can fix it before anyone is harmed.',
    sections: [
      {
        id: 'report',
        title: 'How to report',
        blocks: [
          'Message us on Telegram at @gmblesssed. Please do not publish the details or open public issues until we have fixed the problem. Include:',
          [
            'the affected page or address;',
            'the type of vulnerability and its possible impact;',
            'steps to reproduce, or a proof of concept;',
            'how you would like to be credited, if at all.',
          ],
          'The same contact is listed in the machine-readable file /.well-known/security.txt.',
        ],
      },
      {
        id: 'scope',
        title: 'Scope',
        blocks: [
          'In scope: this site and its subdomains. The interactive demos are simulations, so “attacks” shown inside them are not vulnerabilities.',
          'Out of scope:',
          [
            'denial-of-service attacks and load testing;',
            'social engineering, phishing or physical attacks;',
            'reports from automated scanners without a demonstrated impact;',
            'missing best practices without a working exploit, for example on pages with no sensitive actions;',
            'vulnerabilities in third-party services such as Telegram or our hosting provider. Report those to their owners.',
          ],
        ],
      },
      {
        id: 'rules',
        title: 'Rules of research',
        blocks: [
          [
            'Do not access, change or delete data that does not belong to you.',
            'Do not degrade the site for other visitors.',
            'Use the minimum access needed to show the problem, and stop as soon as you confirm it.',
            'Give us reasonable time to fix the issue before any disclosure.',
          ],
        ],
      },
      {
        id: 'safe-harbour',
        title: 'Safe harbour',
        blocks: [
          'If you act in good faith and follow this policy, we will not take legal action against you and will not ask anyone else to. If in doubt, ask us before you continue.',
        ],
      },
      {
        id: 'response',
        title: 'What happens next',
        blocks: [
          [
            'We acknowledge your report within 48 hours.',
            'We confirm the issue and agree a fix timeline with you, based on its severity.',
            'We let you know when it is fixed and, with your permission, credit you publicly.',
          ],
          'We do not run a paid bug bounty programme yet, but we appreciate every report.',
        ],
      },
    ],
  },
};
