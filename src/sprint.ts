// Multiplication sprint rules. Pure: no DOM, randomness is injected.
import { SPRINT } from './config';

export type Question = { a: number; b: number };
export type Rng = () => number;

export function timeLimitSeconds(size: number): number {
  return Math.round(size * SPRINT.secondsPerQuestion);
}

export function tablesFor(withTwelve: boolean): number[] {
  return withTwelve ? [...SPRINT.baseTables, SPRINT.extraTable] : [...SPRINT.baseTables];
}

function randInt(rng: Rng, maxInclusive: number): number {
  return Math.min(maxInclusive, Math.floor(rng() * (maxInclusive + 1)));
}

function same(x: Question, y: Question): boolean {
  return x.a === y.a && x.b === y.b;
}

/**
 * `size` random questions: one factor from `tables`, the other from 0..maxFactor,
 * in a random order. Avoids asking the same question twice in a row.
 */
export function makeQuestions(rng: Rng, size: number, tables: readonly number[]): Question[] {
  const out: Question[] = [];
  while (out.length < size) {
    let q: Question;
    let tries = 0;
    do {
      const t = tables[randInt(rng, tables.length - 1)]!;
      const f = randInt(rng, SPRINT.maxFactor);
      q = rng() < 0.5 ? { a: t, b: f } : { a: f, b: t };
      tries++;
    } while (out.length > 0 && same(out[out.length - 1]!, q) && tries < 10);
    out.push(q);
  }
  return out;
}

/** A skipped question (null) is never correct. */
export function isCorrect(q: Question, answer: number | null): boolean {
  return answer !== null && answer === q.a * q.b;
}
