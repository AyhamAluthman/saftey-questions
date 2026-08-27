export type AnimationType =
  | 'welcome'
  | 'electricity'
  | 'water'
  | 'environment'
  | 'safety'
  | 'correct'
  | 'incorrect'
  | 'thinking'
  | 'achievement'
  | 'trophy'
  | 'calculating'
  | 'fire'
  | 'road';

export type AnimationSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LottieAssetSpec {
  type: AnimationType;
  path: string;
  loop: boolean;
  description: string;
}

/**
 * Local Lottie files expected under public/animations/.
 * The player loads these only if the file exists; otherwise an offline SVG is used.
 *
 * welcome.json       Character + shield + energy/water/environment accents (gentle loop)
 * electricity.json   Lightning / plug (short loop)
 * water.json         Water drop (short loop)
 * environment.json   Leaf / tree (short loop)
 * safety.json        Shield / helmet (short loop)
 * correct.json       Check / success shield (play once)
 * incorrect.json     Soft thinking / gentle alert (play once)
 * thinking.json      Thought / energy charge (short loop)
 * achievement.json   Star / badge (play once)
 * trophy.json        Trophy / filled shield (play once)
 * calculating.json   Shield filling / energy charging (short loop)
 * fire.json          Controlled flame / warning (short loop)
 * road.json          Path / safety sign (short loop)
 */
/** Files shipped with the app. Add a type here after placing its JSON in public/animations/. */
export const AVAILABLE_LOTTIE_FILES: readonly AnimationType[] = [
  'correct',
  'achievement',
  'calculating'
];

export const LOTTIE_ASSETS: Record<AnimationType, LottieAssetSpec> = {
  welcome: {
    type: 'welcome',
    path: '/animations/welcome.json',
    loop: true,
    description: 'بطل السلامة مع درع وعلامة صح وعناصر كهرباء وماء وبيئة'
  },
  electricity: {
    type: 'electricity',
    path: '/animations/electricity.json',
    loop: true,
    description: 'برق أو قابس كهربائي نظيف'
  },
  water: {
    type: 'water',
    path: '/animations/water.json',
    loop: true,
    description: 'قطرة ماء هادئة'
  },
  environment: {
    type: 'environment',
    path: '/animations/environment.json',
    loop: true,
    description: 'ورقة شجر أو شجرة مبسطة'
  },
  safety: {
    type: 'safety',
    path: '/animations/safety.json',
    loop: true,
    description: 'درع أو خوذة مع علامة صح'
  },
  correct: {
    type: 'correct',
    path: '/animations/correct.json',
    loop: false,
    description: 'رسم علامة صح داخل دائرة أو درع'
  },
  incorrect: {
    type: 'incorrect',
    path: '/animations/incorrect.json',
    loop: false,
    description: 'تنبيه لطيف أو شخصية تفكر، دون أسلوب عقابي'
  },
  thinking: {
    type: 'thinking',
    path: '/animations/think.json',
    loop: true,
    description: 'نقاط تفكير أو شحن طاقة خفيف'
  },
  achievement: {
    type: 'achievement',
    path: '/animations/achievement.json',
    loop: false,
    description: 'نجمة أو شارة تظهر بلطف'
  },
  trophy: {
    type: 'trophy',
    path: '/animations/trophy.json',
    loop: false,
    description: 'كأس أو درع مكتمل'
  },
  calculating: {
    type: 'calculating',
    path: '/animations/calculating.json',
    loop: true,
    description: 'امتلاء درع أو شحن طاقة قبل إظهار النتيجة'
  },
  fire: {
    type: 'fire',
    path: '/animations/fire.json',
    loop: true,
    description: 'لهب مبسط أو صفارة إنذار هادئة'
  },
  road: {
    type: 'road',
    path: '/animations/road.json',
    loop: true,
    description: 'إشارة طريق أو مسار آمن'
  }
};

export interface CategoryVisual {
  slug: string;
  type: AnimationType;
  label: string;
  icon: 'lightning' | 'drop' | 'leaf' | 'shield' | 'flame' | 'road';
}

export interface AchievementBadge {
  id: 'friend' | 'guardian' | 'expert' | 'hero' | 'learner';
  title: string;
  minPercentage: number;
}

export type ResultTier = 'poor' | 'average' | 'good' | 'excellent';

export interface ResultTheme {
  tier: ResultTier;
  title: string;
  message: string;
  voice: string;
  imageSrc: string;
  rangeLabel: string;
  badgeType: AnimationType;
  celebrate: boolean;
}

export const SUCCESS_MESSAGES = [
  'ممتاز! تصرّف آمن.',
  'رائع! أنت تعرف كيف تحمي نفسك.',
  'أحسنت يا بطل السلامة.',
  'قرار صحيح. السلامة أولاً.',
  'ممتاز! استمر.'
] as const;

export const ENCOURAGEMENT_MESSAGES = [
  'قريب! لنتعلم التصرف الأكثر أماناً.',
  'لا بأس، المهم أن نعرف التصرف الصحيح.'
] as const;
