interface AnalyticsEvent {
  media_id: string;
  user_name: string;
  event_type: 'progress' | 'view' | 'play' | 'pause' | 'ended' | 'seek';
  position?: number;
  percentage?: number;
  timestamp: string;
  view_duration?: number;
  repeat_count: number;
  session_id: string;
  enlargement: number;
  chapter_id?: string;
  media_progress?: number;
  timestamp_end?: string;
  ip_address?: string;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();
  private seekTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private sessionIds: Map<string, string> = new Map();
  private readonly SYNC_INTERVAL = 20000; // 20 seconds
  private readonly PROGRESS_INTERVAL = 10000; // 10 seconds
  private readonly SEEK_DEBOUNCE = 2000; // 2 seconds
  private readonly USER_NAME = 'app';
  private readonly STORAGE_KEY = 'analytics_queue';

  constructor() {
    this.loadQueueFromStorage();
    this.startSync();
  }

  private loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics queue', error);
    }
  }

  private saveQueueToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save analytics queue', error);
    }
  }

  private startSync() {
    this.syncInterval = setInterval(() => {
      this.syncToServer();
    }, this.SYNC_INTERVAL);
  }

  private async syncToServer() {
    if (this.queue.length === 0) return;

    try {
      const events = [...this.queue];
      const response = await fetch('/analytics.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (response.ok) {
        // Remove synced events from queue
        this.queue = this.queue.slice(events.length);
        this.saveQueueToStorage();
      }
    } catch (error) {
      console.error('Failed to sync analytics', error);
      // Keep events in queue for next sync attempt
    }
  }

  private getSessionId(mediaId: string): string {
    const key = `${mediaId}-${this.USER_NAME}`;
    if (!this.sessionIds.has(key)) {
      this.sessionIds.set(key, `${key}-${Date.now()}`);
    }
    return this.sessionIds.get(key)!;
  }

  private addEvent(event: Omit<AnalyticsEvent, 'user_name' | 'timestamp' | 'repeat_count' | 'enlargement'>) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      user_name: this.USER_NAME,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      repeat_count: 0,
      enlargement: 0,
    };

    this.queue.push(fullEvent);
    this.saveQueueToStorage();
  }

  // Track section view
  trackView(mediaId: string) {
    this.addEvent({
      media_id: mediaId,
      event_type: 'view',
      session_id: this.getSessionId(mediaId),
    });
  }

  // Track play event
  trackPlay(mediaId: string, position: number, percentage: number) {
    this.addEvent({
      media_id: mediaId,
      event_type: 'play',
      position,
      percentage,
      session_id: this.getSessionId(mediaId),
    });
  }

  // Track pause event
  trackPause(mediaId: string, position: number, percentage: number) {
    this.addEvent({
      media_id: mediaId,
      event_type: 'pause',
      position,
      percentage,
      session_id: this.getSessionId(mediaId),
    });
  }

  // Track ended event
  trackEnded(mediaId: string) {
    this.addEvent({
      media_id: mediaId,
      event_type: 'ended',
      session_id: this.getSessionId(mediaId),
    });

    // Stop progress tracking
    this.stopProgressTracking(mediaId);
  }

  // Track seek event (debounced)
  trackSeek(mediaId: string, position: number, percentage: number) {
    const timeoutKey = `seek-${mediaId}`;

    // Clear existing timeout
    if (this.seekTimeouts.has(timeoutKey)) {
      clearTimeout(this.seekTimeouts.get(timeoutKey)!);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.addEvent({
        media_id: mediaId,
        event_type: 'seek',
        position,
        percentage,
        session_id: this.getSessionId(mediaId),
      });
      this.seekTimeouts.delete(timeoutKey);
    }, this.SEEK_DEBOUNCE);

    this.seekTimeouts.set(timeoutKey, timeout);
  }

  // Start progress tracking (every 10 seconds)
  startProgressTracking(mediaId: string, getCurrentPosition: () => number, getDuration: () => number) {
    // Stop existing tracking if any
    this.stopProgressTracking(mediaId);

    const interval = setInterval(() => {
      const position = getCurrentPosition();
      const duration = getDuration();

      if (duration > 0) {
        this.addEvent({
          media_id: mediaId,
          event_type: 'progress',
          session_id: this.getSessionId(mediaId),
        });
      }
    }, this.PROGRESS_INTERVAL);

    this.progressIntervals.set(mediaId, interval);
  }

  // Stop progress tracking
  stopProgressTracking(mediaId: string) {
    const interval = this.progressIntervals.get(mediaId);
    if (interval) {
      clearInterval(interval);
      this.progressIntervals.delete(mediaId);
    }
  }

  // Track image enlargement
  trackImageEnlargement(mediaId: string) {
    this.addEvent({
      media_id: mediaId,
      event_type: 'view',
      session_id: this.getSessionId(mediaId),
      enlargement: 1,
    });
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.progressIntervals.forEach(interval => clearInterval(interval));
    this.seekTimeouts.forEach(timeout => clearTimeout(timeout));
    this.syncToServer(); // Final sync
  }
}

export const analyticsService = new AnalyticsService();
