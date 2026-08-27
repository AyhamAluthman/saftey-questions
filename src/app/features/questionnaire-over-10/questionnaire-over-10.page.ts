import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
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

@Component({
  selector: 'app-questionnaire-over-10-page',
  templateUrl: './questionnaire-over-10.page.html',
  styleUrl: './questionnaire-over-10.page.css'
})
export class QuestionnaireOver10Page implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly questions = signal<QuestionnaireItem[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly validationMessage = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly participantAge = signal(11);

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
  protected readonly participantName = signal('المتقدم');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.participantName.set(
      sessionStorage.getItem('safety-test-participant-name')?.trim() || 'المتقدم'
    );
    const storedAge = Number(sessionStorage.getItem('safety-test-participant-age'));
    if (Number.isInteger(storedAge) && storedAge > 0) {
      this.participantAge.set(storedAge);
    }
    this.loadQuestions();
  }

  protected loadQuestions(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.quizService
      .getAllQuestions(this.participantAge())
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
  }

  protected isSelected(questionId: number, optionIndex: number): boolean {
    return this.answers()[questionId] === optionIndex;
  }

  protected previousQuestion(): void {
    if (!this.isFirstQuestion() && !this.isSubmitting()) {
      this.currentIndex.update((index) => index - 1);
      this.validationMessage.set(null);
      this.scrollToTop();
    }
  }

  protected nextQuestion(): void {
    if (!this.hasCurrentAnswer()) {
      this.validationMessage.set('اختر إجابة واحدة للمتابعة.');
      return;
    }

    if (!this.isLastQuestion()) {
      this.currentIndex.update((index) => index + 1);
      this.validationMessage.set(null);
      this.scrollToTop();
    }
  }

  protected finishTest(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (!this.hasCurrentAnswer()) {
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
          void this.router.navigate(['/result-over-10']);
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

  private hasCurrentAnswer(): boolean {
    const question = this.currentQuestion();
    return question !== null && this.answers()[question.id] !== undefined;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
