/**
 * Achievement system for Crates (Sokoban clone)
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'exploration' | 'mastery' | 'daily';
}

export interface AchievementProgress { unlockedAt: number; }
export type AchievementStore = Record<string, AchievementProgress>;

export const ACHIEVEMENTS: Achievement[] = [
  // Skill
  { id: 'first_push', name: 'Mover', description: 'Push your first crate', icon: '📦', category: 'skill' },
  { id: 'first_level', name: 'Solver', description: 'Complete level 1', icon: '✅', category: 'skill' },
  { id: 'no_undo', name: 'No Regrets', description: 'Complete a level without undo', icon: '⭐', category: 'skill' },
  { id: 'under_par', name: 'Under Par', description: 'Complete a level under par moves', icon: '🏌️', category: 'skill' },
  { id: 'speedster', name: 'Speedster', description: 'Complete a level in under 30 seconds', icon: '⚡', category: 'skill' },
  { id: 'chain_push', name: 'Chain Push', description: 'Push 5 crates without moving yourself', icon: '🔗', category: 'skill' },

  // Exploration
  { id: 'all_corners', name: 'Corner Inspector', description: 'Visit all corners in one level', icon: '🔍', category: 'exploration' },
  { id: 'minimal_moves', name: 'Minimalist', description: 'Complete a level in minimum moves', icon: '🎯', category: 'exploration' },
  { id: 'undo_master', name: 'Time Lord', description: 'Use undo 50 times in one game', icon: '⏪', category: 'exploration' },

  // Mastery
  { id: 'level_5', name: 'Apprentice', description: 'Complete 5 levels', icon: '🎖️', category: 'mastery' },
  { id: 'level_10', name: 'Expert', description: 'Complete 10 levels', icon: '👑', category: 'mastery' },
  { id: 'level_25', name: 'Master', description: 'Complete 25 levels', icon: '🏆', category: 'mastery' },
  { id: 'all_levels', name: 'Completionist', description: 'Complete all levels', icon: '🌟', category: 'mastery' },
  { id: 'perfect_game', name: 'Perfectionist', description: 'Complete all levels under par', icon: '💎', category: 'mastery' },
  { id: 'no_undo_streak', name: 'Clean Streak', description: '5 levels without undo', icon: '🧹', category: 'mastery' },

  // Daily
  { id: 'daily_complete', name: 'Daily Pusher', description: 'Complete a daily puzzle', icon: '📅', category: 'daily' },
  { id: 'daily_top_10', name: 'Daily Contender', description: 'Top 10 in daily', icon: '🔟', category: 'daily' },
  { id: 'daily_top_3', name: 'Daily Champion', description: 'Top 3 in daily', icon: '🥉', category: 'daily' },
  { id: 'daily_first', name: 'Daily Legend', description: 'First place in daily', icon: '🥇', category: 'daily' },
  { id: 'daily_streak_3', name: 'Consistent', description: '3-day streak', icon: '🔥', category: 'daily' },
  { id: 'daily_streak_7', name: 'Dedicated', description: '7-day streak', icon: '💪', category: 'daily' },
];

const STORAGE_KEY = 'crates_achievements';
const STREAK_KEY = 'crates_daily_streak';

export class AchievementManager {
  private store: AchievementStore;
  private dailyStreak: { lastDate: string; count: number };

  constructor() {
    this.store = this.load();
    this.dailyStreak = this.loadStreak();
  }

  private load(): AchievementStore {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store)); } catch {}
  }
  private loadStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"lastDate":"","count":0}'); } catch { return { lastDate: '', count: 0 }; }
  }
  private saveStreak(): void {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(this.dailyStreak)); } catch {}
  }

  isUnlocked(id: string): boolean { return id in this.store; }
  getProgress(): AchievementStore { return { ...this.store }; }
  getUnlockedCount(): number { return Object.keys(this.store).length; }
  getTotalCount(): number { return ACHIEVEMENTS.length; }
  getAchievement(id: string) { return ACHIEVEMENTS.find((a) => a.id === id); }
  getAllAchievements() { return ACHIEVEMENTS; }

  unlock(id: string): Achievement | null {
    if (this.isUnlocked(id)) return null;
    const a = this.getAchievement(id);
    if (!a) return null;
    this.store[id] = { unlockedAt: Date.now() };
    this.save();
    return a;
  }

  checkAndUnlock(ids: string[]): Achievement[] {
    return ids.map((id) => this.unlock(id)).filter((a): a is Achievement => a !== null);
  }

  recordDailyCompletion(rank: number): Achievement[] {
    const unlocked: Achievement[] = [];
    let a = this.unlock('daily_complete'); if (a) unlocked.push(a);
    if (rank <= 10) { a = this.unlock('daily_top_10'); if (a) unlocked.push(a); }
    if (rank <= 3) { a = this.unlock('daily_top_3'); if (a) unlocked.push(a); }
    if (rank === 1) { a = this.unlock('daily_first'); if (a) unlocked.push(a); }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (this.dailyStreak.lastDate === yesterday) this.dailyStreak.count++;
    else if (this.dailyStreak.lastDate !== today) this.dailyStreak.count = 1;
    this.dailyStreak.lastDate = today;
    this.saveStreak();

    if (this.dailyStreak.count >= 3) { a = this.unlock('daily_streak_3'); if (a) unlocked.push(a); }
    if (this.dailyStreak.count >= 7) { a = this.unlock('daily_streak_7'); if (a) unlocked.push(a); }
    return unlocked;
  }

  reset(): void { this.store = {}; this.dailyStreak = { lastDate: '', count: 0 }; this.save(); this.saveStreak(); }
}

let instance: AchievementManager | null = null;
export function getAchievementManager(): AchievementManager {
  if (!instance) instance = new AchievementManager();
  return instance;
}
