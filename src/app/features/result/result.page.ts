import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  QuestionnaireItem,
  QuizAnswer
} from '../../core/models/question.model';
import { QuizResult } from '../../core/models/quiz-result.model';
import { AmbientFieldComponent } from '../../shared/components/ambient-field/ambient-field.component';
import { BrandHeaderComponent } from '../../shared/components/brand-header/brand-header.component';
import { ConfettiBurstComponent } from '../../shared/components/confetti-burst/confetti-burst.component';
import { SafetyAnimationComponent } from '../../shared/components/safety-animation/safety-animation.component';
import { AnimationService } from '../../shared/services/animation.service';
import { SoundService } from '../../shared/services/sound.service';

@Component({
  selector: 'app-result-page',
  imports: [
    RouterLink,
    BrandHeaderComponent,
    SafetyAnimationComponent,
    AmbientFieldComponent,
    ConfettiBurstComponent
  ],
  templateUrl: './result.page.html',
  styleUrl: './result.page.css'
})
export class ResultPage implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly animationService = inject(AnimationService);
  private readonly soundService = inject(SoundService);

  protected readonly isReady = signal(false);
  protected readonly phase = signal<'calculating' | 'reveal'>('calculating');
  protected readonly result = signal<QuizResult | null>(null);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly questions = signal<Record<number, QuestionnaireItem>>({});
  protected readonly isExistingResult = signal(false);
  protected readonly showScore = signal(false);
  protected readonly showTrophy = signal(false);
  protected readonly showConfetti = signal(false);
  protected readonly showShield = signal(false);
  protected readonly showHeroTitle = signal(false);

  protected readonly roundedPercentage = computed(() => {
    const percentage = this.result()?.percentage ?? 0;
    return Math.round(percentage * 10) / 10;
  });
  protected readonly circleOffset = computed(() => 100 - this.roundedPercentage());
  protected readonly theme = computed(() =>
    this.animationService.resultTheme(this.roundedPercentage())
  );
  protected readonly achievement = computed(() =>
    this.animationService.achievementFor(this.roundedPercentage())
  );
  protected readonly headline = computed(() => this.theme().title);
  protected readonly subtitle = computed(() => this.theme().message);
  protected readonly formattedDate = computed(() => {
    const takenAt = this.result()?.taken_at;
    if (!takenAt) {
      return '';
    }

    const date = new Date(takenAt);
    if (Number.isNaN(date.getTime())) {
      return takenAt;
    }

    return new Intl.DateTimeFormat('ar-SY', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  });

  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.restoreResult();
    this.isReady.set(true);
    this.scheduleReveal();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.soundService.stopSpeech();
  }

  protected questionText(questionId: number): string {
    return this.questions()[questionId]?.question ?? `السؤال رقم ${questionId}`;
  }

  protected selectedOptionText(questionId: number): string {
    const selectedOption = this.answers()[questionId];
    return this.optionText(questionId, selectedOption);
  }

  protected hasSelectedAnswer(questionId: number): boolean {
    return this.answers()[questionId] !== undefined;
  }

  protected correctOptionText(questionId: number, correctOption: number): string {
    return this.optionText(questionId, correctOption);
  }

  protected scrollToLessons(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.getElementById('learn-safety')?.scrollIntoView({
      behavior: this.animationService.prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  protected clearStoredQuiz(): void {
    sessionStorage.removeItem('safety-test-answers');
    sessionStorage.removeItem('safety-test-questions');
    sessionStorage.removeItem('safety-test-result');
    sessionStorage.removeItem('safety-test-result-source');
    sessionStorage.removeItem('safety-test-participant-name');
  }

  protected startForNextPlayer(): void {
    this.clearStoredQuiz();
    void this.router.navigate(['/'], { queryParams: { restart: '1' } });
  }

  private scheduleReveal(): void {
    const delay = this.result() && !this.isExistingResult() ? this.animationService.calculatingMs() : 0;

    if (delay === 0) {
      this.reveal();
      return;
    }

    this.queue(delay, () => this.reveal());
  }

  private reveal(): void {
    this.phase.set('reveal');

    if (!this.result()) {
      return;
    }

    if (this.isExistingResult() || this.animationService.prefersReducedMotion()) {
      this.showAllQuietly();
      return;
    }

    this.playCelebration();
  }

  private playCelebration(): void {
    this.showScore.set(true);

    this.queue(300, () => this.soundService.play('success', { force: true }));
    this.queue(500, () => this.showTrophy.set(true));
    this.queue(700, () => {
      if (this.theme().celebrate) {
        this.showConfetti.set(true);
      }
    });
    this.queue(1000, () => this.showShield.set(true));
    this.queue(1200, () => this.showHeroTitle.set(true));
    this.queue(1500, () => {
      this.soundService.speak(this.animationService.voiceLine(this.roundedPercentage()), { force: true });
    });
    this.queue(3100, () => this.showConfetti.set(false));
  }

  private showAllQuietly(): void {
    this.showScore.set(true);
    this.showTrophy.set(true);
    this.showShield.set(true);
    this.showHeroTitle.set(true);
  }

  private queue(delay: number, action: () => void): void {
    this.timers.push(setTimeout(action, delay));
  }

  private clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
  }

  private restoreResult(): void {
    try {
      const storedResult = sessionStorage.getItem('safety-test-result');
      const storedAnswers = sessionStorage.getItem('safety-test-answers');
      const storedQuestions = sessionStorage.getItem('safety-test-questions');
      const resultSource = sessionStorage.getItem('safety-test-result-source');

      this.isExistingResult.set(resultSource === 'existing');

      if (storedResult) {
        const parsedResult = JSON.parse(storedResult) as QuizResult;
        if (this.isValidResult(parsedResult)) {
          this.result.set(parsedResult);
        }
      }

      if (storedAnswers) {
        const parsedAnswers = JSON.parse(storedAnswers) as QuizAnswer[];
        this.answers.set(
          Object.fromEntries(
            parsedAnswers.map((answer) => [answer.question_id, answer.selected_option])
          )
        );
      }

      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions) as QuestionnaireItem[];
        this.questions.set(
          Object.fromEntries(parsedQuestions.map((question) => [question.id, question]))
        );
      }
    } catch {
      this.result.set(null);
    }
  }

  private optionText(questionId: number, optionIndex: number | undefined): string {
    if (optionIndex === undefined) {
      return 'غير محدد';
    }

    return this.questions()[questionId]?.options[optionIndex] ?? `الخيار ${optionIndex + 1}`;
  }

  private isValidResult(value: QuizResult): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.applicant_name === 'string' &&
      typeof value.score === 'number' &&
      typeof value.total === 'number' &&
      typeof value.percentage === 'number' &&
      Array.isArray(value.results)
    );
  }
}
