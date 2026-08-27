import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FullQuizResponse } from '../models/question.model';
import { QuizResult, SubmitQuizRequest } from '../models/quiz-result.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getAllQuestions(age: number): Observable<FullQuizResponse> {
    const params = new HttpParams().set('age', age);

    return this.http.get<FullQuizResponse>(`${this.baseUrl}/api/questions`, { params });
  }

  submitQuiz(request: SubmitQuizRequest): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.baseUrl}/api/quiz/submit`, request);
  }
}
