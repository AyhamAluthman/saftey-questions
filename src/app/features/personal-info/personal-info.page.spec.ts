import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApplicantService } from '../../core/services/applicant.service';
import { PersonalInfoPage } from './personal-info.page';

describe('PersonalInfoPage', () => {
  const navigate = vi.fn().mockResolvedValue(true);
  const existingResult = {
    attempt_id: 3,
    applicant_name: 'محمد أحمد',
    taken_at: '2026-08-19T10:00:00+00:00',
    score: 10,
    total: 14,
    percentage: 71.4,
    results: [
      {
        question_id: 1,
        is_correct: true,
        correct_option: 1,
        explanation: 'شرح الإجابة.'
      }
    ]
  };
  let applicantData: typeof existingResult | null;

  beforeEach(async () => {
    sessionStorage.clear();
    navigate.mockClear();
    applicantData = existingResult;

    await TestBed.configureTestingModule({
      imports: [PersonalInfoPage],
      providers: [
        {
          provide: ApplicantService,
          useValue: { checkByName: () => of({ data: applicantData }) }
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();
  });

  it('redirects an existing applicant to the stored result', async () => {
    const fixture = TestBed.createComponent(PersonalInfoPage);
    const component = fixture.componentInstance as unknown as {
      participantName: string;
      participantAge: number;
      startTest: (form: NgForm) => void;
    };
    component.participantName = 'محمد أحمد';
    component.participantAge = 25;
    component.startTest({
      invalid: false,
      control: { markAllAsTouched: vi.fn() }
    } as unknown as NgForm);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/result-over-10']);
    expect(sessionStorage.getItem('safety-test-participant-age')).toBe('25');
    expect(sessionStorage.getItem('safety-test-result-source')).toBe('existing');
    expect(JSON.parse(sessionStorage.getItem('safety-test-result') ?? '{}')).toEqual(
      existingResult
    );
  });

  it('starts the current questionnaire for a new applicant aged 10', async () => {
    applicantData = null;
    const fixture = TestBed.createComponent(PersonalInfoPage);
    const component = fixture.componentInstance as unknown as {
      participantName: string;
      participantAge: number;
      startTest: (form: NgForm) => void;
    };
    component.participantName = 'طفل جديد';
    component.participantAge = 10;
    component.startTest({
      invalid: false,
      control: { markAllAsTouched: vi.fn() }
    } as unknown as NgForm);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/questions']);
  });

  it('starts the cloned questionnaire for a new applicant older than 10', async () => {
    applicantData = null;
    const fixture = TestBed.createComponent(PersonalInfoPage);
    const component = fixture.componentInstance as unknown as {
      participantName: string;
      participantAge: number;
      startTest: (form: NgForm) => void;
    };
    component.participantName = 'متقدم جديد';
    component.participantAge = 11;
    component.startTest({
      invalid: false,
      control: { markAllAsTouched: vi.fn() }
    } as unknown as NgForm);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/questions-over-10']);
  });
});
