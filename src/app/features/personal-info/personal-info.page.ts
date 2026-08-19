import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';

import { ApplicantService } from '../../core/services/applicant.service';

@Component({
  selector: 'app-personal-info-page',
  imports: [FormsModule],
  templateUrl: './personal-info.page.html',
  styleUrl: './personal-info.page.css'
})
export class PersonalInfoPage {
  private readonly router = inject(Router);
  private readonly applicantService = inject(ApplicantService);

  protected readonly isNameDialogOpen = signal(false);
  protected readonly isCheckingName = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected participantName = '';

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
          this.isNameDialogOpen.set(false);

          if (response.data) {
            sessionStorage.removeItem('safety-test-answers');
            sessionStorage.removeItem('safety-test-questions');
            sessionStorage.setItem('safety-test-result', JSON.stringify(response.data));
            sessionStorage.setItem('safety-test-result-source', 'existing');
            void this.router.navigate(['/result']);
            return;
          }

          sessionStorage.removeItem('safety-test-result');
          sessionStorage.removeItem('safety-test-result-source');
          void this.router.navigate(['/questions']);
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
