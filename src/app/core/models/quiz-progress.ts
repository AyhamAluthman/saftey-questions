export const QUIZ_PROGRESS_KEY = 'safety-test-progress';

export interface QuizProgress {
  participantName: string;
  answers: Record<number, number>;
  currentIndex: number;
}

export function readQuizProgress(): QuizProgress | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_PROGRESS_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as QuizProgress;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.participantName !== 'string' ||
      typeof parsed.currentIndex !== 'number' ||
      typeof parsed.answers !== 'object' ||
      parsed.answers === null
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeQuizProgress(progress: QuizProgress): void {
  sessionStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearQuizProgress(): void {
  sessionStorage.removeItem(QUIZ_PROGRESS_KEY);
}
