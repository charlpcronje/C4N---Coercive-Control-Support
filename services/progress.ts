interface ProgressData {
  doneItems: Set<string>; // Set of item refs that are done
  starsEarned: number;
  lastMilestone: number;
}

class ProgressService {
  private storageKey = 'progress_data';
  private data: ProgressData = {
    doneItems: new Set(),
    starsEarned: 0,
    lastMilestone: 0,
  };
  private listeners: Set<(data: ProgressData) => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = {
          doneItems: new Set(parsed.doneItems || []),
          starsEarned: parsed.starsEarned || 0,
          lastMilestone: parsed.lastMilestone || 0,
        };
      }
    } catch (error) {
      console.error('Failed to load progress', error);
    }
  }

  private save() {
    try {
      const toSave = {
        doneItems: Array.from(this.data.doneItems),
        starsEarned: this.data.starsEarned,
        lastMilestone: this.data.lastMilestone,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save progress', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getData()));
  }

  subscribe(listener: (data: ProgressData) => void) {
    this.listeners.add(listener);
    listener(this.getData()); // Immediate call with current data
    return () => this.listeners.delete(listener);
  }

  getData(): ProgressData {
    return {
      doneItems: new Set(this.data.doneItems),
      starsEarned: this.data.starsEarned,
      lastMilestone: this.data.lastMilestone,
    };
  }

  isDone(itemRef: string): boolean {
    return this.data.doneItems.has(itemRef);
  }

  markDone(itemRef: string) {
    if (!this.data.doneItems.has(itemRef)) {
      this.data.doneItems.add(itemRef);
      this.save();
    }
  }

  getDoneCount(): number {
    return this.data.doneItems.size;
  }

  getStarsEarned(): number {
    return this.data.starsEarned;
  }

  // Check if we've reached a new milestone and return celebration data
  checkMilestone(totalItems: number): { show: boolean; message: string; starsEarned: number; progress: number } | null {
    // Guard against invalid totalItems
    if (!totalItems || totalItems <= 0 || !isFinite(totalItems)) {
      return null;
    }

    const doneCount = this.getDoneCount();
    const progress = (doneCount / totalItems) * 100;

    // Star 1 at 5 items
    // Stars 2-10: evenly distribute remaining items (totalItems - 5) / 9
    let currentMilestone = 0;

    if (doneCount >= totalItems) {
      // 10th star at 100% completion
      currentMilestone = 10;
    } else if (doneCount >= 5) {
      // First star at 5
      currentMilestone = 1;

      // Distribute stars 2-10 across remaining items
      const remainingItems = totalItems - 5;
      const itemsPerStar = remainingItems / 9; // Don't ceil - we want exact distribution
      const itemsAfterFirst = doneCount - 5;

      if (itemsAfterFirst > 0) {
        const additionalStars = Math.floor(itemsAfterFirst / itemsPerStar);
        currentMilestone += additionalStars;
      }

      // Cap at 9 stars max (10th star only at 100%)
      if (currentMilestone > 9) currentMilestone = 9;
    }

    // Guard against invalid milestone calculation
    if (!isFinite(currentMilestone) || currentMilestone < 0) {
      return null;
    }

    if (currentMilestone > this.data.lastMilestone && doneCount > 0) {
      this.data.lastMilestone = currentMilestone;
      this.data.starsEarned = currentMilestone;
      this.save();

      const remaining = totalItems - doneCount;
      let message = '';

      if (progress >= 100) {
        message = "🎉 INCREDIBLE! You've completed EVERYTHING! All 10 stars earned! You are the best and the most Beautiful! 🎉";
      } else if (currentMilestone >= 8) {
        message = `✨ Wow! ${currentMilestone} stars! You're almost there! ${doneCount} done, ${remaining} left! ✨`;
      } else if (currentMilestone >= 6) {
        message = `🌟 Amazing! ${currentMilestone} stars earned! You're over halfway! ${doneCount} done, ${remaining} to go! 🌟`;
      } else if (currentMilestone >= 4) {
        message = `⭐ That's ${currentMilestone} stars! Keep up the great work! ${doneCount} done, ${remaining} to go! ⭐`;
      } else if (currentMilestone >= 3) {
        message = `💫 Nice! ${currentMilestone} stars earned! ${doneCount} done, ${remaining} to go! 💫`;
      } else {
        message = `🌟 Star ${currentMilestone} earned! ${doneCount} done, ${remaining} to go!`;
      }

      return {
        show: true,
        message,
        starsEarned: currentMilestone,
        progress,
      };
    }

    return null;
  }

  getSectionProgress(sectionItems: string[]): { done: number; total: number } {
    const done = sectionItems.filter(ref => this.isDone(ref)).length;
    return { done, total: sectionItems.length };
  }
}

export const progressService = new ProgressService();
