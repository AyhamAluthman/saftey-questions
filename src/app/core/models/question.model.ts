export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface QuizCategory {
  id: number;
  name: string;
  slug: string;
  questions: QuizQuestion[];
}

export interface FullQuizResponse {
  data: QuizCategory[];
}

export interface QuestionnaireItem extends QuizQuestion {
  categoryName: string;
  categorySlug: string;
}

export interface QuizAnswer {
  question_id: number;
  selected_option: number;
}
