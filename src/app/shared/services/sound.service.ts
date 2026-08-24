import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { AnimationService } from './animation.service';

export type SoundCue = 'select' | 'correct' | 'achievement' | 'finish' | 'success';

const STORAGE_KEY = 'safety-quiz-sound-enabled';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly animationService = inject(AnimationService);
  private audioContext: AudioContext | null = null;

  readonly enabled = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.enabled.set(window.localStorage.getItem(STORAGE_KEY) !== 'off');
  }

  prepare(): void {
    this.unlock();
    if (typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.getVoices();
    }
  }

  toggle(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const next = !this.enabled();
    this.enabled.set(next);
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');

    if (next) {
      this.unlock();
    } else {
      this.stopSpeech();
    }
  }

  play(cue: SoundCue, options?: { force?: boolean }): void {
    if (!isPlatformBrowser(this.platformId) || this.animationService.prefersReducedMotion()) {
      return;
    }

    if (!this.enabled() && !options?.force) {
      return;
    }

    const context = this.unlock();
    if (!context) {
      return;
    }

    const now = context.currentTime;

    switch (cue) {
      case 'select':
        this.tone(context, now, 620, 0.06, 0.035, 'sine');
        break;
      case 'correct':
        this.tone(context, now, 659, 0.08, 0.04, 'sine');
        this.tone(context, now + 0.08, 880, 0.1, 0.035, 'sine');
        break;
      case 'achievement':
      case 'finish':
      case 'success':
        this.successChime(context, now);
        break;
    }
  }

  speak(text: string, options?: { force?: boolean }): void {
    if (!isPlatformBrowser(this.platformId) || this.animationService.prefersReducedMotion()) {
      return;
    }

    if (!this.enabled() && !options?.force) {
      return;
    }

    if (typeof window.speechSynthesis === 'undefined') {
      return;
    }

    this.stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.04;
    utterance.pitch = 1.18;
    utterance.volume = 0.85;

    const arabicVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith('ar'));

    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeech(): void {
    if (isPlatformBrowser(this.platformId) && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel();
    }
  }

  private unlock(): AudioContext | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    this.audioContext ??= new AudioContextCtor();

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    return this.audioContext;
  }

  private successChime(context: AudioContext, start: number): void {
    this.tone(context, start, 1568, 0.22, 0.05, 'sine');
    this.tone(context, start, 3136, 0.12, 0.012, 'sine');

    this.tone(context, start + 0.28, 1318.5, 0.16, 0.04, 'sine');
    this.tone(context, start + 0.42, 1174.7, 0.16, 0.038, 'sine');

    this.tone(context, start + 0.62, 2093, 0.12, 0.02, 'sine');
    this.tone(context, start + 0.7, 2637, 0.14, 0.016, 'sine');
    this.tone(context, start + 0.78, 3136, 0.18, 0.012, 'sine');

    this.tone(context, start + 0.72, 523.25, 0.38, 0.03, 'sine');
    this.tone(context, start + 0.72, 659.25, 0.38, 0.024, 'sine');
    this.tone(context, start + 0.72, 783.99, 0.42, 0.022, 'sine');
  }

  private tone(
    context: AudioContext,
    start: number,
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType = 'sine'
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
