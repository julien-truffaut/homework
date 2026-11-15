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
} as const;

/** Show the backup reminder when the last backup is older than this. */
export const BACKUP_REMINDER_DAYS = 7;
