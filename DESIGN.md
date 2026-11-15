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
2. **The process matters more than the final answer.** Every step is checked and recorded. A right final answer with a wrong step is not a success, and a slip at the very end after good steps is not a failure.
3. **Code makes and checks the exercises, not AI.** Maths answers must be checked exactly, every time.
4. **How he answers is separate from what the exercise is.** Keypad today, other input methods later, without changing the exercises.
5. **Start simple.** Add things when we need them.

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
- **Kept off the iPad.** Safari can wipe a web app's local data, and the iPad will be replaced at some point. The app works offline but syncs to a backend, and the backend copy is the one that counts. There is also a regular export to a plain file that can be read without the app.
- **Looking back:**
  - one skill over time
  - which steps he keeps getting wrong (e.g. the retenue in the tens column, lining up the second line of a multiplication)
  - the same skill across school years
  - replaying any exercise exactly as he did it, box by box

## Points and rewards

To be defined.

## Later: conjugaison and dictée

- **Conjugaison** fits the same skill model: one skill per tense and verb group.
- **Dictée**: the app reads the text aloud, he writes it, and the app highlights mistakes by type (agreement, accents, homophones).

## Tech direction

- A web app added to the iPad home screen, built with Vite + TypeScript, like Gaby's Castle.
- Exercises and checkers are plain code with tests.

## Open decisions

1. Points and rewards: what earns points, what they buy, and who approves spending. *(After the first version works.)*
2. Session length and how often. *(After the first version works.)*
3. Where the backend runs, and how often the export happens.
4. When to add Pencil handwriting.

## Glossary

- **Retenue**: the carry digit written above the next column.
- **Opération posée**: a calculation written out in columns.
- **Check-in**: a quick re-test of a mastered skill to make sure it hasn't been forgotten.
