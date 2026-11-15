import { describe, expect, it } from 'vitest';
import { lastBackupAt, parseJsonl, stamp, summarizeRuns, toJsonl, type Entry, type NewEntry } from './log';

const ctx = { tz: 'Europe/Vienna', appVersion: 'test', school: { year: '2026-27', class: 'CM1' } };
let n = 0;
function at(minute: number, e: NewEntry): Entry {
  return stamp(e, new Date(Date.UTC(2026, 10, 15, 9, minute)), `id-${n++}`, ctx);
}

function run(runId: string, minute: number, mode: 'essai' | 'reel', answers: (number | null)[], finished = true): Entry[] {
  const questions = answers.map(() => ({ a: 3, b: 4, level: 'moyen' as const }));
  const out: Entry[] = [
    at(minute, {
      type: 'sprint_started',
      runId,
      skill: { id: 'mult-sprint', version: 1 },
      mode,
      size: answers.length,
      timeLimitSec: 60,
      tables: [3],
      questions,
    }),
  ];
  answers.forEach((answer, index) =>
    out.push(
      at(minute, {
        type: 'sprint_answered',
        runId,
        index,
        question: questions[index]!,
        answer,
        correct: answer === 12,
        ms: 1500,
      }),
    ),
  );
  const score = answers.filter((a) => a === 12).length;
  if (finished)
    out.push(at(minute, { type: 'sprint_finished', runId, reason: 'time', score, answered: answers.length, total: answers.length }));
  return out;
}

describe('stamp', () => {
  it('adds id, time, zone, app version and school context to every entry', () => {
    const e = at(0, { type: 'backup_saved', entries: 3 });
    expect(e).toMatchObject({ at: '2026-11-15T09:00:00.000Z', tz: 'Europe/Vienna', appVersion: 'test', school: { class: 'CM1' } });
    expect(e.id).toMatch(/^id-/);
  });
});

describe('summarizeRuns', () => {
  it('rebuilds each run with its answers and score, newest first', () => {
    const entries = [...run('r1', 1, 'reel', [12, 11, null]), ...run('r2', 5, 'essai', [12, 12])];
    const runs = summarizeRuns(entries);
    expect(runs.map((r) => r.runId)).toEqual(['r2', 'r1']);
    expect(runs[1]).toMatchObject({ mode: 'reel', score: 1, size: 3 });
    expect(runs[1]!.answers.map((a) => a.answer)).toEqual([12, 11, null]);
    expect(runs[0]).toMatchObject({ mode: 'essai', score: 2 });
  });

  it("treats runs recorded before the difficulty switch as 'facile'", () => {
    const [r] = summarizeRuns(run('r1', 1, 'reel', [12]));
    expect(r!.difficulty).toBe('facile');
  });

  it('keeps an interrupted run (no finish entry) and scores what was answered', () => {
    const [r] = summarizeRuns(run('r1', 1, 'reel', [12, 12, 5], false));
    expect(r!.finish).toBeUndefined();
    expect(r!.score).toBe(2);
  });

  it('puts answers back in question order even if stored out of order', () => {
    const entries = run('r1', 1, 'reel', [12, 5, null]);
    const [r] = summarizeRuns([entries[0]!, entries[3]!, entries[1]!, entries[2]!]);
    expect(r!.answers.map((a) => a.index)).toEqual([0, 1, 2]);
  });
});

describe('lastBackupAt', () => {
  it('is null before any backup, then the latest one', () => {
    expect(lastBackupAt(run('r1', 1, 'reel', [12]))).toBeNull();
    const entries = [at(10, { type: 'backup_saved', entries: 1 }), at(30, { type: 'backup_saved', entries: 2 })];
    expect(lastBackupAt(entries)).toBe('2026-11-15T09:30:00.000Z');
  });
});

describe('backup file', () => {
  it('is one JSON entry per line and reads back identically', () => {
    const entries = [...run('r1', 1, 'reel', [12, null]), at(2, { type: 'backup_saved', entries: 4 })];
    const text = toJsonl(entries);
    expect(text.trim().split('\n')).toHaveLength(entries.length);
    expect(parseJsonl(text)).toEqual(entries);
  });
});
