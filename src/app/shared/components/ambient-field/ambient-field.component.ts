import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-ambient-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!animationService.prefersReducedMotion()) {
      <div class="ambient" aria-hidden="true">
        <span class="spark s1"></span>
        <span class="drop s2"></span>
        <span class="leaf s3"></span>
        <span class="spark s4"></span>
        <span class="drop s5"></span>
        <span class="leaf s6"></span>
      </div>
    }
  `,
  styles: `
    .ambient {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }

    span {
      position: absolute;
      opacity: 0.16;
      filter: blur(0.2px);
    }

    .spark {
      width: 0.45rem;
      height: 0.45rem;
      background: #c9b36e;
      clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
      animation: drift 14s linear infinite;
    }

    .drop {
      width: 0.55rem;
      height: 0.75rem;
      border-radius: 50% 50% 50% 0;
      background: #7fb3c4;
      transform: rotate(-40deg);
      animation: drift 18s linear infinite;
    }

    .leaf {
      width: 0.7rem;
      height: 0.45rem;
      border-radius: 0 70% 30% 70%;
      background: #3d8b6e;
      animation: drift 16s linear infinite;
    }

    .s1 { top: 18%; right: 12%; animation-delay: -2s; }
    .s2 { top: 42%; right: 22%; animation-delay: -6s; }
    .s3 { top: 28%; left: 16%; animation-delay: -4s; }
    .s4 { top: 68%; left: 18%; animation-delay: -8s; }
    .s5 { top: 76%; right: 28%; animation-delay: -3s; }
    .s6 { top: 12%; left: 30%; animation-delay: -10s; }

    @keyframes drift {
      0%,
      100% { transform: translate3d(0, 0, 0) rotate(-40deg); }
      50% { transform: translate3d(-12px, -18px, 0) rotate(-20deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ambient { display: none; }
    }
  `
})
export class AmbientFieldComponent {
  protected readonly animationService = inject(AnimationService);
}
