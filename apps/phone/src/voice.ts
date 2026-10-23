export class Voice {
  private enabled = 'speechSynthesis' in window;

  unlock() {
    if (!this.enabled) return;
    speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  }

  say(text: string) {
    if (!this.enabled) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    speechSynthesis.speak(utterance);
  }
}
