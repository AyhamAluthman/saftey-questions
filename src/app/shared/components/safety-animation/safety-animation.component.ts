import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import type { AnimationItem } from 'lottie-web';

import {
  AnimationSize,
  AnimationType,
  AVAILABLE_LOTTIE_FILES,
  LOTTIE_ASSETS
} from '../../models/animation-type';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-safety-animation',
  templateUrl: './safety-animation.component.html',
  styleUrl: './safety-animation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafetyAnimationComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly animationService = inject(AnimationService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly type = input.required<AnimationType>();
  readonly loop = input<boolean | null>(null);
  readonly autoplay = input(true);
  readonly size = input<AnimationSize>('md');
  readonly label = input('');

  private readonly lottieHost = viewChild<ElementRef<HTMLDivElement>>('lottieHost');

  protected readonly useFallback = signal(true);
  protected readonly reducedMotion = this.animationService.prefersReducedMotion;
  protected readonly accessibleLabel = computed(
    () => this.label() || LOTTIE_ASSETS[this.type()].description
  );

  private readonly viewReady = signal(false);
  private animation: AnimationItem | null = null;
  private observer: IntersectionObserver | null = null;
  private visible = true;
  private loadGeneration = 0;
  private loadedType: AnimationType | null = null;
  private static readonly animationCache = new Map<string, Record<string, unknown>>();

  constructor() {
    afterNextRender(() => this.viewReady.set(true));

    effect(() => {
      this.type();
      if (this.viewReady()) {
        void this.syncPlayer();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
    this.observer?.disconnect();
    this.observer = null;
  }

  private async syncPlayer(): Promise<void> {
    const type = this.type();
    if (this.animation && this.loadedType === type) {
      return;
    }

    const generation = ++this.loadGeneration;

    if (!isPlatformBrowser(this.platformId) || this.reducedMotion()) {
      this.destroyPlayer();
      this.useFallback.set(true);
      return;
    }

    const spec = LOTTIE_ASSETS[type];
    if (!AVAILABLE_LOTTIE_FILES.includes(type)) {
      this.destroyPlayer();
      this.useFallback.set(true);
      return;
    }

    const animationData = await this.loadLocalAnimation(spec.path);
    if (generation !== this.loadGeneration) {
      return;
    }

    if (!animationData) {
      this.destroyPlayer();
      this.useFallback.set(true);
      return;
    }

    const host = this.lottieHost()?.nativeElement;
    if (!host) {
      return;
    }

    try {
      const lottie = (await import('lottie-web')).default;
      if (generation !== this.loadGeneration) {
        return;
      }

      this.useFallback.set(true);
      this.destroyPlayer();

      const animation = lottie.loadAnimation({
        container: host,
        renderer: 'svg',
        loop: this.loop() ?? spec.loop,
        autoplay: this.autoplay() && this.visible,
        animationData
      });
      this.animation = animation;
      this.loadedType = type;

      animation.addEventListener('DOMLoaded', () => {
        if (generation !== this.loadGeneration) {
          return;
        }

        const svg = host.querySelector('svg');
        const drawn = svg?.getBoundingClientRect();
        if (svg && (drawn?.width ?? 0) > 8 && (drawn?.height ?? 0) > 8) {
          this.useFallback.set(false);
        }
      });
      animation.addEventListener('data_failed', () => {
        if (generation === this.loadGeneration) {
          this.destroyPlayer();
          this.useFallback.set(true);
          this.loadedType = null;
        }
      });
      this.observeVisibility();
    } catch {
      if (generation === this.loadGeneration) {
        this.destroyPlayer();
        this.useFallback.set(true);
        this.loadedType = null;
      }
    }
  }

  private async loadLocalAnimation(path: string): Promise<Record<string, unknown> | null> {
    const cached = SafetyAnimationComponent.animationCache.get(path);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        return null;
      }

      const text = await response.text();
      if (!text.trim().startsWith('{')) {
        return null;
      }

      const data = JSON.parse(text) as Record<string, unknown>;
      SafetyAnimationComponent.animationCache.set(path, data);
      return data;
    } catch {
      return null;
    }
  }

  private observeVisibility(): void {
    this.observer?.disconnect();
    if (!this.animation || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.visible = entry?.isIntersecting ?? true;
        if (!this.animation) {
          return;
        }

        if (this.visible && this.autoplay()) {
          this.animation.play();
        } else {
          this.animation.pause();
        }
      },
      { threshold: 0.2 }
    );

    this.observer.observe(this.host.nativeElement);
  }

  private destroyPlayer(): void {
    this.animation?.destroy();
    this.animation = null;
    this.loadedType = null;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const host = this.lottieHost()?.nativeElement;
    if (!host) {
      return;
    }

    if (typeof host.replaceChildren === 'function') {
      host.replaceChildren();
      return;
    }

    host.innerHTML = '';
  }
}
