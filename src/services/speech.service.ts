import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  isSpeaking = signal(false);
  currentlySpeakingId = signal<string | null>(null);
  isListening = signal(false);
  speechSupported = signal(typeof window !== 'undefined' && 'speechSynthesis' in window);
  recognitionSupported = signal(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  /**
   * Reads text aloud with natural tone and pitch, ideal for elders and young children.
   */
  speak(text: string, id?: string, lang = 'en-US'): void {
    if (!this.speechSupported()) return;

    // If already speaking this item, toggle stop
    if (this.isSpeaking() && this.currentlySpeakingId() === id) {
      this.stop();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower, calm cadence for clear comprehension
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(lang.slice(0, 2)) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Premium')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.currentlySpeakingId.set(id || 'generic');
    };

    utterance.onend = () => {
      this.isSpeaking.set(false);
      this.currentlySpeakingId.set(null);
    };

    utterance.onerror = () => {
      this.isSpeaking.set(false);
      this.currentlySpeakingId.set(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (this.speechSupported()) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
    this.currentlySpeakingId.set(null);
  }

  /**
   * Dictates speech to text for hands-free living room family collaboration.
   */
  startListening(onResult: (text: string) => void, onError?: (err: string) => void, lang = 'en-US'): void {
    if (!this.recognitionSupported()) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.lang = lang;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      this.recognition.onstart = () => {
        this.isListening.set(true);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onerror = (event: any) => {
        this.isListening.set(false);
        if (onError) onError(event.error || 'Speech recognition error');
      };

      this.recognition.start();
    } catch (e) {
      this.isListening.set(false);
      if (onError) onError((e as Error).message);
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Recognition already stopped or unavailable
      }
      this.isListening.set(false);
    }
  }
}
