import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  let service: QuizService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(QuizService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets the complete quiz', () => {
    service.getAllQuestions().subscribe((response) => {
      expect(response.data[0].questions[0].id).toBe(1);
    });

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const request = httpTesting.expectOne(`${baseUrl}/api/questions`);

    expect(request.request.method).toBe('GET');
    request.flush({
      data: [
        {
          id: 1,
          name: 'سلامتك مع الطاقة',
          slug: 'energy',
          questions: [{ id: 1, question: 'سؤال تجريبي', options: ['نعم', 'لا'] }]
        }
      ]
    });
  });

  it('submits all answers with the applicant name', () => {
    const payload = {
      applicant_name: 'محمد أحمد',
      answers: [
        { question_id: 1, selected_option: 1 },
        { question_id: 2, selected_option: 0 }
      ]
    };

    service.submitQuiz(payload).subscribe((response) => {
      expect(response.score).toBe(1);
      expect(response.total).toBe(2);
    });

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const request = httpTesting.expectOne(`${baseUrl}/api/quiz/submit`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      attempt_id: 3,
      applicant_name: 'محمد أحمد',
      taken_at: '2026-08-19T10:00:00+00:00',
      score: 1,
      total: 2,
      percentage: 50,
      results: [
        {
          question_id: 1,
          is_correct: true,
          correct_option: 1,
          explanation: 'شرح الإجابة.'
        }
      ]
    });
  });
});
