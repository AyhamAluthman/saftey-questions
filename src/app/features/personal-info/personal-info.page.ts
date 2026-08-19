import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personal-info-page',
  imports: [FormsModule],
  templateUrl: './personal-info.page.html',
  styleUrl: './personal-info.page.css'
})
export class PersonalInfoPage {
  private readonly router = inject(Router);

  protected readonly isNameDialogOpen = signal(false);
  protected participantName = '';

  protected openNameDialog(): void {
    this.isNameDialogOpen.set(true);
  }

  protected closeNameDialog(): void {
    this.isNameDialogOpen.set(false);
  }

  protected startTest(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    sessionStorage.setItem('safety-test-participant-name', this.participantName.trim());
    this.closeNameDialog();
    void this.router.navigate(['/questions']);
  }

  @HostListener('document:keydown.escape')
  protected closeDialogWithEscape(): void {
    if (this.isNameDialogOpen()) {
      this.closeNameDialog();
    }
  }
}
