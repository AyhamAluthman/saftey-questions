import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/personal-info/personal-info.page').then(
        (component) => component.PersonalInfoPage
      )
  },
  {
    path: 'questions',
    loadComponent: () =>
      import('./features/questionnaire/questionnaire.page').then(
        (component) => component.QuestionnairePage
      )
  },
  { path: '**', redirectTo: '' }
];
