import { QuizAnswer } from './question.model';

export interface SubmitQuizRequest {
  applicant_name: string;
  answers: QuizAnswer[];
}

export interface QuizQuestionResult {
  question_id: number;
  is_correct: boolean;
  correct_option: number;
  explanation: string;
}

export interface QuizResult {
  attempt_id: number;
  applicant_name: string;
  taken_at: string;
  score: number;
  total: number;
  percentage: number;
  results: QuizQuestionResult[];
}
