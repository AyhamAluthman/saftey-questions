import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  QuestionnaireItem,
  QuizAnswer
} from '../../core/models/question.model';
import { QuizResult } from '../../core/models/quiz-result.model';

@Component({
  selector: 'app-result-page',
  imports: [RouterLink],
  templateUrl: './result.page.html',
  styleUrl: './result.page.css'
})
export class ResultPage implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isReady = signal(false);
  protected readonly result = signal<QuizResult | null>(null);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly questions = signal<Record<number, QuestionnaireItem>>({});
  protected readonly isExistingResult = signal(false);

  protected readonly roundedPercentage = computed(() => {
    const percentage = this.result()?.percentage ?? 0;
    return Math.round(percentage * 10) / 10;
  });
  protected readonly circleOffset = computed(() => 100 - this.roundedPercentage());
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

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.restoreResult();
    this.isReady.set(true);
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

  protected clearStoredQuiz(): void {
    sessionStorage.removeItem('safety-test-answers');
    sessionStorage.removeItem('safety-test-questions');
    sessionStorage.removeItem('safety-test-result');
    sessionStorage.removeItem('safety-test-result-source');
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
