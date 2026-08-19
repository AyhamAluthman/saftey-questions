import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApplicantCheckResponse } from '../models/applicant.model';

@Injectable({ providedIn: 'root' })
export class ApplicantService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl.replace(/\/$/, '')}/api/applicants/check`;

  checkByName(name: string): Observable<ApplicantCheckResponse> {
    const params = new HttpParams().set('name', name);

    return this.http.get<ApplicantCheckResponse>(this.endpoint, { params });
  }
}
