import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-questionnaire-page',
  imports: [RouterLink],
  template: `
    <main class="grid min-h-dvh place-items-center bg-stone-50 p-5 text-center" dir="rtl">
      <section class="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg">
        <p class="mb-2 text-sm font-bold text-[#8a6f1f]">اختبار السلامة</p>
        <h1 class="text-2xl font-black text-primary">تم تسجيل اسمك بنجاح</h1>
        <p class="mt-3 leading-7 text-slate-600">ستُضاف أسئلة الاختبار في الخطوة التالية.</p>
        <a routerLink="/" class="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-white">
          العودة إلى المقدمة
        </a>
      </section>
    </main>
  `
})
export class QuestionnairePage {}
