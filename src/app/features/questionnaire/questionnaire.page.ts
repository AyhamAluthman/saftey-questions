import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';

import {
  QuestionnaireItem,
  QuizAnswer
} from '../../core/models/question.model';
import { QuizService } from '../../core/services/quiz.service';
import { AnimationType } from '../../shared/models/animation-type';
import { AmbientFieldComponent } from '../../shared/components/ambient-field/ambient-field.component';
import { BrandHeaderComponent } from '../../shared/components/brand-header/brand-header.component';
import { SafetyAnimationComponent } from '../../shared/components/safety-animation/safety-animation.component';
import { AnimationService } from '../../shared/services/animation.service';
import { SoundService } from '../../shared/services/sound.service';

@Component({
  selector: 'app-questionnaire-page',
  imports: [BrandHeaderComponent, SafetyAnimationComponent, AmbientFieldComponent],
  templateUrl: './questionnaire.page.html',
  styleUrl: './questionnaire.page.css'
})
export class QuestionnairePage implements OnInit, OnDestroy {
  private readonly quizService = inject(QuizService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly animationService = inject(AnimationService);
  private readonly soundService = inject(SoundService);

  protected readonly questions = signal<QuestionnaireItem[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly validationMessage = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly transitionState = signal<'enter' | 'leave' | 'idle'>('enter');
  protected readonly justSelected = signal(false);
  protected readonly celebrateProgress = signal(false);
  protected readonly participantName = signal('المتقدم');

  protected readonly currentQuestion = computed(
    () => this.questions()[this.currentIndex()] ?? null
  );
  protected readonly currentNumber = computed(() => this.currentIndex() + 1);
  protected readonly totalQuestions = computed(() => this.questions().length);
  protected readonly progress = computed(() => {
    const total = this.totalQuestions();
    return total === 0 ? 0 : (this.currentNumber() / total) * 100;
  });
  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  protected readonly isFirstQuestion = computed(() => this.currentIndex() === 0);
  protected readonly isLastQuestion = computed(
    () => this.currentIndex() === this.totalQuestions() - 1
  );
  protected readonly hasAnsweredCurrent = computed(() => {
    const question = this.currentQuestion();
    return question !== null && this.answers()[question.id] !== undefined;
  });
  protected readonly categoryVisual = computed(() =>
    this.animationService.visualForCategory(this.currentQuestion()?.categorySlug)
  );
  protected readonly categoryAnimation = computed<AnimationType>(
    () => this.categoryVisual().type
  );

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private selectionTimer: ReturnType<typeof setTimeout> | null = null;
  private celebrateTimer: ReturnType<typeof setTimeout> | null = null;
  private isTransitioning = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.participantName.set(
      sessionStorage.getItem('safety-test-participant-name')?.trim() || 'المتقدم'
    );
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected loadQuestions(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.quizService
      .getAllQuestions()
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          const items = response.data.flatMap((category) =>
            category.questions.map((question) => ({
              ...question,
              categoryName: category.name,
              categorySlug: category.slug
            }))
          );

          if (items.length === 0) {
            this.loadError.set('لا توجد أسئلة متاحة حالياً.');
            return;
          }

          this.questions.set(items);
          this.currentIndex.set(0);
        },
        error: () => {
          this.loadError.set('تعذر تحميل الأسئلة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
        }
      });
  }

  protected selectAnswer(questionId: number, optionIndex: number): void {
    this.answers.update((answers) => ({ ...answers, [questionId]: optionIndex }));
    this.validationMessage.set(null);
    this.submitError.set(null);
    this.justSelected.set(true);
    this.soundService.play('select');

    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
    }

    this.selectionTimer = setTimeout(() => this.justSelected.set(false), 220);
  }

  protected isSelected(questionId: number, optionIndex: number): boolean {
    return this.answers()[questionId] === optionIndex;
  }

  protected previousQuestion(): void {
    if (!this.isFirstQuestion() && !this.isSubmitting()) {
      this.goTo(this.currentIndex() - 1);
    }
  }

  protected nextQuestion(): void {
    if (!this.hasAnsweredCurrent()) {
      this.validationMessage.set('اختر إجابة واحدة للمتابعة.');
      return;
    }

    if (!this.isLastQuestion()) {
      this.goTo(this.currentIndex() + 1);
    }
  }

  protected finishTest(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (!this.hasAnsweredCurrent()) {
      this.validationMessage.set('اختر إجابة واحدة لإنهاء الاختبار.');
      return;
    }

    const completedAnswers: QuizAnswer[] = this.questions().map((question) => ({
      question_id: question.id,
      selected_option: this.answers()[question.id]
    }));

    this.validationMessage.set(null);
    this.submitError.set(null);
    this.isSubmitting.set(true);
    this.soundService.prepare();

    this.quizService
      .submitQuiz({
        applicant_name: this.participantName(),
        answers: completedAnswers
      })
      .pipe(
        take(1),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (result) => {
          sessionStorage.setItem('safety-test-answers', JSON.stringify(completedAnswers));
          sessionStorage.setItem('safety-test-questions', JSON.stringify(this.questions()));
          sessionStorage.setItem('safety-test-result', JSON.stringify(result));
          sessionStorage.removeItem('safety-test-result-source');
          void this.router.navigate(['/result']);
        },
        error: (error: HttpErrorResponse) => {
          const serverMessage =
            typeof error.error?.message === 'string' ? error.error.message : null;
          this.submitError.set(
            serverMessage ??
              'تعذر إرسال الاختبار. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
          );
        }
      });
  }

  private goTo(index: number): void {
    if (this.isTransitioning) {
      return;
    }

    const previousProgress = this.progress();
    const duration = this.animationService.questionTransitionMs();

    if (duration === 0) {
      this.currentIndex.set(index);
      this.validationMessage.set(null);
      this.announceMilestone(previousProgress);
      this.scrollToTop();
      return;
    }

    this.isTransitioning = true;
    this.transitionState.set('leave');

    this.transitionTimer = setTimeout(() => {
      this.currentIndex.set(index);
      this.validationMessage.set(null);
      this.transitionState.set('enter');
      this.isTransitioning = false;
      this.announceMilestone(previousProgress);
      this.scrollToTop();
    }, duration);
  }

  private announceMilestone(previousProgress: number): void {
    if (!this.animationService.shouldCelebrateProgress(previousProgress, this.progress())) {
      return;
    }

    this.celebrateProgress.set(true);
    if (this.celebrateTimer) {
      clearTimeout(this.celebrateTimer);
    }
    this.celebrateTimer = setTimeout(() => this.celebrateProgress.set(false), 600);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: this.animationService.prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  private clearTimers(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
    }
    if (this.celebrateTimer) {
      clearTimeout(this.celebrateTimer);
    }
  }
}
