import { CHAPTERS, CONTROLS, ENDINGS, ROMAN } from './content.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { AudioEngine } from './audio.js';
import { freshSave, loadSave, loadSettings, persistSave, validateSave, DEFAULT_SETTINGS, SETTINGS_KEY } from './storage.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#game');
const frame = $('#game-frame');
const modalLayer = $('#modal-layer');
const modal = $('#modal');
const startupWarnings = [];
let persistenceEnabled = true;
let save, settings;
try { save = loadSave(localStorage); }
catch (error) { save = freshSave(); persistenceEnabled = false; startupWarnings.push(`Save unavailable: ${error.message} Progress is session-only until you start a new pilgrimage or import a save.`); }
try { settings = loadSettings(localStorage); }
catch (error) { settings = { ...DEFAULT_SETTINGS }; startupWarnings.push(`Settings could not be loaded: ${error.message}`); }
if (matchMedia('(prefers-reduced-motion: reduce)').matches) settings.reducedMotion = true;

let modalState = null;
let toastTimer = null;
let announcementTimer = null;
let pendingVictory = null;
let soundChosen = false;
let wasTouch = false;
let previousFocus = null;
const input = new Input(canvas);
const audio = new AudioEngine(settings, message => toast(message, 8000));
const renderer = new Renderer(canvas, settings);
let game = new Game(save, settings, gameEvent);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function toast(text, duration = 4400) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, duration);
}

function saveProgress() {
  if (!persistenceEnabled) return;
  try { persistSave(localStorage, game.save); }
  catch (error) { persistenceEnabled = false; toast(`Progress could not be saved: ${error.message} Keep this tab open or export your save from Settings.`, 9000); }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  catch (error) { toast(`Settings could not be saved: ${error.message}`, 6000); }
}

function updatePresentation() {
  const menu = game.mode === 'menu' || modalState?.returnMode === 'menu';
  $('#home-screen').hidden = !menu;
  $('#hud').hidden = menu;
  frame.classList.toggle('playing', !menu);
  $('#begin-label').textContent = game.save.started ? 'Continue the pilgrimage' : 'Begin the pilgrimage';
  $('#new-button').hidden = !game.save.started;
  const touch = settings.touch === 'on' || settings.touch === 'auto' && (matchMedia('(pointer: coarse)').matches || input.lastDevice === 'touch');
  $('#touch-controls').hidden = !touch || menu || !!modalState || game.mode !== 'playing';
  frame.classList.toggle('touch-mode', touch);
  document.body.classList.toggle('reduce-motion', settings.reducedMotion);
  $('#sound-state').textContent = settings.sound ? 'SOUND ON' : 'SOUND OFF';
  $('#sound-button').classList.toggle('muted', !settings.sound);
  $('#sound-button').setAttribute('aria-label', settings.sound ? 'Mute sound' : 'Enable sound');
  $('#sound-button').setAttribute('aria-pressed', String(settings.sound));
  document.querySelectorAll('[data-chapter]').forEach(button => {
    const index = Number(button.dataset.chapter);
    button.classList.toggle('current', index === game.save.chapter);
    button.classList.toggle('locked', index > game.save.unlocked);
    button.setAttribute('aria-label', `${CHAPTERS[index].name}${index > game.save.unlocked ? ', locked' : game.save.defeated.includes(index) ? ', completed' : ', available'}`);
    const marker = button.querySelector('.chapter-marker');
    if (marker) marker.textContent = game.save.defeated.includes(index) ? '✧' : index <= game.save.unlocked ? '◇' : '·';
  });
  input.active = !modalState && game.mode === 'playing';
  wasTouch = touch;
}

function showModal(html, { dismiss = true, wide = false, kind = 'generic', onClose = null } = {}) {
  const returnMode = modalState?.returnMode ?? (['rest', 'lore'].includes(game.mode) ? 'playing' : game.mode);
  if (!modalState) previousFocus = document.activeElement;
  modalState = { returnMode, dismiss, kind, onClose: onClose ?? modalState?.onClose ?? null };
  if (game.mode === 'playing') game.mode = 'paused';
  input.clear();
  modal.innerHTML = `${dismiss ? '<button class="modal-close" data-modal-action="close" aria-label="Close dialog">×</button>' : ''}${html}`;
  modal.classList.toggle('wide', wide);
  modalLayer.hidden = false;
  audio.setPaused(true);
  updatePresentation();
  requestAnimationFrame(() => {
    const target = modal.querySelector('button:not(.modal-close):not(:disabled), input, select') || modal.querySelector('button');
    target?.focus({ preventScroll: true });
  });
}

function closeModal(restore = true) {
  if (!modalState) return;
  const state = modalState;
  modalState = null;
  modalLayer.hidden = true;
  if (restore) game.mode = state.returnMode;
  input.clear();
  audio.setPaused(false);
  updatePresentation();
  if (game.mode === 'playing') canvas.focus({ preventScroll: true });
  else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  if (restore) state.onClose?.();
  if (restore && game.mode === 'dead') showDeath();
  else if (restore && game.mode === 'ending') {
    if (game.save.ending) showEnding(game.save.ending);
    else showEndingChoice();
  }
}

function announce(index) {
  clearTimeout(announcementTimer);
  const element = $('#chapter-announcement');
  element.querySelector('span').textContent = `CHAPTER ${ROMAN[index]}`;
  element.querySelector('h2').textContent = CHAPTERS[index].name;
  element.querySelector('p').textContent = CHAPTERS[index].subtitle;
  element.hidden = false;
  element.style.animation = 'none';
  void element.offsetWidth;
  element.style.animation = '';
  announcementTimer = setTimeout(() => { element.hidden = true; }, settings.reducedMotion ? 2500 : 5000);
}

function gameEvent(event) {
  if (event.type === 'save') { saveProgress(); updatePresentation(); }
  else if (event.type === 'sound') audio.play(event.name);
  else if (event.type === 'hint') toast(event.text);
  else if (event.type === 'chapter') {
    audio.theme(event.index);
    pendingVictory = null;
    updatePresentation();
    $('#chapter-number').textContent = `CHAPTER ${ROMAN[event.index]}`;
    $('#chapter-title').textContent = CHAPTERS[event.index].name;
    if (event.story) {
      showModal(`<p class="modal-eyebrow">CHAPTER ${ROMAN[event.index]} · ${CHAPTERS[event.index].motif.toUpperCase()}</p><h2 id="modal-title">${CHAPTERS[event.index].name}</h2><p class="prose">${CHAPTERS[event.index].intro}</p>${event.index === 0 ? '<div class="modal-rule"></div><p class="prose small">Move with <b>A / D</b>. Jump with <b>Space</b>. Strike with <b>J</b>, dodge with <b>Shift</b>, and heal with <b>F</b>. Rest at lamps with <b>E</b> to save your checkpoint and strengthen your hunter.<br>Touch controls and controllers are also supported.</p>' : ''}<div class="modal-actions"><button class="primary-button" data-modal-action="close"><span>Carry the light</span><span>→</span></button><button class="text-button" data-modal-action="controls">Learn the hunt</button></div>`, { onClose: () => announce(event.index) });
    } else announce(event.index);
  } else if (event.type === 'boss') {
    audio.theme(game.save.chapter, true);
    toast(`${event.boss.name} — ${event.boss.epithet}`, 5000);
  } else if (event.type === 'victory') {
    audio.theme(game.save.chapter, false);
    pendingVictory = { text: event.text, name: event.boss.name, time: 5.1 };
    updatePresentation();
  } else if (event.type === 'rest') showRest();
  else if (event.type === 'lore') showLore(event.note);
  else if (event.type === 'death') showDeath();
  else if (event.type === 'respawn') { audio.theme(game.save.chapter); updatePresentation(); canvas.focus({ preventScroll: true }); }
  else if (event.type === 'ending-choice') showEndingChoice();
  else if (event.type === 'ending') showEnding(event.ending);
}

async function setSound(on) {
  if (on && !await audio.unlock()) {
    settings.sound = false; audio.applySettings(); updatePresentation(); return;
  }
  settings.sound = on;
  audio.applySettings(); saveSettings(); updatePresentation();
}

async function startGame() {
  if (!soundChosen) await setSound(true);
  else if (settings.sound) await audio.unlock();
  closeModal(false);
  game.start();
  updatePresentation();
  if (!modalState) canvas.focus({ preventScroll: true });
}

function showPause() {
  if (game.mode !== 'playing') return;
  saveProgress();
  showModal(`<p class="modal-eyebrow">THE WORLD CAN WAIT</p><h2 id="modal-title">A moment of silence.</h2><p class="prose small">${CHAPTERS[game.save.chapter].name} · ${game.save.echoes} echoes carried<br>Progress saves at lamps. Enemies return when you rest or reload.</p><div class="modal-actions"><button class="primary-button" data-modal-action="close">Return to the hunt <span>→</span></button><button class="secondary-button" data-modal-action="controls">Controls</button><button class="secondary-button" data-modal-action="settings">Settings</button><button class="text-button" data-modal-action="home">Return to title</button></div>`, { kind: 'pause' });
}

function showControls() {
  showModal(`<p class="modal-eyebrow">A LAMPLIGHTER’S FIELD GUIDE</p><h2 id="modal-title">Learn the hunt.</h2><table class="controls-table"><thead><tr><th>ACTION</th><th>KEYBOARD / MOUSE</th><th>CONTROLLER</th></tr></thead><tbody>${CONTROLS.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="mechanics-grid"><div><h3>Take your breath.</h3><p>Attacking, parrying, and dodging spend stamina. Stop attacking to recover it. Press J near the end of a swing to chain up to three strikes.</p></div><div><h3>Read the warning.</h3><p>Amber wind-ups can be parried. Press L just before impact, then strike for a riposte. Violet attacks and ground waves must be dodged or jumped.</p></div><div><h3>Reclaim what is yours.</h3><p>The pale portion of lost health can be reclaimed by striking back within four seconds. Dying drops your echoes; reach them before dying again.</p></div><div><h3>A little light.</h3><p>Rest at lamps to refill health and tinctures, set your checkpoint, and buy upgrades. Resting revives common enemies. Jump, then dodge for extra distance.</p></div></div><div class="modal-actions"><button class="primary-button" data-modal-action="close">I am ready <span>→</span></button><button class="text-button" data-modal-action="settings">Accessibility & difficulty</button></div>`, { wide: true, kind: 'controls', onClose: modalState?.onClose });
}

function showChapters() {
  showModal(`<p class="modal-eyebrow">FIVE DISTRICTS. ONE DESCENT.</p><h2 id="modal-title">The pilgrimage.</h2><p class="prose small">Defeat each guardian to open the next district. Returning to an unlocked district begins at its first lamp; your upgrades and defeated guardians remain.</p><div class="chapter-list">${CHAPTERS.map((chapter, i) => `<button class="chapter-choice" data-travel="${i}" ${i > game.save.unlocked ? 'disabled' : ''}><b>${ROMAN[i]}</b><span>${chapter.name}<small>${chapter.subtitle}</small></span><em>${game.save.defeated.includes(i) ? 'LAID TO REST' : i > game.save.unlocked ? 'SEALED' : 'ENTER →'}</em></button>`).join('')}</div><div class="modal-actions"><button class="text-button" data-modal-action="close">Return</button></div>`, { kind: 'chapters' });
}

function showJournal() {
  const notes = game.save.notes, defeated = game.save.defeated;
  showModal(`<p class="modal-eyebrow">WHAT THE CITY REMEMBERS</p><h2 id="modal-title">The archive.</h2><p class="prose small">You are Vesper’s last lamplighter. Your sister Mara rang the forbidden hundredth bell. These are the truths you have brought back from the dark.</p>${CHAPTERS.map((chapter, i) => `<article class="journal-note"><small>CHAPTER ${ROMAN[i]} · ${chapter.name.toUpperCase()}</small><h3>${notes.includes(i) ? chapter.note.title : 'An unwritten memory'}</h3><p>${notes.includes(i) ? chapter.note.text : 'Find the forgotten letter in this district.'}</p>${defeated.includes(i) ? `<div class="modal-rule"></div><h3>${chapter.boss.name}</h3><p>${chapter.bossAfter}</p>` : ''}</article>`).join('')}${game.save.ending ? `<article class="journal-note"><h3>${ENDINGS[game.save.ending].title}</h3><p>${ENDINGS[game.save.ending].text}</p></article>` : ''}<div class="modal-actions"><button class="primary-button" data-modal-action="close">Close the archive</button></div>`, { kind: 'journal' });
}

function showSettings() {
  showModal(`<p class="modal-eyebrow">MAKE THE NIGHT YOURS</p><h2 id="modal-title">Settings.</h2>
    <div class="settings-row"><label for="setting-sound">Sound enabled<small>Original synthesized music and sound effects.</small></label><input id="setting-sound" data-setting="sound" type="checkbox" ${settings.sound ? 'checked' : ''}></div>
    <div class="settings-row"><label for="setting-music">Music <span id="music-percent">${Math.round(settings.music * 100)}%</span></label><input id="setting-music" data-setting="music" aria-label="Music volume" type="range" min="0" max="1" step=".05" value="${settings.music}"></div>
    <div class="settings-row"><label for="setting-effects">Sound effects <span id="effects-percent">${Math.round(settings.effects * 100)}%</span></label><input id="setting-effects" data-setting="effects" aria-label="Sound effects volume" type="range" min="0" max="1" step=".05" value="${settings.effects}"></div>
    <div class="settings-row"><label for="setting-difficulty">The burden<small>Pilgrim reduces incoming damage by 38% and provides a fourth tincture at your next rest. No story content is locked.</small></label><select id="setting-difficulty" data-setting="difficulty"><option value="standard" ${settings.difficulty === 'standard' ? 'selected' : ''}>Standard</option><option value="pilgrim" ${settings.difficulty === 'pilgrim' ? 'selected' : ''}>Pilgrim · gentler</option></select></div>
    <div class="settings-row"><label for="setting-shake">Camera shake</label><input id="setting-shake" data-setting="shake" type="checkbox" ${settings.shake ? 'checked' : ''}></div>
    <div class="settings-row"><label for="setting-particles">Atmospheric particles<small>Disable rain and particles for lighter performance.</small></label><input id="setting-particles" data-setting="particles" type="checkbox" ${settings.particles ? 'checked' : ''}></div>
    <div class="settings-row"><label for="setting-reducedMotion">Reduced motion<small>Disables camera shake, weather animation, and menu motion.</small></label><input id="setting-reducedMotion" data-setting="reducedMotion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}></div>
    <div class="settings-row"><label for="setting-touch">Touch controls<small>Landscape orientation is recommended on phones.</small></label><select id="setting-touch" data-setting="touch"><option value="auto" ${settings.touch === 'auto' ? 'selected' : ''}>Automatic</option><option value="on" ${settings.touch === 'on' ? 'selected' : ''}>Always show</option><option value="off" ${settings.touch === 'off' ? 'selected' : ''}>Hide</option></select></div>
    <p class="settings-warning">${persistenceEnabled ? 'Your pilgrimage is saved on this browser and device. Export a backup to move it elsewhere.' : 'Browser saving is unavailable. Export a backup before closing this tab.'}</p>
    <div class="modal-actions"><button class="primary-button" data-modal-action="close">Keep these settings</button><button class="text-button" data-modal-action="export">Export save</button><button class="text-button" data-modal-action="import">Import save</button><input type="file" id="save-import" accept=".json,application/json" hidden></div>`, { kind: 'settings' });
}

function showRest() {
  const cost = stat => 80 * (game.save[stat] + 1);
  showModal(`<p class="modal-eyebrow">THE WAYWARD LAMP</p><h2 id="modal-title">Keep a little morning.</h2><p class="prose small">Your wounds are mended. Your tinctures are filled.<br>The city’s lesser horrors stir again. Your checkpoint is set.</p><div class="resource-row"><b>✧</b> ${game.save.echoes} echoes to remember</div><div class="upgrade-grid"><div class="upgrade-card"><h3>Tempered heart</h3><p>Vitality ${game.save.vitality} / 5<br>${game.maxHp} maximum health · +20 per level</p><button class="secondary-button" data-upgrade="vitality" ${game.save.vitality >= 5 || game.save.echoes < cost('vitality') ? 'disabled' : ''}>${game.save.vitality >= 5 ? 'Fully tempered' : `Offer ${cost('vitality')} echoes`}</button></div><div class="upgrade-card"><h3>Honed steel</h3><p>Blade ${game.save.blade} / 5<br>${game.damage} base damage · +7 per level</p><button class="secondary-button" data-upgrade="blade" ${game.save.blade >= 5 || game.save.echoes < cost('blade') ? 'disabled' : ''}>${game.save.blade >= 5 ? 'Fully honed' : `Offer ${cost('blade')} echoes`}</button></div></div><div class="modal-actions"><button class="primary-button" data-modal-action="close">Leave the lamp <span>→</span></button><button class="text-button" data-modal-action="chapters">Travel</button></div>`, { kind: 'rest' });
}

function showLore(note) {
  showModal(`<p class="modal-eyebrow">A MEMORY RECOVERED</p><h2 id="modal-title">${note.title}</h2><p class="prose">${note.text}</p><p class="settings-warning">This memory is now in your archive.</p><div class="modal-actions"><button class="primary-button" data-modal-action="close">Remember <span>→</span></button></div>`, { kind: 'lore' });
}

function showDeath() {
  pendingVictory = null;
  audio.theme(game.save.chapter);
  showModal(`<div class="text-center"><span class="death-mark">◇</span><p class="modal-eyebrow">DEATH IS A DEBT. NOT AN END.</p><h2 class="death-title" id="modal-title">The bell remembers.</h2><p class="prose">${game.save.bloodstain ? `${game.save.bloodstain.amount} echoes wait where your light went out.<br>Reach them before the dark takes you again.` : 'You have nothing left to lose but the way.<br>Your light is waiting at the last lamp.'}</p><p class="settings-warning">Watch the enemy’s wind-up. Dodge through strikes, not away.<br>Pilgrim difficulty is available in Settings.</p><div class="modal-actions"><button class="primary-button" data-modal-action="respawn">Rise again <span>→</span></button><button class="text-button" data-modal-action="home">Return to title</button></div></div>`, { dismiss: false, kind: 'death' });
}

function showEndingChoice() {
  showModal(`<p class="modal-eyebrow">THE HUNDREDTH BELL</p><h2 id="modal-title">There is another way.</h2><p class="prose">${CHAPTERS[4].bossAfter}</p><div class="ending-options"><button data-ending="dawn"><strong>Silence the bell.</strong><span>Give the city its dawn, and its mortality. Let the borrowed years return.</span></button><button data-ending="keeper"><strong>Become its keeper.</strong><span>Carry a light for those who must leave. No one will walk the dark alone.</span></button></div>`, { dismiss: false, kind: 'ending-choice' });
}

function showEnding(ending) {
  const content = ENDINGS[ending];
  showModal(`<div class="text-center"><p class="modal-eyebrow">${content.subtitle}</p><h2 id="modal-title">${content.title}</h2><p class="prose">${content.text}</p><div class="modal-rule"></div><p class="modal-eyebrow">THE PILGRIMAGE IS COMPLETE</p><div class="stats-line"><span>5 GUARDIANS FREED</span><span>${game.save.deaths} DEATHS</span><span>${Math.max(1, Math.round(game.save.playtime / 60))} MINUTES</span></div><div class="modal-actions"><button class="primary-button" data-modal-action="home">Return to Vesper <span>→</span></button><button class="text-button" data-modal-action="journal">Read your memories</button></div></div>`, { dismiss: false, kind: 'ending' });
}

function showNewConfirmation() {
  showModal(`<p class="modal-eyebrow">A NEW PILGRIMAGE</p><h2 id="modal-title">Let this memory go?</h2><p class="prose">Starting again replaces the pilgrimage saved in this browser, including your upgrades and memories. Export a backup first if you want to keep it.</p><div class="modal-actions"><button class="secondary-button" data-modal-action="close">Keep my pilgrimage</button><button class="primary-button" data-modal-action="new-confirm">Begin again</button><button class="text-button" data-modal-action="export">Export save</button></div>`, { kind: 'new' });
}

function returnHome() {
  closeModal(false);
  saveProgress();
  game.mode = 'menu';
  pendingVictory = null;
  input.clear();
  audio.theme(0);
  updatePresentation();
  $('#begin-button').focus({ preventScroll: true });
}

const openers = { controls: showControls, chapters: showChapters, journal: showJournal, settings: showSettings };
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openers[button.dataset.open]()));
document.querySelectorAll('[data-chapter]').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.chapter);
  if (index > game.save.unlocked) { toast(`Defeat ${CHAPTERS[index - 1].boss.name} to open this district.`); return; }
  showChapters();
}));
$('#begin-button').addEventListener('click', startGame);
$('#new-button').addEventListener('click', showNewConfirmation);
$('#pause-button').addEventListener('click', showPause);
$('#sound-button').addEventListener('click', () => { soundChosen = true; void setSound(!settings.sound); });
$('#fullscreen-button').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (frame.requestFullscreen) await frame.requestFullscreen();
    else toast('Fullscreen is not supported in this browser. Landscape orientation offers the largest play area.');
  } catch (error) { toast(`Fullscreen could not start: ${error.message}`); }
});
document.addEventListener('fullscreenchange', () => $('#fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));

modal.addEventListener('click', async e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.travel !== undefined) {
    const index = Number(button.dataset.travel);
    if (!soundChosen) await setSound(true);
    closeModal(false);
    game.save.started = true;
    game.enterChapter(index);
    updatePresentation();
  } else if (button.dataset.upgrade) {
    if (game.upgrade(button.dataset.upgrade)) showRest();
    else toast('The lamp cannot grant this upgrade. You may need more echoes.');
  } else if (button.dataset.ending) {
    closeModal(false);
    game.finish(button.dataset.ending);
    audio.play('victory');
  } else {
    const action = button.dataset.modalAction;
    if (action === 'close') closeModal();
    else if (openers[action]) openers[action]();
    else if (action === 'home') returnHome();
    else if (action === 'respawn') { closeModal(false); game.respawn(); }
    else if (action === 'new-confirm') {
      closeModal(false);
      game = new Game(freshSave(), settings, gameEvent);
      persistenceEnabled = true;
      pendingVictory = null;
      await startGame();
    } else if (action === 'export') {
      const blob = new Blob([JSON.stringify(game.save, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'vesper-pilgrimage.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Your pilgrimage has been exported.');
    } else if (action === 'import') $('#save-import').click();
    else if (action === 'import-confirm') {
      const imported = modalState.imported;
      closeModal(false);
      game = new Game(imported, settings, gameEvent);
      persistenceEnabled = true;
      saveProgress(); updatePresentation();
      toast('Pilgrimage restored. Continue when you are ready.');
    }
  }
});

modal.addEventListener('input', e => {
  const element = e.target, key = element.dataset.setting;
  if (!key) return;
  if (key === 'sound') {
    soundChosen = true;
    void setSound(element.checked);
  } else {
    settings[key] = element.type === 'checkbox' ? element.checked : element.type === 'range' ? Number(element.value) : element.value;
    audio.applySettings(); saveSettings(); updatePresentation();
    if (key === 'music' || key === 'effects') $(`#${key}-percent`).textContent = `${Math.round(settings[key] * 100)}%`;
  }
});

modal.addEventListener('change', async e => {
  if (e.target.id !== 'save-import' || !e.target.files?.length) return;
  const file = e.target.files[0];
  if (file.size > 100000) { toast('This file is too large to be a Vesper save.'); return; }
  try {
    const imported = validateSave(JSON.parse(await file.text()));
    showModal(`<p class="modal-eyebrow">A BORROWED MEMORY</p><h2 id="modal-title">Restore this pilgrimage?</h2><p class="prose">Chapter ${ROMAN[imported.chapter]} · ${escapeHTML(CHAPTERS[imported.chapter].name)}<br>${imported.echoes} echoes · ${imported.defeated.length} guardians freed</p><p class="prose small">This will replace the current save in this browser.</p><div class="modal-actions"><button class="secondary-button" data-modal-action="close">Cancel</button><button class="primary-button" data-modal-action="import-confirm">Restore pilgrimage</button></div>`, { kind: 'import' });
    modalState.imported = imported;
  } catch (error) { toast(`This save could not be imported: ${error.message}`, 7000); }
});

document.addEventListener('keydown', e => {
  if (!modalState) return;
  if (e.code === 'Escape' && modalState.dismiss) { e.preventDefault(); closeModal(); }
  if (e.code === 'Tab') {
    const items = [...modal.querySelectorAll('button:not(:disabled), input:not([hidden]), select, a[href]')].filter(element => element.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
modalLayer.addEventListener('click', e => { if (e.target === modalLayer && modalState?.dismiss) closeModal(); });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.mode === 'playing') showPause();
    saveProgress();
    void audio.suspend().catch(error => toast(`Audio pause failed: ${error.message}`));
  } else if (settings.sound) void audio.unlock();
});
window.addEventListener('blur', () => { if (game.mode === 'playing') showPause(); });
window.addEventListener('beforeunload', saveProgress);
window.addEventListener('gamepadconnected', () => toast('Controller connected. Move with the left stick; A to jump, X to strike.'));
window.addEventListener('gamepaddisconnected', () => { if (game.mode === 'playing') showPause(); toast('Controller disconnected. Keyboard and touch controls remain available.'); });
setInterval(() => { if (game.mode === 'playing') saveProgress(); }, 30000);

function updateHUD() {
  const p = game.player;
  $('#health-fill').style.width = `${p.hp / game.maxHp * 100}%`;
  $('#rally-fill').style.width = `${Math.min(100, (p.hp + p.rally) / game.maxHp * 100)}%`;
  $('#stamina-fill').style.width = `${p.stamina}%`;
  $('#health-value').textContent = `${Math.ceil(p.hp)} / ${game.maxHp}`;
  $('#flask-value').textContent = p.flasks;
  $('#echo-value').textContent = game.save.echoes.toLocaleString();
  const boss = game.boss;
  $('#boss-hud').hidden = !boss.active || boss.hp <= 0;
  if (boss.active) {
    $('#boss-name').textContent = boss.name;
    $('#boss-fill').style.width = `${boss.hp / boss.maxHp * 100}%`;
    $('#boss-health').textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    $('#boss-phase').textContent = boss.phase === 2 ? 'THE NIGHTMARE DEEPENS' : 'FALLEN GUARDIAN';
  }
  const interaction = game.interaction;
  $('#interact-prompt').hidden = !interaction || !!modalState || !$('#chapter-announcement').hidden;
  if (interaction) {
    $('#interact-prompt span').textContent = interaction.text;
    $('#interact-prompt kbd').textContent = input.lastDevice === 'gamepad' ? '↑' : 'E';
  }
  $('#keyboard-hints').hidden = input.lastDevice === 'gamepad';
  if (wasTouch !== (settings.touch === 'on' || settings.touch === 'auto' && (matchMedia('(pointer: coarse)').matches || input.lastDevice === 'touch'))) updatePresentation();
}

let last = performance.now(), accumulator = 0, visualTime = 0, hudFrame = 0;
function frameLoop(now) {
  const elapsed = Math.min((now - last) / 1000, 0.1);
  last = now;
  accumulator += elapsed;
  visualTime += elapsed;
  input.pollGamepad();
  if (!input.active) {
    const next = input.take('uiNext'), previous = input.take('uiPrevious');
    if (next || previous) {
      const container = modalState ? modal : $('#home-screen');
      const buttons = [...container.querySelectorAll('button:not(:disabled), select, input:not([hidden])')].filter(element => element.offsetParent !== null);
      if (buttons.length) {
        const current = buttons.indexOf(document.activeElement);
        buttons[(current + (next ? 1 : -1) + buttons.length) % buttons.length].focus({ preventScroll: false });
      }
    }
    if (input.take('uiConfirm')) {
      const target = document.activeElement instanceof HTMLButtonElement ? document.activeElement : !modalState ? $('#begin-button') : modal.querySelector('button:not(.modal-close):not(:disabled)');
      target?.click();
    }
    if (input.take('uiBack') && modalState?.dismiss) closeModal();
  }
  if (input.take('pause')) {
    if (game.mode === 'playing') showPause();
    else if (modalState?.dismiss) closeModal();
  }
  let stepped = false;
  while (accumulator >= 1 / 60) {
    game.update(1 / 60, input);
    accumulator -= 1 / 60;
    stepped = true;
    if (pendingVictory && game.mode === 'playing') {
      pendingVictory.time -= 1 / 60;
      if (pendingVictory.time <= 0) {
        const memory = pendingVictory;
        pendingVictory = null;
        showLore({ title: memory.name, text: memory.text });
      }
    }
  }
  if (stepped) input.endFrame();
  renderer.render(game, settings.reducedMotion && game.mode === 'menu' ? 8 : visualTime);
  if (hudFrame++ % 3 === 0 && game.mode !== 'menu') updateHUD();
  requestAnimationFrame(frameLoop);
}

updatePresentation();
$('#chapter-number').textContent = `CHAPTER ${ROMAN[game.save.chapter]}`;
$('#chapter-title').textContent = game.level.name;
requestAnimationFrame(frameLoop);
if (startupWarnings.length) toast(startupWarnings.join(' '), 12000);

// Deterministic browser checks can inspect the engine only in a local development build.
if (import.meta.env.DEV) window.__VESPER__ = { get game() { return game; }, input, audio, renderer };
