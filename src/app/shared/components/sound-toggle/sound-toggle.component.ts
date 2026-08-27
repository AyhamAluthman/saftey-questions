import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-sound-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="sound-toggle"
      [attr.aria-pressed]="sound.enabled()"
      [attr.aria-label]="sound.enabled() ? 'كتم الأصوات' : 'تشغيل الأصوات'"
      (click)="sound.toggle()"
    >
      @if (sound.enabled()) {
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 9v6H6l-3 3V6l3 3h3Zm4 1.5a3.5 3.5 0 0 1 0 3M16 8a6 6 0 0 1 0 8" />
        </svg>
        <span>صوت</span>
      } @else {
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 9v6H6l-3 3V6l3 3h3Zm10.5-2.5-7 7M12.5 9.5 19.5 16.5" />
        </svg>
        <span>صامت</span>
      }
    </button>
  `,
  styles: `
    .sound-toggle {
      display: inline-flex;
      min-height: 2.15rem;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid rgb(0 38 35 / 12%);
      border-radius: 999px;
      background: rgb(255 255 255 / 92%);
      padding: 0.4rem 0.85rem;
      color: #002623;
      font-size: 0.8rem;
      font-weight: 800;
      box-shadow: 0 6px 18px rgb(0 38 35 / 8%);
    }

    .sound-toggle:focus-visible {
      outline: 3px solid rgb(0 38 35 / 18%);
      outline-offset: 2px;
    }

    svg {
      width: 1.1rem;
      height: 1.1rem;
    }
  `
})
export class SoundToggleComponent {
  protected readonly sound = inject(SoundService);
}
