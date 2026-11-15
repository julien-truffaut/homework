import { describe, expect, it } from 'vitest';
import { allFacts, isCorrect, levelOf, makeQuestions, tablesFor, timeLimitSeconds, type Level } from './sprint';

function seeded(seed: number): () => number {
  // mulberry32: deterministic so the tests never flake
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('timeLimitSeconds', () => {
  it('keeps the school pace of 2.4 s per question', () => {
    expect(timeLimitSeconds(25)).toBe(60);
    expect(timeLimitSeconds(50)).toBe(120);
    expect(timeLimitSeconds(100)).toBe(240);
  });
});

describe('tablesFor', () => {
  it('is 0 to 10, plus 12 only when asked', () => {
    expect(tablesFor(false)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(tablesFor(true)).toContain(12);
  });
});

describe('makeQuestions', () => {
  it('makes exactly the requested number of questions', () => {
    for (const n of [25, 50, 100]) expect(makeQuestions(seeded(n), n, tablesFor(false))).toHaveLength(n);
  });

  it('always uses one factor from the chosen tables and the other from 0..10', () => {
    const tables = [7, 8];
    for (const q of makeQuestions(seeded(1), 500, tables)) {
      const ok =
        (tables.includes(q.a) && q.b >= 0 && q.b <= 10) || (tables.includes(q.b) && q.a >= 0 && q.a <= 10);
      expect(ok, `${q.a} × ${q.b}`).toBe(true);
    }
  });

  it('never repeats a question back to back when it can avoid it', () => {
    const qs = makeQuestions(seeded(2), 1000, tablesFor(false));
    for (let i = 1; i < qs.length; i++) expect(qs[i]).not.toEqual(qs[i - 1]);
  });

  it('terminates even with an rng that always returns the same value', () => {
    expect(makeQuestions(() => 0, 5, [3])).toHaveLength(5);
  });

  it('still includes ×0 questions, in both orders', () => {
    const qs = makeQuestions(seeded(3), 2000, tablesFor(false));
    expect(qs.some((q) => q.b === 0 && q.a !== 0)).toBe(true);
    expect(qs.some((q) => q.a === 0 && q.b !== 0)).toBe(true);
  });
});

describe('levelOf', () => {
  it('matches the agreed grid', () => {
    const grid = [
      'TTTTTTTTTTT',
      'TFFFFFFFFFT',
      'TFFFFFFFFFT',
      'TFFMMFMMMMT',
      'TFFMMFMMMMT',
      'TFFFFFFFFFT',
      'TFFMMFDDDDT',
      'TFFMMFDDDDT',
      'TFFMMFDDDDT',
      'TFFMMFDDDDT',
      'TTTTTTTTTTT',
    ];
    const code: Record<Level, string> = { tres_facile: 'T', facile: 'F', moyen: 'M', difficile: 'D' };
    for (let a = 0; a <= 10; a++)
      expect([...Array(11).keys()].map((b) => code[levelOf(a, b)]).join(''), `row ${a}`).toBe(grid[a]);
  });

  it('counts ×12 as difficile except with 0, 1, 2, 5, 10', () => {
    expect(levelOf(12, 7)).toBe('difficile');
    expect(levelOf(3, 12)).toBe('difficile');
    expect(levelOf(12, 5)).toBe('facile');
    expect(levelOf(12, 0)).toBe('tres_facile');
    expect(levelOf(10, 12)).toBe('tres_facile');
  });
});

describe('allFacts', () => {
  it('has every fact of tables 0–10 exactly once', () => {
    expect(allFacts(tablesFor(false))).toHaveLength(121);
  });
});

describe('difficulty', () => {
  const share = (qs: { level: Level }[], l: Level) => qs.filter((q) => q.level === l).length / qs.length;

  it('facile is mostly easy facts, with few ×0 / ×10', () => {
    const qs = makeQuestions(seeded(4), 5000, tablesFor(false), 'facile');
    expect(share(qs, 'facile')).toBeGreaterThan(0.5);
    expect(share(qs, 'tres_facile')).toBeLessThan(0.13);
    expect(share(qs, 'difficile')).toBeGreaterThan(0.1);
  });

  it('difficile is weighted toward hard facts but still mixes in the others', () => {
    const qs = makeQuestions(seeded(5), 5000, tablesFor(false), 'difficile');
    expect(share(qs, 'difficile')).toBeGreaterThan(0.45);
    expect(share(qs, 'moyen')).toBeGreaterThan(0.25);
    expect(share(qs, 'facile')).toBeGreaterThan(0.1);
    expect(share(qs, 'tres_facile')).toBeLessThan(0.08);
  });

  it('works when a level has no facts (only easy tables chosen)', () => {
    const qs = makeQuestions(seeded(6), 100, [2, 5], 'difficile');
    expect(qs.every((q) => q.level === 'facile' || q.level === 'tres_facile')).toBe(true);
  });

  it('records the level on every question', () => {
    for (const q of makeQuestions(seeded(7), 50, tablesFor(true), 'difficile')) expect(q.level).toBe(levelOf(q.a, q.b));
  });
});

describe('isCorrect', () => {
  it('checks the product', () => {
    expect(isCorrect({ a: 6, b: 6 }, 36)).toBe(true);
    expect(isCorrect({ a: 6, b: 6 }, 40)).toBe(false);
  });
  it('treats ×0 like the school sheet: 3 × 0 = 0, not 3', () => {
    expect(isCorrect({ a: 3, b: 0 }, 0)).toBe(true);
    expect(isCorrect({ a: 3, b: 0 }, 3)).toBe(false);
  });
  it('counts a skipped question as wrong', () => {
    expect(isCorrect({ a: 2, b: 2 }, null)).toBe(false);
  });
});
