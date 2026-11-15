// The dials. Most tweaks are a one-line change here.

export const APP_VERSION: string = __APP_VERSION__;

/** Recorded on every history entry. Update at the start of each school year. */
export const SCHOOL = { year: '2026-27', class: 'CM1' } as const;

export const SPRINT = {
  /** Permanent skill ID: never reuse. Bump the version if the exercise changes meaning. */
  skillId: 'mult-sprint',
  skillVersion: 1,
  sizes: [25, 50, 100] as const,
  /** Same pace as the school sheet: 100 questions in 4 minutes. */
  secondsPerQuestion: 2.4,
  baseTables: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  extraTable: 12,
  /** The other factor goes from 0 to this. */
  maxFactor: 10,
  maxAnswerDigits: 3,
  /** A fact is "facile" if either factor is one of these. */
  easyFactors: [0, 1, 2, 5, 10],
  /** A fact is "difficile" if both factors are among these (or one of them is 12 and it isn't facile). */
  hardFactors: [6, 7, 8, 9],
  /** "Difficile" mode: share of questions per level. "Facile" mode picks every fact equally (mostly easy ones). */
  difficileMix: { facile: 0.2, moyen: 0.3, difficile: 0.5 },
} as const;

/** Show the backup reminder when the last backup is older than this. */
export const BACKUP_REMINDER_DAYS = 7;
