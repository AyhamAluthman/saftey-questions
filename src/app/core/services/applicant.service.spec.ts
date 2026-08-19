import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ApplicantService } from './applicant.service';

describe('ApplicantService', () => {
  let service: ApplicantService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ApplicantService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('checks an applicant by name', () => {
    service.checkByName('محمد أحمد').subscribe((response) => {
      expect(response).toEqual({ data: null });
    });

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${baseUrl}/api/applicants/check` &&
        candidate.params.get('name') === 'محمد أحمد'
    );

    expect(request.request.method).toBe('GET');
    request.flush({ data: null });
  });
});
