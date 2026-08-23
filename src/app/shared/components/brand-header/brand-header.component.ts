import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SoundToggleComponent } from '../sound-toggle/sound-toggle.component';

@Component({
  selector: 'app-brand-header',
  imports: [SoundToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="brand-header">
      <div class="brand-header-inner">
        <img src="/images/header.webp" alt="وزارة الطاقة - Ministry of Energy" />
        @if (showSound()) {
          <div class="sound-slot">
            <app-sound-toggle />
          </div>
        }
      </div>
    </header>
  `,
  styles: `
    .brand-header {
      position: relative;
      z-index: 10;
      border-bottom: 1px solid rgb(0 38 35 / 10%);
      background: rgb(255 255 255 / 90%);
      box-shadow: 0 1px 0 rgb(255 255 255 / 70%);
      backdrop-filter: blur(8px);
    }

    .brand-header-inner {
      position: relative;
      display: flex;
      width: 100%;
      max-width: 56rem;
      justify-content: center;
      margin-inline: auto;
      padding: 0.3rem 1rem;
    }

    img {
      width: 100%;
      max-width: 14rem;
      height: auto;
      max-height: 2.35rem;
      object-fit: contain;
    }

    .sound-slot {
      position: absolute;
      inset-inline-start: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
    }

    @media (max-width: 639px) {
      .sound-slot {
        position: static;
        transform: none;
        margin-inline-end: auto;
      }

      .brand-header-inner {
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      img {
        max-width: 11.5rem;
        max-height: 2.1rem;
      }
    }
  `
})
export class BrandHeaderComponent {
  readonly showSound = input(true);
}
