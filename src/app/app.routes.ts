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
  {
    path: 'result',
    loadComponent: () =>
      import('./features/result/result.page').then(
        (component) => component.ResultPage
      )
  },
  {
    path: 'questions-over-10',
    loadComponent: () =>
      import('./features/questionnaire-over-10/questionnaire-over-10.page').then(
        (component) => component.QuestionnaireOver10Page
      )
  },
  {
    path: 'result-over-10',
    loadComponent: () =>
      import('./features/result-over-10/result-over-10.page').then(
        (component) => component.ResultOver10Page
      )
  },
  { path: '**', redirectTo: '' }
];
