import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, take } from 'rxjs';

import { clearQuizProgress, readQuizProgress } from '../../core/models/quiz-progress';
import { ApplicantService } from '../../core/services/applicant.service';
import { AmbientFieldComponent } from '../../shared/components/ambient-field/ambient-field.component';
import { BrandHeaderComponent } from '../../shared/components/brand-header/brand-header.component';
import { SafetyAnimationComponent } from '../../shared/components/safety-animation/safety-animation.component';

@Component({
  selector: 'app-personal-info-page',
  imports: [FormsModule, BrandHeaderComponent, SafetyAnimationComponent, AmbientFieldComponent],
  templateUrl: './personal-info.page.html',
  styleUrl: './personal-info.page.css'
})
export class PersonalInfoPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly applicantService = inject(ApplicantService);

  protected readonly isNameDialogOpen = signal(false);
  protected readonly isCheckingName = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected participantName = '';
  protected participantAge: number | null = null;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('restart') === '1') {
      this.participantName = '';
      this.participantAge = null;
      this.openNameDialog();
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  protected openNameDialog(): void {
    this.requestError.set(null);
    this.isNameDialogOpen.set(true);
  }

  protected closeNameDialog(): void {
    if (this.isCheckingName()) {
      return;
    }

    this.isNameDialogOpen.set(false);
  }

  protected startTest(form: NgForm): void {
    if (form.invalid || this.isCheckingName()) {
      form.control.markAllAsTouched();
      return;
    }

    const name = this.participantName.trim();
    const age = Number(this.participantAge);

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      this.requestError.set('يرجى إدخال عمر صحيح بين سنة واحدة و120 سنة.');
      return;
    }

    this.requestError.set(null);
    this.isCheckingName.set(true);

    this.applicantService
      .checkByName(name)
      .pipe(
        take(1),
        finalize(() => this.isCheckingName.set(false))
      )
      .subscribe({
        next: (response) => {
          sessionStorage.setItem('safety-test-participant-name', name);
          sessionStorage.setItem('safety-test-participant-age', String(age));
          this.isNameDialogOpen.set(false);

          if (response.data) {
            sessionStorage.removeItem('safety-test-answers');
            sessionStorage.removeItem('safety-test-questions');
            sessionStorage.setItem('safety-test-result', JSON.stringify(response.data));
            sessionStorage.setItem('safety-test-result-source', 'existing');
            clearQuizProgress();
            void this.router.navigate([age <= 10 ? '/result' : '/result-over-10']);
            return;
          }

          sessionStorage.removeItem('safety-test-result');
          sessionStorage.removeItem('safety-test-result-source');
          const storedProgress = readQuizProgress();
          if (
            storedProgress &&
            (storedProgress.participantName !== name || storedProgress.participantAge !== age)
          ) {
            clearQuizProgress();
          }
          void this.router.navigate([age <= 10 ? '/questions' : '/questions-over-10']);
        },
        error: () => {
          this.requestError.set('تعذر التحقق من الاسم. يرجى التأكد من الاتصال والمحاولة مرة أخرى.');
        }
      });
  }

  @HostListener('document:keydown.escape')
  protected closeDialogWithEscape(): void {
    if (this.isNameDialogOpen()) {
      this.closeNameDialog();
    }
  }
}
