import type { SummaryProfileInput } from '@/lib/profile/summary-builder';

export interface GoldenProfileTestCase {
  id: string;
  name: string;
  profile: SummaryProfileInput;
  samples: Array<{ title: string; content: string }>;
  platforms: Array<'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook'>;
  brief: string;
  expectedLanguage: string;
  expectedPlaceholders: string[];
}

export const GOLDEN_PROFILES: GoldenProfileTestCase[] = [
  {
    id: 'cloud-architect-en',
    name: 'Cloud Architect (English)',
    profile: {
      role: 'Principal Cloud Architect',
      primaryLanguage: 'en',
      arabicDialect: 'none',
      identityData: {
        role: 'Principal Cloud Architect',
        industry: 'Enterprise Infrastructure & Cloud Security',
        expertise: ['Kubernetes', 'Multi-Region High Availability', 'Cost Optimization'],
        positioning: 'Pragmatic, zero-bullshit infrastructure architecture for high-growth systems.',
      },
      principlesData: {
        values: ['Simplicity over cleverness', 'Measured failure domains', 'Observability first'],
        topicsToAvoid: ['Hype-driven refactors', 'Surface-level AI buzzwords', 'Vendor lock-in endorsements'],
        toneRedLines: ['Never use "game-changer"', 'No clickbait hooks', 'No corporate speak'],
      },
      audienceData: {
        persona: 'Engineering directors, senior staff engineers, and infrastructure leads',
        expertiseLevel: 'expert',
        interests: ['System resilience', 'Zero-downtime migrations', 'Distributed databases'],
      },
      styleData: {
        formality: 4,
        length: 'medium',
        emoji: 'minimal',
        hookStyle: 'bold_statement',
      },
    },
    samples: [
      {
        title: 'Kubernetes multi-cluster failover',
        content:
          'Most outages do not come from hardware failure. They come from configuration drift between regions. Here is the exact blueprint we used to isolate failure domains across [YOUR NUMBER] clusters.',
      },
    ],
    platforms: ['linkedin', 'x'],
    brief: 'Migrating legacy batch queues to event streams with zero data loss.',
    expectedLanguage: 'en',
    expectedPlaceholders: ['[YOUR NUMBER]', '[METRIC]'],
  },
  {
    id: 'fintech-founder-fr',
    name: 'Fintech Founder (French)',
    profile: {
      role: 'Fondateur & CEO Fintech',
      primaryLanguage: 'fr',
      arabicDialect: 'none',
      identityData: {
        role: 'Fondateur & CEO',
        industry: 'Fintech & Paiements Numériques',
        expertise: ['Conformité bancaire', 'Paiements transfrontaliers', 'SaaS B2B'],
        positioning: 'Bâtir la souveraineté financière avec rigueur et innovation pérenne.',
      },
      principlesData: {
        values: ['Rigueur réglementaire', 'Transparence des frais', 'Sécurité des données'],
        topicsToAvoid: ['Cryptomonnaies spéculatives', 'Conseils fiscaux informels'],
        toneRedLines: ['Pas de promesses irréalistes', 'Pas de langage familier'],
      },
      audienceData: {
        persona: 'Directeurs financiers, trésoriers d’entreprises et régulateurs',
        expertiseLevel: 'expert',
        interests: ['Réglementation DSP2', 'Optimisation du fonds de roulement'],
      },
      styleData: {
        formality: 5,
        length: 'medium',
        emoji: 'minimal',
        hookStyle: 'statistic',
      },
    },
    samples: [
      {
        title: 'Frais cachés bancaires',
        content:
          'En 2026, les frais de change opaques coûtent encore [VOTRE CHIFFRE]% de marge aux PME exportatrices. La transparence n’est pas un slogan, c’est un impératif économique.',
      },
    ],
    platforms: ['linkedin', 'x'],
    brief: 'Annonce de notre certification de conformité bancaire européenne.',
    expectedLanguage: 'fr',
    expectedPlaceholders: ['[VOTRE CHIFFRE]', '[DATE]'],
  },
  {
    id: 'community-manager-ar-msa',
    name: 'Community Manager (Arabic - MSA)',
    profile: {
      role: 'مدير مجتمعات تقنية',
      primaryLanguage: 'ar',
      arabicDialect: 'msa',
      identityData: {
        role: 'مدير مجتمعات رقمية',
        industry: 'المصادر المفتوحة وتطوير البرمجيات',
        expertise: ['إدارة المجتمعات', 'المحتوى التقني العربي', 'تنظيم الفعاليات'],
        positioning: 'تمكين المطورين العرب من المساهمة الفاعلة في البرمجيات مفتوحة المصدر.',
      },
      principlesData: {
        values: ['التعاون المعرفي', 'الشمولية', 'الدقة اللغوية'],
        topicsToAvoid: ['النقاشات السياسية', 'الترويج التجاري المباشر'],
        toneRedLines: ['تجنب الألفاظ العامية المبتذلة', 'عدم التهجم على المبتدئين'],
      },
      audienceData: {
        persona: 'المطورون وهواة التقنية وطلاب الهندسة في العالم العربي',
        expertiseLevel: 'intermediate',
        interests: ['البرمجة بلغة Rust', 'الأنظمة الموزعة', 'العمل الحر'],
      },
      styleData: {
        formality: 3,
        length: 'medium',
        emoji: 'tasteful',
        hookStyle: 'question',
      },
    },
    samples: [
      {
        title: 'أهمية التوثيق باللغة العربية',
        content:
          'هل تعاني من ندرة المراجع التقنية المتخصصة بلغتك الأم؟ قمنا بترجمة [YOUR NUMBER] وثيقة تقنية خلال هذا الشهر لخدمة مجتمع المصادر المفتوحة.',
      },
    ],
    platforms: ['reddit', 'facebook'],
    brief: 'إطلاق هاكاثون مجتمعي للمطورين لتطوير أدوات مفتوحة المصدر.',
    expectedLanguage: 'ar',
    expectedPlaceholders: ['[YOUR NUMBER]', '[DATE]'],
  },
  {
    id: 'creative-director-en',
    name: 'Creative Director (English)',
    profile: {
      role: 'Executive Creative Director',
      primaryLanguage: 'en',
      arabicDialect: 'none',
      identityData: {
        role: 'Executive Creative Director',
        industry: 'Brand Identity & Visual Design Systems',
        expertise: ['Typography', 'Generative Design', 'Design Systems at Scale'],
        positioning: 'Design is not decoration; it is the visual expression of organizational discipline.',
      },
      principlesData: {
        values: ['Craftsmanship', 'Originality', 'Accessible beauty'],
        topicsToAvoid: ['Lazy trend-chasing', 'Homogenized template design'],
        toneRedLines: ['No generic agency fluff', 'No design elitism'],
      },
      audienceData: {
        persona: 'Founders, VP of Design, creative leads, and product thinkers',
        expertiseLevel: 'intermediate',
        interests: ['Brand durability', 'Editorial aesthetics', 'Tactile interfaces'],
      },
      styleData: {
        formality: 3,
        length: 'short',
        emoji: 'minimal',
        hookStyle: 'contrarian',
      },
    },
    samples: [
      {
        title: 'Homogenized websites',
        content:
          'When every SaaS hero section uses the same rounded purple gradient and 3D clay hand, you have not built a modern brand — you have bought a camouflage kit.',
      },
    ],
    platforms: ['instagram', 'linkedin'],
    brief: 'Why physical brand books still matter in an age of automated design tokens.',
    expectedLanguage: 'en',
    expectedPlaceholders: ['[YEARS]', '[TOOL]'],
  },
  {
    id: 'algerian-tech-lead-darija',
    name: 'Algerian Tech Lead (Arabic - Darija)',
    profile: {
      role: 'قائد تقني ومؤسس',
      primaryLanguage: 'ar',
      arabicDialect: 'darija',
      identityData: {
        role: 'Lead Developer & Tech Founder',
        industry: 'Algerian Startup Ecosystem & Cloud Engineering',
        expertise: ['Fullstack Architecture', 'Cloud Deployment in North Africa', 'Fintech Algeria'],
        positioning: 'بناء مشاريع تقنية متينة ومربحة من الجزائر نحو العالم.',
      },
      principlesData: {
        values: ['الواقعية في البناء', 'حل مشاكل الدفع المحلية', 'مشاركة التجربة الحقيقية'],
        topicsToAvoid: ['بيع الوهم', 'دورات الربح السريع'],
        toneRedLines: ['عدم التكلف', 'تجنب الكلام النظري الفارغ'],
      },
      audienceData: {
        persona: 'المطورون الجزائريون، أصحاب المشاريع الناشئة والمهندسون الشباب',
        expertiseLevel: 'intermediate',
        interests: ['بوابات الدفع الجزائرية', 'العمل عن بعد', 'بناء الـ MVP'],
      },
      styleData: {
        formality: 3,
        length: 'medium',
        emoji: 'tasteful',
        hookStyle: 'bold_statement',
      },
    },
    samples: [
      {
        title: 'الـ MVP والواقع الجزائري',
        content:
          'كي تبدا مشروعك في الجزائر، ما تبقاش تخمم في [YOUR NUMBER] سيرفور قبل ما تجيب أول كليون يخلصك ببطاقة ذهبية. ابدا ساهل واربح وقتك.',
      },
    ],
    platforms: ['x', 'linkedin'],
    brief: 'تجربتنا في إطلاق منصة سحابية محلية بالاعتماد على بنية تحتية سريعة.',
    expectedLanguage: 'ar',
    expectedPlaceholders: ['[YOUR NUMBER]', '[PERCENTAGE]'],
  },
];
