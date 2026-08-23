import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  viewChild
} from '@angular/core';

import { AnimationService } from '../../services/animation.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  kind: 'spark' | 'star' | 'ribbon' | 'streamer';
  delay: number;
  length: number;
  wave: number;
  phase: number;
}

const COLORS = [
  '#ff4d6d',
  '#ff9e00',
  '#ffd166',
  '#c9b36e',
  '#fff4c4',
  '#06d6a0',
  '#4cc9f0',
  '#4895ef',
  '#f72585',
  '#7b2cbf',
  '#ffffff'
];

@Component({
  selector: 'app-confetti-burst',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="confetti-canvas" aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 30;
      pointer-events: none;
    }

    .confetti-canvas {
      width: 100%;
      height: 100%;
    }
  `
})
export class ConfettiBurstComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly animationService = inject(AnimationService);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly active = input(false);
  readonly intensity = input<'normal' | 'high'>('high');

  private frame = 0;
  private startedAt = 0;
  private particles: Particle[] = [];

  constructor() {
    afterNextRender(() => this.maybeStart());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }

  private maybeStart(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.active() ||
      this.animationService.prefersReducedMotion()
    ) {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = (canvas.width = window.innerWidth * (window.devicePixelRatio > 1 ? 1.25 : 1));
    const height = (canvas.height = window.innerHeight * (window.devicePixelRatio > 1 ? 1.25 : 1));
    const count = this.intensity() === 'high' ? 118 : 78;
    this.particles = this.createFireworks(width, height, count);
    this.startedAt = performance.now();
    this.tick(context, width, height);
  }

  private createFireworks(width: number, height: number, count: number): Particle[] {
    const origins = [
      { x: width * 0.18, y: height * 0.28, delay: 0 },
      { x: width * 0.82, y: height * 0.24, delay: 180 },
      { x: width * 0.5, y: height * 0.16, delay: 360 },
      { x: width * 0.32, y: height * 0.42, delay: 520 },
      { x: width * 0.68, y: height * 0.4, delay: 680 }
    ];

    return Array.from({ length: count }, (_, index) => {
      const origin = origins[index % origins.length] ?? origins[0];
      const angle = (Math.PI * 2 * index) / 16 + Math.random() * 0.8;
      const speed = 2.2 + Math.random() * 5.4;
      const kinds: Particle['kind'][] = ['streamer', 'streamer', 'ribbon', 'spark', 'star'];

      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        size: Math.random() * 7 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#c9b36e',
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 14,
        kind: kinds[index % kinds.length] ?? 'streamer',
        delay: origin.delay + Math.random() * 90,
        length: 22 + Math.random() * 28,
        wave: 5 + Math.random() * 8,
        phase: Math.random() * Math.PI * 2
      };
    });
  }

  private tick(context: CanvasRenderingContext2D, width: number, height: number): void {
    const elapsed = performance.now() - this.startedAt;
    context.clearRect(0, 0, width, height);

    for (const particle of this.particles) {
      if (elapsed < particle.delay) {
        continue;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.kind === 'streamer' ? 0.07 : 0.055;
      particle.vx *= 0.992;
      particle.rotation += particle.vr;
      particle.phase += 0.18;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate((particle.rotation * Math.PI) / 180);
      context.globalAlpha = Math.max(0, 1 - (elapsed - particle.delay) / 2200);
      context.fillStyle = particle.color;
      context.strokeStyle = particle.color;

      if (particle.kind === 'spark') {
        context.fillRect(-1.2, -particle.size, 2.4, particle.size * 1.8);
      } else if (particle.kind === 'star') {
        this.drawStar(context, particle.size * 0.55);
      } else if (particle.kind === 'streamer') {
        this.drawStreamer(context, particle);
      } else {
        context.fillRect(-particle.size / 2, -particle.size / 5, particle.size, particle.size / 2.4);
      }

      context.restore();
    }

    if (elapsed < 2400) {
      this.frame = requestAnimationFrame(() => this.tick(context, width, height));
    } else {
      context.clearRect(0, 0, width, height);
    }
  }

  private drawStreamer(context: CanvasRenderingContext2D, particle: Particle): void {
    context.beginPath();
    context.lineWidth = Math.max(2.4, particle.size * 0.42);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.moveTo(0, 0);

    for (let step = 1; step <= 10; step++) {
      const progress = step / 10;
      const x = Math.sin(progress * Math.PI * 3 + particle.phase) * particle.wave;
      const y = progress * particle.length;
      context.lineTo(x, y);
    }

    context.stroke();
  }

  private drawStar(context: CanvasRenderingContext2D, radius: number): void {
    context.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.fill();
  }
}
