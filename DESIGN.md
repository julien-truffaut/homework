# Homework app: design

Status: design only, nothing built yet. Last updated 2026-11-15.

## Goal

An iPad app for my son (CM1, Lycée français) with two jobs:

1. **Homework companion**: turn the weekly Padlet post into a checklist.
2. **Practice**: exercises in the areas where he's weak.

Maths comes first. Conjugaison and dictée come later.

Everything he does is kept permanently, so that years from now we can look back at how he did on any task.

## Principles

1. **History is permanent.** Every exercise and every answer is stored and never changed or deleted.
2. **For written calculations, the process matters more than the final answer.** Every step is checked and recorded. A right final answer with a wrong step is not a success, and a slip at the very end after good steps is not a failure. **Speed drills are the exception:** they are judged only on the final score.
3. **Every exercise can be done as a trial (*essai*).** A trial is recorded and marked as a trial, but it is never scored as a result and never counts toward progress or points. He can try without being judged.
4. **Code makes and checks the exercises, not AI.** Maths answers must be checked exactly, every time.
5. **How he answers is separate from what the exercise is.** Keypad today, other input methods later, without changing the exercises.
6. **Start simple.** Add things when we need them.

## Skills

Everything is organised around small skills:

| Skill | Example |
|---|---|
| Add whole numbers with carrying | 123 + 48 |
| Add decimals of different lengths | 34,56 + 67,3 |
| Multiply 3 digits by 2 digits, written out | 312 × 56 |
| Add/subtract fractions with the same denominator | 3/4 + 6/4 − 2/4 |
| Write a fraction as whole + remainder | 7/4 = 1 + 3/4 |

Each skill has:
- an **exercise maker** with difficulty settings (number size, with or without carrying, and so on)
- a **checker**
- **hints**, from a small nudge up to a full step

Each skill has a permanent ID that is never reused. If a skill changes later (different difficulty levels, a different method), it gets a new version, so old results still mean what they meant when they were recorded.

The app uses French notation: decimal comma, × for multiplication.

## First exercise: multiplication sprint (built, v0.2)

Modelled on the school sheet "100 calculs en 4 minutes": as many correct multiplications as possible before time runs out.

- **Size:** 25, 50 or 100 questions, at the school pace of 2.4 s per question: 1 min, 2 min, 4 min.
- **Questions:** one factor from the tables 0 to 10 (×12 as an option), the other from 0 to 10, random order, never the same question twice in a row.
- **Difficulty switch: Facile / Difficile.** Each fact has a general level:
  - *Facile*: at least one factor is 0, 1, 2, 5 or 10 (2 × 3, 5 × 7)
  - *Moyen*: uses 3 or 4 and isn't facile (3 × 4, 4 × 7)
  - *Difficile*: both factors are 6, 7, 8 or 9 (8 × 7, 6 × 9); ×12 facts are difficile unless facile

  **Facile** picks every fact equally, so mostly easy ones. **Difficile** leans toward hard facts but still mixes: 50% difficile, 30% moyen, 20% facile. The score is unchanged: 1 point per correct answer, whatever the level. Each question's level is recorded.
- **Later: his own difficulty**, learned from his recorded times and mistakes (his 3 mistakes on the school sheet were all ×0, which counts as "facile" in general).
- **Run:** one question at a time, number keypad + OK, **Passer** to skip, countdown, **Arrêter** to stop.
- **Score:** correct answers only. Wrong and skipped answers are worth 0. Judged on the score alone.
- **Essai:** ✓ or ✗ with the correct answer after each question, and the score is shown but not counted. **Pour de vrai:** no feedback until the score at the end.
- **Recorded quietly:** every question, his answer (or skipped), right/wrong, time taken. Not shown during the run.
- **History screen:** two tabs, *Pour de vrai* and *Essais*, each listing runs with date, difficulty and score. Tap a run to see every answer with its level.

## Exercises are written out in full

An exercise is a question **plus the full expected solution, including every intermediate step**. He doesn't just type the final answer. He fills in the whole written calculation (the *opération posée*), so the app can see exactly where something went wrong.

**How an exercise is judged:** box by box, not on the final result. The result of an exercise is the list of steps he got right or wrong, and which ones he fixed after a hint. The final answer is just the last step.

### Retenues (carries)

Above each column there is a small box for the *retenue*. Writing retenues is **optional**: he can fill them in or leave them empty. When he writes one, it is checked and recorded, and a wrong retenue counts as a mistake in the process, like any other step.

### Addition

Numbers are lined up by column. Decimals are lined up on the comma.

```
   ¹  ¹            ← retenues (optional)
   3 4 , 5 6
 + 6 7 , 3
 ----------
 1 0 1 , 8 6
```

### Multiplication

One line for each digit of the multiplier, each with its own retenues, then the final addition:

```
       3 1 2
     ×   5 6
     -------
     1 8 7 2      ← 312 × 6
 + 1 5 6 0 0      ← 312 × 50
     -------
   1 7 4 7 2
```

For now we only support the standard French school method (units digit first).

### Fractions

He works step by step, the way the teacher expects:

```
3/4 + 6/4 − 2/4 = 7/4 = 4/4 + 3/4 = 1 + 3/4
```

Each step is its own box and is checked on its own.

## How he answers (input)

The answer is stored as **the value in each box** (each digit, each retenue, each fraction step), whatever way he entered it. Alongside it we keep the **raw input** (key presses now, Pencil strokes later), so we can replay exactly what he did.

Input methods are interchangeable:
- **v1**: a big on-screen number keypad
- **later**: Apple Pencil handwriting, a keyboard for dictée

The exercise and its checker don't know or care which one he used.

## Hints and retries

```
Question → he fills it in
  ✓ every step right  → points, next exercise
  ✗ wrong             → hint 1 (a nudge, e.g. "check the tens column")
                       → he corrects
  ✗ wrong again       → hint 2 (one step shown)
                       → he corrects
  ✗ wrong again       → full worked solution, then he fixes his own version
                       → a similar exercise comes back later
```

The hint fits the mistake whenever possible. For example, 3/4 + 6/4 = 9/8 means he added the denominators too, so the hint is about that, not a generic "wrong".

## Homework from Padlet

I paste the week's Padlet post into the parent screen and turn it into tasks for each day. He ticks them off. The pasted text is saved as it was, as part of the history. Fetching from Padlet automatically can come later.

## Choosing exercises

For now **I choose**: I create an assignment (skill, how many exercises, difficulty) and he does it.

The app still tracks a status for each skill and shows it to me:
- **New**: not tried yet
- **Learning**: being practised
- **Mastered**: every step right several times in a row, without hints, on different days
- **Check-in due**: mastered, but not practised for a while

Letting the app choose by itself comes later.

## History (for years)

The goal is to open the app in 2030 and see how he did on 312 × 56 in CM1.

- **A log that only grows.** Each thing that happens is one entry: exercise shown, answer submitted, hint shown, solution shown, exercise finished. Each entry has a date, time and duration. Nothing is ever edited or deleted. A correction is a new entry.
- **Exercises are stored complete.** The full question and expected solution are saved, not regenerated later, because the exercise-making code will change over the years.
- **Context on every entry:** skill ID and version, app version, and school year and class (e.g. CM1 2026-27).
- **The backup file is the archive.** One plain text file, one entry per line, readable without the app. This format is what has to last for years. Storage can change around it.
- **Looking back:**
  - one skill over time
  - which steps he keeps getting wrong (e.g. the retenue in the tens column, lining up the second line of a multiplication)
  - the same skill across school years
  - replaying any exercise exactly as he did it, box by box

## Storage

**v1: iPad only, plus a backup file.**
- The log is stored on the iPad (in the browser's local database). The parent screen is on the iPad too.
- A **"Save backup"** button writes the whole log to one file in iCloud Drive.
- The app reminds you when the last backup is more than a week old.

**Why this keeps the door open:** every entry has its own ID and is never changed, so syncing only means "send the entries the other side doesn't have yet". A sync server can be added later without changing the app's data. Moving from one storage to another means copying the entries across.

**Later, when results are needed on the Mac or backups should happen on their own:** add a small sync server, either at home (a Mac, NAS or Raspberry Pi with a single-file SQLite database) or a hosted service. The backup file stays the long-term archive in both cases.

## Points and rewards

To be defined.

## Later: conjugaison and dictée

- **Conjugaison** fits the same skill model: one skill per tense and verb group.
- **Dictée**: the app reads the text aloud, he writes it, and the app highlights mistakes by type (agreement, accents, homophones).

## Tech direction

- A static web app (Vite + TypeScript, no framework), like Gaby's Castle. No server: logic and data stay on the iPad.
- Exercises, checkers and the history format are plain code with tests.
- Hosted on GitHub Pages at https://julien-truffaut.github.io/homework/ (public repo; it holds no personal data). Every push to `main` runs the tests and redeploys.
- On the iPad: Safari → Share → "Add to Home Screen". Opens full screen and works offline. Updates arrive on the next launch.
- **The address must never change:** the iPad keeps the data under the address the app was opened from. Moving to another address means backup then restore (restore not built yet).

## Open decisions

1. Points and rewards: what earns points, what they buy, and who approves spending. *(After the first version works.)*
2. Session length and how often. *(After the first version works.)*
3. Sync server, once we need one: at home or hosted.
4. When to add Pencil handwriting.

## Glossary

- **Retenue**: the carry digit written above the next column.
- **Opération posée**: a calculation written out in columns.
- **Check-in**: a quick re-test of a mastered skill to make sure it hasn't been forgotten.
