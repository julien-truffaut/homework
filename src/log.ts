// The history log: a list of entries that only grows. Never edit or delete an entry.
// This format is the long-term archive (see DESIGN.md "History"): add fields, never rename or remove them.
import type { Difficulty, Question } from './sprint';

export type Mode = 'essai' | 'reel';

type Base = {
  /** Unique ID of this entry. */
  id: string;
  /** When it happened (ISO 8601, UTC). */
  at: string;
  /** Device time zone, e.g. "Europe/Vienna". */
  tz: string;
  appVersion: string;
  school: { year: string; class: string };
};

export type SprintStarted = Base & {
  type: 'sprint_started';
  runId: string;
  skill: { id: string; version: number };
  mode: Mode;
  /** Added in v0.2. Missing = 'facile'. */
  difficulty?: Difficulty;
  size: number;
  timeLimitSec: number;
  tables: number[];
  questions: Question[];
};

export type SprintAnswered = Base & {
  type: 'sprint_answered';
  runId: string;
  index: number;
  question: Question;
  /** null = skipped ("Passer"). */
  answer: number | null;
  correct: boolean;
  /** Time spent on this question. */
  ms: number;
};

export type FinishReason = 'time' | 'all_answered' | 'stopped';

export type SprintFinished = Base & {
  type: 'sprint_finished';
  runId: string;
  reason: FinishReason;
  score: number;
  answered: number;
  total: number;
};

export type BackupSaved = Base & { type: 'backup_saved'; entries: number };

export type Entry = SprintStarted | SprintAnswered | SprintFinished | BackupSaved;

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewEntry = DistOmit<Entry, keyof Base>;

export type Context = Pick<Base, 'tz' | 'appVersion' | 'school'>;

export function stamp(e: NewEntry, now: Date, id: string, ctx: Context): Entry {
  return { id, at: now.toISOString(), ...ctx, school: { ...ctx.school }, ...e } as Entry;
}

export type Run = {
  runId: string;
  startedAt: string;
  mode: Mode;
  difficulty: Difficulty;
  size: number;
  timeLimitSec: number;
  answers: SprintAnswered[];
  score: number;
  /** undefined = interrupted (app closed during the run). */
  finish?: SprintFinished;
};

/** All sprint runs, newest first. */
export function summarizeRuns(entries: readonly Entry[]): Run[] {
  const runs = new Map<string, Run>();
  for (const e of entries) {
    if (e.type === 'sprint_started') {
      runs.set(e.runId, {
        runId: e.runId,
        startedAt: e.at,
        mode: e.mode,
        difficulty: e.difficulty ?? 'facile',
        size: e.size,
        timeLimitSec: e.timeLimitSec,
        answers: [],
        score: 0,
      });
    }
  }
  for (const e of entries) {
    if (e.type === 'sprint_answered') runs.get(e.runId)?.answers.push(e);
    if (e.type === 'sprint_finished') {
      const r = runs.get(e.runId);
      if (r) r.finish = e;
    }
  }
  for (const r of runs.values()) {
    r.answers.sort((x, y) => x.index - y.index);
    r.score = r.finish ? r.finish.score : r.answers.filter((a) => a.correct).length;
  }
  return [...runs.values()].sort((x, y) => y.startedAt.localeCompare(x.startedAt));
}

export function lastBackupAt(entries: readonly Entry[]): string | null {
  let last: string | null = null;
  for (const e of entries) if (e.type === 'backup_saved' && (last === null || e.at > last)) last = e.at;
  return last;
}

/** Backup file format: one JSON entry per line, oldest first. */
export function toJsonl(entries: readonly Entry[]): string {
  return [...entries]
    .sort((x, y) => x.at.localeCompare(y.at))
    .map((e) => JSON.stringify(e))
    .join('\n') + '\n';
}

export function parseJsonl(text: string): Entry[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as Entry);
}
