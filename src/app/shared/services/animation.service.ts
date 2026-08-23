import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  AchievementBadge,
  AnimationType,
  CategoryVisual,
  ENCOURAGEMENT_MESSAGES,
  LOTTIE_ASSETS,
  ResultTheme,
  SUCCESS_MESSAGES
} from '../models/animation-type';

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  energy: { slug: 'energy', type: 'electricity', label: 'الطاقة', icon: 'lightning' },
  electricity: { slug: 'electricity', type: 'electricity', label: 'الكهرباء', icon: 'lightning' },
  electric: { slug: 'electric', type: 'electricity', label: 'الكهرباء', icon: 'lightning' },
  power: { slug: 'power', type: 'electricity', label: 'الطاقة', icon: 'lightning' },
  water: { slug: 'water', type: 'water', label: 'المياه', icon: 'drop' },
  environment: { slug: 'environment', type: 'environment', label: 'البيئة', icon: 'leaf' },
  eco: { slug: 'eco', type: 'environment', label: 'البيئة', icon: 'leaf' },
  nature: { slug: 'nature', type: 'environment', label: 'البيئة', icon: 'leaf' },
  safety: { slug: 'safety', type: 'safety', label: 'السلامة', icon: 'shield' },
  hse: { slug: 'hse', type: 'safety', label: 'السلامة', icon: 'shield' },
  fire: { slug: 'fire', type: 'fire', label: 'الحرائق', icon: 'flame' },
  emergency: { slug: 'emergency', type: 'fire', label: 'الطوارئ', icon: 'flame' },
  warning: { slug: 'warning', type: 'fire', label: 'الطوارئ', icon: 'flame' },
  road: { slug: 'road', type: 'road', label: 'الطريق', icon: 'road' },
  traffic: { slug: 'traffic', type: 'road', label: 'الطريق', icon: 'road' }
};

const ACHIEVEMENTS: AchievementBadge[] = [
  { id: 'hero', title: 'بطل السلامة', minPercentage: 100 },
  { id: 'expert', title: 'خبير السلامة', minPercentage: 90 },
  { id: 'guardian', title: 'حامي الطاقة', minPercentage: 80 },
  { id: 'friend', title: 'صديق السلامة', minPercentage: 70 },
  { id: 'learner', title: 'متعلم السلامة', minPercentage: 0 }
];

const PROGRESS_MILESTONES = [25, 50, 75];

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: (() => void) | null = null;

  readonly prefersReducedMotion = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (typeof window.matchMedia !== 'function') {
      return;
    }

    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion.set(this.mediaQuery.matches);
    this.mediaListener = () => this.prefersReducedMotion.set(this.mediaQuery?.matches ?? false);
    this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  lottiePath(type: AnimationType): string {
    return LOTTIE_ASSETS[type].path;
  }

  shouldLoop(type: AnimationType): boolean {
    return LOTTIE_ASSETS[type].loop;
  }

  visualForCategory(slug: string | null | undefined): CategoryVisual {
    const key = (slug ?? '').trim().toLowerCase();
    return CATEGORY_VISUALS[key] ?? {
      slug: key || 'safety',
      type: 'safety',
      label: 'السلامة',
      icon: 'shield'
    };
  }

  animationForCategory(slug: string | null | undefined): AnimationType {
    return this.visualForCategory(slug).type;
  }

  successMessage(seed = Date.now()): string {
    return SUCCESS_MESSAGES[seed % SUCCESS_MESSAGES.length];
  }

  encouragementMessage(seed = Date.now()): string {
    return ENCOURAGEMENT_MESSAGES[seed % ENCOURAGEMENT_MESSAGES.length];
  }

  achievementFor(percentage: number): AchievementBadge {
    return ACHIEVEMENTS.find((badge) => percentage >= badge.minPercentage) ?? ACHIEVEMENTS[ACHIEVEMENTS.length - 1];
  }

  resultTheme(percentage: number): ResultTheme {
    if (percentage >= 90) {
      return {
        tier: 'excellent',
        title: 'بطل السلامة',
        message: 'أحسنت! أنت قدوة في نشر السلامة. معرفتك اليوم قد تحميك وتحمي الآخرين غداً.',
        voice: 'ممتاز! أصبحت بطل السلامة!',
        imageSrc: '/images/result-excellent.png',
        rangeLabel: '90% فأكثر',
        badgeType: 'achievement',
        celebrate: true
      };
    }

    if (percentage >= 70) {
      return {
        tier: 'good',
        title: 'أداء رائع!',
        message: 'لديك معرفة جيدة بالسلامة، حافظ على هذا المستوى المميز!',
        voice: 'أحسنت! استمر في نشر السلامة!',
        imageSrc: '/images/result-good.png',
        rangeLabel: 'من 70% إلى أقل من 90%',
        badgeType: 'correct',
        celebrate: true
      };
    }

    if (percentage >= 40) {
      return {
        tier: 'average',
        title: 'أنت على الطريق الصحيح',
        message: 'أداؤك جيد، وبإمكانك أن تصبح أفضل. استمر في التعلّم والممارسة.',
        voice: 'أحسنت! استمر في نشر السلامة!',
        imageSrc: '/images/result-average.png',
        rangeLabel: 'من 40% إلى أقل من 70%',
        badgeType: 'thinking',
        celebrate: false
      };
    }

    return {
      tier: 'poor',
      title: 'لا بأس، لنتعلم أكثر',
      message: 'أنت على بداية الطريق، كل معلومة جديدة تجعلك أكثر أماناً.',
      voice: 'لا بأس، لنتعلم أكثر!',
      imageSrc: '/images/result-poor.png',
      rangeLabel: 'أقل من 40%',
      badgeType: 'incorrect',
      celebrate: false
    };
  }

  resultHeadline(percentage: number): string {
    return this.resultTheme(percentage).title;
  }

  resultSubtitle(percentage: number): string {
    return this.resultTheme(percentage).message;
  }

  voiceLine(percentage: number): string {
    return this.resultTheme(percentage).voice;
  }

  shouldCelebrateProgress(previousPercent: number, nextPercent: number): boolean {
    return PROGRESS_MILESTONES.some(
      (milestone) => previousPercent < milestone && nextPercent >= milestone
    );
  }

  shouldConfetti(_percentage = 100): boolean {
    return !this.prefersReducedMotion();
  }

  questionTransitionMs(): number {
    return this.prefersReducedMotion() ? 0 : 280;
  }

  calculatingMs(): number {
    return this.prefersReducedMotion() ? 0 : 1600;
  }
}
