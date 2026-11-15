// Multiplication sprint rules. Pure: no DOM, randomness is injected.
import { SPRINT } from './config';

/** How hard a single fact is, in general (not for him personally). */
export type Level = 'tres_facile' | 'facile' | 'moyen' | 'difficile';
/** The Facile / Difficile switch on the start screen. */
export type Difficulty = 'facile' | 'difficile';

export type Question = { a: number; b: number; level: Level };
export type Rng = () => number;

const LEVELS: readonly Level[] = ['tres_facile', 'facile', 'moyen', 'difficile'];

export function timeLimitSeconds(size: number): number {
  return Math.round(size * SPRINT.secondsPerQuestion);
}

export function tablesFor(withTwelve: boolean): number[] {
  return withTwelve ? [...SPRINT.baseTables, SPRINT.extraTable] : [...SPRINT.baseTables];
}

export function levelOf(a: number, b: number): Level {
  const veryEasy: readonly number[] = SPRINT.veryEasyFactors;
  const easy: readonly number[] = SPRINT.easyFactors;
  const hard: readonly number[] = SPRINT.hardFactors;
  if (veryEasy.includes(a) || veryEasy.includes(b)) return 'tres_facile';
  if (easy.includes(a) || easy.includes(b)) return 'facile';
  if (a === SPRINT.extraTable || b === SPRINT.extraTable) return 'difficile';
  if (hard.includes(a) && hard.includes(b)) return 'difficile';
  return 'moyen';
}

/** Every fact with one factor from `tables` and the other from 0..maxFactor, in both orders, no duplicates. */
export function allFacts(tables: readonly number[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  const add = (a: number, b: number) => {
    const key = `${a}x${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ a, b, level: levelOf(a, b) });
  };
  for (const t of tables) {
    for (let f = 0; f <= SPRINT.maxFactor; f++) {
      add(t, f);
      add(f, t);
    }
  }
  return out;
}

function pickFrom<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))]!;
}

function pickLevel(rng: Rng, groups: Record<Level, Question[]>, difficulty: Difficulty): Level {
  const mix = SPRINT.mix[difficulty];
  const avail = LEVELS.filter((l) => groups[l].length > 0);
  const total = avail.reduce((s, l) => s + mix[l], 0);
  let r = rng() * total;
  for (const l of avail) {
    r -= mix[l];
    if (r < 0) return l;
  }
  return avail[avail.length - 1]!;
}

function same(x: Question, y: Question): boolean {
  return x.a === y.a && x.b === y.b;
}

/**
 * `size` random questions from the chosen tables.
 * The level of each question is drawn from SPRINT.mix[difficulty], then a fact of that level.
 * Avoids asking the same question twice in a row.
 */
export function makeQuestions(
  rng: Rng,
  size: number,
  tables: readonly number[],
  difficulty: Difficulty = 'facile',
): Question[] {
  const facts = allFacts(tables);
  const groups: Record<Level, Question[]> = { tres_facile: [], facile: [], moyen: [], difficile: [] };
  for (const f of facts) groups[f.level].push(f);
  const pick = (): Question => pickFrom(rng, groups[pickLevel(rng, groups, difficulty)]);

  const out: Question[] = [];
  while (out.length < size) {
    let q = pick();
    for (let tries = 1; out.length > 0 && same(out[out.length - 1]!, q) && tries < 10; tries++) q = pick();
    out.push({ ...q });
  }
  return out;
}

/** A skipped question (null) is never correct. */
export function isCorrect(q: Pick<Question, 'a' | 'b'>, answer: number | null): boolean {
  return answer !== null && answer === q.a * q.b;
}
