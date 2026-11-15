// Screens and wiring. Rules live in sprint.ts, the history format in log.ts.
import './style.css';
import { APP_VERSION, BACKUP_REMINDER_DAYS, SCHOOL, SPRINT } from './config';
import { isCorrect, makeQuestions, tablesFor, timeLimitSeconds, type Question } from './sprint';
import {
  lastBackupAt,
  stamp,
  summarizeRuns,
  toJsonl,
  type Entry,
  type FinishReason,
  type Mode,
  type NewEntry,
  type Run,
} from './log';
import { openStore, requestPersistence, type Store } from './store';
import { uuid } from './uuid';

const app = document.getElementById('app')!;

let store: Store | null = null;
let entries: Entry[] = [];
let saveError = false;
let writes: Promise<void> = Promise.resolve();

const ctx = {
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  appVersion: APP_VERSION,
  school: SCHOOL,
};

function record(e: NewEntry): void {
  const entry = stamp(e, new Date(), uuid(), ctx);
  entries.push(entry);
  writes = writes
    .then(() => store?.append(entry))
    .catch((err: unknown) => {
      console.error('save failed', err);
      saveError = true;
    });
}

// ---------- small per-device preferences (not history) ----------

function pref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(`pref.${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}
function setPref(key: string, value: string): void {
  try {
    localStorage.setItem(`pref.${key}`, value);
  } catch {
    /* ignore */
  }
}

let mode: Mode = pref('mode', 'essai') === 'reel' ? 'reel' : 'essai';
let size: number = Number(pref('size', '25'));
if (!(SPRINT.sizes as readonly number[]).includes(size)) size = SPRINT.sizes[0];
let withTwelve = pref('twelve', 'no') === 'yes';
let showTrials = false;

// ---------- helpers ----------

function fmtDuration(sec: number): string {
  return sec < 120 && sec % 60 !== 0 ? `${sec} s` : `${sec / 60} min`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
function q2s(q: Question): string {
  return `${q.a} × ${q.b}`;
}
function on(sel: string, fn: () => void): void {
  app.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener('click', fn));
}
function errorBanner(): string {
  return saveError
    ? `<div class="banner bad">⚠️ Problème d'enregistrement : des réponses n'ont peut-être pas été sauvegardées.</div>`
    : '';
}

// ---------- home ----------

function backupReminder(): string {
  if (summarizeRuns(entries).length === 0) return '';
  const last = lastBackupAt(entries);
  const ageDays = last ? (Date.now() - Date.parse(last)) / 86_400_000 : Infinity;
  if (ageDays < BACKUP_REMINDER_DAYS) return '';
  const when = last ? fmtDate(last) : 'jamais';
  return `<div class="banner">💾 Pense à sauvegarder (dernière sauvegarde : ${when})</div>`;
}

function showHome(): void {
  const sizes = SPRINT.sizes
    .map(
      (s) => `<button class="choice ${s === size ? 'on' : ''}" data-size="${s}">
        <span class="big">${s}</span><span class="small">${fmtDuration(timeLimitSeconds(s))}</span></button>`,
    )
    .join('');
  app.innerHTML = `
    <main class="home">
      ${errorBanner()}${backupReminder()}
      <h1>Multiplications ⚡</h1>
      <div class="row">
        <button class="choice ${mode === 'essai' ? 'on' : ''}" data-mode="essai">Essai</button>
        <button class="choice ${mode === 'reel' ? 'on' : ''}" data-mode="reel">Pour de vrai</button>
      </div>
      <div class="row">${sizes}</div>
      <button class="go" id="start">C'est parti !</button>
      <footer>
        <button class="link" id="history">Historique</button>
        <button class="link" id="backup">Sauvegarder</button>
        <label class="link"><input type="checkbox" id="twelve" ${withTwelve ? 'checked' : ''}> table de 12</label>
      </footer>
      <div class="version">v${APP_VERSION}</div>
    </main>`;
  app.querySelectorAll<HTMLElement>('[data-mode]').forEach((el) =>
    el.addEventListener('click', () => {
      mode = el.dataset.mode === 'reel' ? 'reel' : 'essai';
      setPref('mode', mode);
      showHome();
    }),
  );
  app.querySelectorAll<HTMLElement>('[data-size]').forEach((el) =>
    el.addEventListener('click', () => {
      size = Number(el.dataset.size);
      setPref('size', String(size));
      showHome();
    }),
  );
  on('#start', startRun);
  on('#history', showHistory);
  on('#backup', () => void saveBackup());
  app.querySelector<HTMLInputElement>('#twelve')!.addEventListener('change', (ev) => {
    withTwelve = (ev.target as HTMLInputElement).checked;
    setPref('twelve', withTwelve ? 'yes' : 'no');
  });
}

// ---------- run ----------

type Live = {
  runId: string;
  mode: Mode;
  questions: Question[];
  index: number;
  typed: string;
  deadline: number;
  shownAt: number;
  score: number;
  answered: number;
  feedback: { ok: boolean; text: string } | null;
  timer: number;
};
let live: Live | null = null;

function startRun(): void {
  const tables = tablesFor(withTwelve);
  const questions = makeQuestions(Math.random, size, tables);
  const limit = timeLimitSeconds(size);
  const runId = uuid();
  record({
    type: 'sprint_started',
    runId,
    skill: { id: SPRINT.skillId, version: SPRINT.skillVersion },
    mode,
    size,
    timeLimitSec: limit,
    tables,
    questions,
  });
  const now = performance.now();
  live = {
    runId,
    mode,
    questions,
    index: 0,
    typed: '',
    deadline: now + limit * 1000,
    shownAt: now,
    score: 0,
    answered: 0,
    feedback: null,
    timer: window.setInterval(tick, 100),
  };
  renderRun();
}

function remainingSec(l: Live): number {
  return Math.max(0, Math.ceil((l.deadline - performance.now()) / 1000));
}

function tick(): void {
  if (!live) return;
  const left = remainingSec(live);
  const el = app.querySelector('#clock');
  if (el) {
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('hurry', left <= 10);
  }
  if (performance.now() >= live.deadline) finishRun('time');
}

function renderRun(): void {
  if (!live) return;
  const l = live;
  const q = l.questions[l.index]!;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']
    .map((k) => `<button class="key ${k === 'OK' ? 'ok' : ''}" data-key="${k}">${k}</button>`)
    .join('');
  const fb = l.feedback
    ? `<div class="feedback ${l.feedback.ok ? 'good' : 'bad'}">${l.feedback.text}</div>`
    : `<div class="feedback"></div>`;
  app.innerHTML = `
    <main class="run">
      <header>
        <button class="link" id="stop">Arrêter</button>
        <span class="tag">${l.mode === 'essai' ? 'Essai' : 'Pour de vrai'}</span>
        <span class="progress">${l.index + 1} / ${l.questions.length}</span>
        <span id="clock" class="clock"></span>
      </header>
      ${fb}
      <div class="question">${q2s(q)} = <span class="answer">${l.typed || '&nbsp;'}</span></div>
      <div class="keypad">${keys}</div>
      <button class="skip" id="skip">Passer</button>
    </main>`;
  tick();
  app.querySelectorAll<HTMLElement>('[data-key]').forEach((el) =>
    el.addEventListener('click', () => press(el.dataset.key!)),
  );
  on('#skip', () => answer(null));
  on('#stop', () => finishRun('stopped'));
}

function press(k: string): void {
  if (!live) return;
  if (k === 'OK') {
    if (live.typed !== '') answer(Number(live.typed));
    return;
  }
  if (k === '⌫') live.typed = live.typed.slice(0, -1);
  else if (live.typed.length < SPRINT.maxAnswerDigits) live.typed = live.typed === '0' ? k : live.typed + k;
  const el = app.querySelector('.answer');
  if (el) el.innerHTML = live.typed || '&nbsp;';
}

function answer(value: number | null): void {
  if (!live) return;
  const l = live;
  const q = l.questions[l.index]!;
  const correct = isCorrect(q, value);
  const now = performance.now();
  record({
    type: 'sprint_answered',
    runId: l.runId,
    index: l.index,
    question: q,
    answer: value,
    correct,
    ms: Math.round(now - l.shownAt),
  });
  l.answered++;
  if (correct) l.score++;
  if (l.mode === 'essai') {
    const full = `${q2s(q)} = ${q.a * q.b}`;
    l.feedback = correct
      ? { ok: true, text: `✓ ${full}` }
      : { ok: false, text: value === null ? `Passé : ${full}` : `✗ ${q2s(q)} ≠ ${value}, c'est ${q.a * q.b}` };
  }
  l.index++;
  l.typed = '';
  l.shownAt = now;
  if (l.index >= l.questions.length) finishRun('all_answered');
  else renderRun();
}

function finishRun(reason: FinishReason): void {
  if (!live) return;
  const l = live;
  live = null;
  window.clearInterval(l.timer);
  record({
    type: 'sprint_finished',
    runId: l.runId,
    reason,
    score: l.score,
    answered: l.answered,
    total: l.questions.length,
  });
  showEnd(l, reason);
}

function showEnd(l: Live, reason: FinishReason): void {
  const why =
    reason === 'time' ? "Temps écoulé !" : reason === 'all_answered' ? 'Tout répondu !' : 'Arrêté.';
  const note = l.mode === 'essai' ? `<p class="note">C'était un essai : ça ne compte pas.</p>` : '';
  app.innerHTML = `
    <main class="end">
      ${errorBanner()}
      <p class="why">${why}</p>
      <div class="score">${l.score} / ${l.questions.length}</div>
      ${note}
      <div class="row">
        <button class="go" id="again">Rejouer</button>
        <button class="choice" id="home">Accueil</button>
      </div>
    </main>`;
  on('#again', startRun);
  on('#home', showHome);
}

// ---------- history ----------

function showHistory(): void {
  const runs = summarizeRuns(entries).filter((r) => showTrials || r.mode === 'reel');
  const rows = runs
    .map(
      (r) => `<li><button class="runrow" data-run="${r.runId}">
        <span>${fmtDate(r.startedAt)}</span>
        <span class="tag ${r.mode}">${r.mode === 'essai' ? 'Essai' : 'Pour de vrai'}</span>
        <span class="runscore">${r.score} / ${r.size}</span>
        <span class="small">${r.finish ? '' : 'interrompu'}</span>
      </button></li>`,
    )
    .join('');
  app.innerHTML = `
    <main class="history">
      <header>
        <button class="link" id="home">← Accueil</button>
        <h2>Historique</h2>
        <label class="link"><input type="checkbox" id="trials" ${showTrials ? 'checked' : ''}> essais</label>
      </header>
      ${runs.length ? `<ul class="runs">${rows}</ul>` : '<p class="note">Rien pour le moment.</p>'}
    </main>`;
  on('#home', showHome);
  app.querySelector<HTMLInputElement>('#trials')!.addEventListener('change', (ev) => {
    showTrials = (ev.target as HTMLInputElement).checked;
    showHistory();
  });
  app.querySelectorAll<HTMLElement>('[data-run]').forEach((el) =>
    el.addEventListener('click', () => {
      const run = summarizeRuns(entries).find((r) => r.runId === el.dataset.run);
      if (run) showRun(run);
    }),
  );
}

function showRun(r: Run): void {
  const rows = r.answers
    .map((a) => {
      const res = a.answer === null ? '<span class="skipped">passé</span>' : a.correct ? '✓' : '✗';
      return `<tr class="${a.correct ? 'good' : 'bad'}">
        <td>${a.index + 1}</td><td>${q2s(a.question)}</td>
        <td>${a.answer ?? ''}</td><td>${res}</td><td>${(a.ms / 1000).toFixed(1)} s</td></tr>`;
    })
    .join('');
  const end = r.finish
    ? { time: 'temps écoulé', all_answered: 'tout répondu', stopped: 'arrêté' }[r.finish.reason]
    : 'interrompu';
  app.innerHTML = `
    <main class="history">
      <header>
        <button class="link" id="back">← Historique</button>
        <h2>${r.score} / ${r.size}</h2>
        <span class="tag ${r.mode}">${r.mode === 'essai' ? 'Essai' : 'Pour de vrai'}</span>
      </header>
      <p class="note">${fmtDate(r.startedAt)} · ${fmtDuration(r.timeLimitSec)} · ${end}</p>
      <table class="answers"><thead><tr><th>#</th><th>Calcul</th><th>Réponse</th><th></th><th>Temps</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </main>`;
  on('#back', showHistory);
}

// ---------- backup ----------

async function saveBackup(): Promise<void> {
  await writes;
  const text = toJsonl(entries);
  const name = `devoirs-sauvegarde-${new Date().toISOString().slice(0, 10)}.jsonl`;
  const file = new File([text], name, { type: 'text/plain' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return; // cancelled
    console.error('backup failed', err);
    alert("La sauvegarde n'a pas marché.");
    return;
  }
  record({ type: 'backup_saved', entries: entries.length });
  showHome();
}

// ---------- keyboard (handy when testing on the Mac) ----------

document.addEventListener('keydown', (ev) => {
  if (!live) return;
  if (/^[0-9]$/.test(ev.key)) press(ev.key);
  else if (ev.key === 'Backspace') press('⌫');
  else if (ev.key === 'Enter') press('OK');
});

// ---------- start ----------

async function boot(): Promise<void> {
  try {
    store = await openStore();
    entries = await store.all();
  } catch (err) {
    console.error('store failed', err);
    saveError = true;
  }
  void requestPersistence();
  showHome();
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(console.error);
  }
}

void boot();
