/**
 * Speech abstraction for the AI Mock Interview.
 *
 * Two provider families behind the same interfaces:
 *  - Browser (web): Web Speech APIs -- speechSynthesis for the interviewer's
 *    voice, SpeechRecognition for the candidate's speech-to-text.
 *  - Native (Capacitor on Android/iOS): @capacitor-community/text-to-speech
 *    and @capacitor-community/speech-recognition, because the Android WebView
 *    does not implement the Web Speech APIs.
 *
 * The factories at the bottom pick the provider via Capacitor.isNativePlatform(),
 * so callers (MockInterview.tsx) never branch on platform. Callers must always
 * handle `isSupported === false` -- the interview offers a typed-answer
 * fallback whenever voice is unavailable.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

// ---------------------------------------------------------------- TTS ------

export interface SpeechSynthesizer {
  readonly isSupported: boolean;
  /** Speaks the text; resolves when speech finishes (or immediately if unsupported). */
  speak(text: string): Promise<void>;
  cancel(): void;
}

class BrowserSpeechSynthesizer implements SpeechSynthesizer {
  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    const english = voices.filter(v => v.lang.startsWith('en'));
    // Prefer a natural-sounding English voice when available.
    return (
      english.find(v => /Google|Natural|Neural/i.test(v.name)) ??
      english.find(v => v.default) ??
      english[0] ??
      voices[0]
    );
  }

  speak(text: string): Promise<void> {
    if (!this.isSupported || !text.trim()) return Promise.resolve();
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.pickVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 0.97;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      // Safety net: some engines occasionally drop the end event.
      const safety = setTimeout(() => resolve(), Math.max(4000, text.length * 90));
      utterance.onend = () => {
        clearTimeout(safety);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (this.isSupported) window.speechSynthesis.cancel();
  }
}

// ---------------------------------------------------------------- STT ------

export interface TranscriptUpdate {
  /** Confirmed transcript so far. */
  finalTranscript: string;
  /** Low-confidence, still-changing tail. */
  interimTranscript: string;
}

export interface SpeechTranscriber {
  readonly isSupported: boolean;
  start(onUpdate: (update: TranscriptUpdate) => void, onError: (message: string) => void): void;
  /** Stops listening and returns the final confirmed transcript. */
  stop(): string;
}

type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

class BrowserSpeechTranscriber implements SpeechTranscriber {
  private recognition: any = null;
  private finalTranscript = '';
  private manuallyStopped = false;

  get isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  start(onUpdate: (update: TranscriptUpdate) => void, onError: (message: string) => void): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }
    this.finalTranscript = '';
    this.manuallyStopped = false;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          this.finalTranscript += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      onUpdate({ finalTranscript: this.finalTranscript.trim(), interimTranscript: interim.trim() });
    };

    rec.onerror = (event: any) => {
      // 'no-speech'/'aborted' are routine; only surface real failures.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        onError('Microphone access for speech recognition was denied.');
      } else if (event.error === 'network') {
        onError('Speech recognition needs a network connection.');
      }
    };

    // Recognition engines stop themselves after silence; restart until the
    // caller explicitly stops so long answers are fully captured.
    rec.onend = () => {
      if (!this.manuallyStopped && this.recognition === rec) {
        try {
          rec.start();
        } catch {
          /* already restarted */
        }
      }
    };

    this.recognition = rec;
    try {
      rec.start();
    } catch (err) {
      onError('Could not start speech recognition.');
    }
  }

  stop(): string {
    this.manuallyStopped = true;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* already stopped */
      }
      this.recognition = null;
    }
    return this.finalTranscript.trim();
  }
}

// ------------------------------------------------- native (Capacitor) ------

class NativeSpeechSynthesizer implements SpeechSynthesizer {
  get isSupported(): boolean {
    return true; // TextToSpeech ships with the app on native platforms.
  }

  async speak(text: string): Promise<void> {
    if (!text.trim()) return;
    try {
      await TextToSpeech.speak({ text, lang: 'en-US', rate: 0.97, pitch: 1.0, volume: 1.0 });
    } catch {
      /* engine unavailable on this device -- question text is still shown */
    }
  }

  cancel(): void {
    TextToSpeech.stop().catch(() => undefined);
  }
}

class NativeSpeechTranscriber implements SpeechTranscriber {
  private finalTranscript = '';
  private listenerHandle: { remove: () => Promise<void> } | null = null;

  get isSupported(): boolean {
    return true; // availability is re-checked (with permission prompt) in start().
  }

  start(onUpdate: (update: TranscriptUpdate) => void, onError: (message: string) => void): void {
    this.finalTranscript = '';
    void (async () => {
      try {
        const { available } = await NativeSpeechRecognition.available();
        if (!available) {
          onError('Speech recognition is not available on this device.');
          return;
        }
        const perm = await NativeSpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== 'granted') {
          onError('Microphone access for speech recognition was denied.');
          return;
        }
        this.listenerHandle = await NativeSpeechRecognition.addListener('partialResults', (data: { matches?: string[] }) => {
          const best = data.matches?.[0];
          // The plugin streams the full best-guess transcript so far, not deltas.
          if (best) {
            this.finalTranscript = best;
            onUpdate({ finalTranscript: best, interimTranscript: '' });
          }
        });
        await NativeSpeechRecognition.start({
          language: 'en-US',
          partialResults: true,
          popup: false
        });
      } catch (err) {
        onError('Could not start speech recognition.');
      }
    })();
  }

  stop(): string {
    NativeSpeechRecognition.stop().catch(() => undefined);
    this.listenerHandle?.remove().catch(() => undefined);
    this.listenerHandle = null;
    return this.finalTranscript.trim();
  }
}

// ------------------------------------------------------------- factory -----

const isNative = () => Capacitor.isNativePlatform();

export const createSpeechSynthesizer = (): SpeechSynthesizer =>
  isNative() ? new NativeSpeechSynthesizer() : new BrowserSpeechSynthesizer();
export const createSpeechTranscriber = (): SpeechTranscriber =>
  isNative() ? new NativeSpeechTranscriber() : new BrowserSpeechTranscriber();
