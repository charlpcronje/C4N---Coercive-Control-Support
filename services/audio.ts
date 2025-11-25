
const TTS_API_URL = 'https://talk.api.webally.co.za/speak';

interface AudioState {
  isPlaying: boolean;
  currentId: string | null;
  isLoading: boolean;
}

type Listener = (state: AudioState) => void;

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private state: AudioState = { isPlaying: false, currentId: null, isLoading: false };
  private listeners: Set<Listener> = new Set();

  // On-screen debug display
  private showDebug(message: string, isError: boolean = false) {
    const existing = document.getElementById('audio-debug');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'audio-debug';
    div.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#dc2626' : '#10b981'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      max-width: 90%;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 5000);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: Partial<AudioState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Toggles audio for a specific ID.
   * If the ID is currently playing, it pauses.
   * If the ID is currently paused, it resumes.
   * If a different ID is playing, it stops the old one and starts the new one.
   */
  async toggle(id: string, text: string, voice: string = 'nova'): Promise<void> {
    // Case 1: Toggle Play/Pause for current item
    if (this.state.currentId === id) {
      if (this.state.isLoading) return; // Prevent multiple clicks while loading

      if (this.state.isPlaying) {
        this.audio?.pause();
        this.setState({ isPlaying: false });
      } else {
        // Resume if audio object exists
        if (this.audio) {
          try {
            await this.audio.play();
            this.setState({ isPlaying: true });
          } catch (err) {
            console.error("Failed to resume audio", err);
            this.stop(); // Reset if resume fails
          }
        } else {
          // Audio object missing (shouldn't happen if ID matches, but safety fallback)
          await this.playNew(id, text, voice);
        }
      }
      return;
    }

    // Case 2: Play new item (Stop previous if any)
    await this.playNew(id, text, voice);
  }

  private async playNew(id: string, text: string, voice: string) {
    this.stop(); // Clean up previous
    this.setState({ currentId: id, isLoading: true });

    try {
      this.showDebug('Loading...');

      // Use the whitelisted domain that ends with .webally.co.za
      const domain = window.location.hostname.endsWith('.webally.co.za')
        ? window.location.hostname
        : 'real.nade.webally.co.za';

      const requestBody = {
        text,
        voice,
        domain
      };

      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorDetail = `${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorDetail += `: ${errorData.error}`;
          if (errorData.message) errorDetail += ` - ${errorData.message}`;
        } catch (e) {
          // Error response wasn't JSON
        }
        throw new Error(`API Error: ${errorDetail}`);
      }

      const result = await response.json();
      let audioUrl = result.audio_url;

      if (!audioUrl) {
        throw new Error('No audio_url in API response');
      }

      if (!audioUrl.startsWith('http')) {
        audioUrl = 'https://talk.api.webally.co.za' + (audioUrl.startsWith('/') ? '' : '/') + audioUrl;
      }

      this.audio = new Audio(audioUrl);

      this.audio.addEventListener('ended', () => {
        this.setState({ isPlaying: false, currentId: null });
        this.audio = null;
      });

      this.audio.addEventListener('error', (e) => {
        const target = e.target as HTMLAudioElement;
        let errorMsg = 'Audio playback failed';
        if (target && target.error) {
          const codes: Record<number, string> = {
            1: 'ABORTED',
            2: 'NETWORK ERROR',
            3: 'DECODE ERROR',
            4: 'FORMAT NOT SUPPORTED'
          };
          errorMsg = `Audio Error: ${codes[target.error.code] || target.error.code}`;
        }
        this.showDebug(errorMsg, true);
        this.setState({ isPlaying: false, currentId: null, isLoading: false });
        this.audio = null;
      });

      await this.audio.play();
      // Remove the loading message once playing starts
      const debugElement = document.getElementById('audio-debug');
      if (debugElement) debugElement.remove();

      this.setState({ isPlaying: true, isLoading: false });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.showDebug(`Error: ${errorMsg}`, true);
      this.setState({ isPlaying: false, currentId: null, isLoading: false });
      this.audio = null;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.setState({ isPlaying: false, currentId: null, isLoading: false });
  }
}

export const audioService = new AudioService();
