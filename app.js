const START = Date.parse('2026-09-16T00:00:00+05:00');
const WEDDING = Date.parse('2026-09-25T12:00:00+05:00');
function getCountdown(now) {
  const remaining = Math.max(0, Math.ceil((WEDDING - now) / 1000));
  const progress = Math.min(1, Math.max(0, (now - START) / (WEDDING - START)));
  return { days: Math.floor(remaining / 86400), hours: Math.floor(remaining / 3600) % 24, minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60, progress, done: now >= WEDDING };
}
function update() {
  const state = getCountdown(Date.now());
  for (const key of ['days', 'hours', 'minutes', 'seconds']) document.getElementById(key).textContent = String(state[key]).padStart(2, '0');
  document.getElementById('percent').textContent = (state.progress * 100).toFixed(2).replace('.', ',');
  document.getElementById('fill').style.width = `${state.progress * 100}%`;
  document.getElementById('bride').style.left = `${8 + state.progress * 30}%`;
  document.getElementById('groom').style.left = `${92 - state.progress * 30}%`;
  document.getElementById('completion').hidden = !state.done;
  document.body.classList.toggle('arrived', state.done);
  if (state.done) { celebrate(); document.getElementById('subtitle').textContent = 'Bugun ikki qalbning eng baxtli kuni!'; document.getElementById('journey-message').textContent = 'Endi bir umr birga ♥'; }
}
setInterval(update, 1000);
document.addEventListener('visibilitychange', update);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let celebrationShown = false;
function celebrate() {
  if (celebrationShown) return;
  celebrationShown = true;
  document.querySelector('h1').innerHTML = 'Baxtli kun keldi!<br><em>Bir umrga birga.</em>';
  if (reducedMotion.matches) return;
  const container = document.getElementById('confetti');
  for (let i = 0; i < 75; i++) {
    const flake = document.createElement('i');
    flake.style.cssText = `left:${Math.random()*100}%;--delay:${Math.random()*2}s;--fall:${4+Math.random()*3}s;--drift:${Math.random()*220-110}px;background:${['#d9b87a','#f8f2e7','#af8747'][i%3]}`;
    container.appendChild(flake);
  }
  setTimeout(() => container.replaceChildren(), 10000);
}
const dust = document.getElementById('gold-dust');
for (let i = 0; i < 22; i++) {
  const dot = document.createElement('i');
  dot.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--delay:-${Math.random()*16}s;--float:${12+Math.random()*14}s;--size:${2+Math.random()*2}px`;
  dust.appendChild(dot);
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) document.getElementById('confetti').replaceChildren(); });

// A quiet original instrumental: soft arpeggios, played only after a tap.
let audioContext, master, musicTimer, nextNoteTime = 0, noteIndex = 0;
let musicPlaying = false;
const musicButton = document.getElementById('music-toggle');
const melody = [60,64,67,72,67,64, 57,60,64,69,64,60, 53,57,60,65,60,57, 55,59,62,67,62,59];
function note(midi, when, volume = 0.13) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(volume, when + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 2.7);
  oscillator.connect(gain); gain.connect(master);
  oscillator.start(when); oscillator.stop(when + 2.8);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function scheduleMusic() {
  while (nextNoteTime < audioContext.currentTime + 0.4) {
    note(melody[noteIndex % melody.length], nextNoteTime);
    if (noteIndex % 6 === 0) note(melody[noteIndex % melody.length] - 12, nextNoteTime, 0.09);
    nextNoteTime += 0.52; noteIndex++;
  }
}
function renderMusic() {
  musicButton.setAttribute('aria-pressed', String(musicPlaying));
  document.getElementById('music-label').textContent = musicPlaying ? 'Musiqani to‘xtatish' : 'Musiqani yoqish';
}
async function stopMusic() {
  clearInterval(musicTimer); musicPlaying = false; renderMusic();
  if (audioContext?.state === 'running') await audioContext.suspend();
}
musicButton.addEventListener('click', async () => {
  musicButton.disabled = true;
  try {
    if (musicPlaying) { await stopMusic(); return; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Audio unavailable');
    if (!audioContext) {
      audioContext = new Audio(); master = audioContext.createGain(); master.gain.value = 0.55; master.connect(audioContext.destination);
    }
    await audioContext.resume();
    nextNoteTime = audioContext.currentTime + 0.05;
    musicPlaying = true; scheduleMusic(); musicTimer = setInterval(scheduleMusic, 150); renderMusic();
    document.getElementById('music-status').textContent = '';
  } catch {
    document.getElementById('music-status').textContent = 'Musiqa yoqilmadi. Qayta urinib ko‘ring yoki Safari / Chrome’da oching.';
    await stopMusic();
  } finally { musicButton.disabled = false; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && musicPlaying) stopMusic(); });

let installPrompt;
const installButton = document.getElementById('install-button');
const installDialog = document.getElementById('install-help');
const standalone = window.matchMedia('(display-mode: standalone)');
function installState() { installButton.hidden = standalone.matches || navigator.standalone === true; }
installState(); standalone.addEventListener('change', installState);
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; if (installDialog.open) installDialog.close(); });
installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt; installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; return; } catch { /* Show platform instructions below. */ }
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  document.getElementById('install-instructions').textContent = isIOS
    ? 'Safari’da “Ulashish” (Share) tugmasini bosing → “Bosh ekranga qo‘shish” (Add to Home Screen) → “Qo‘shish” (Add).'
    : 'Chrome menyusini (⋮) oching → “Bosh ekranga qo‘shish” yoki “Ilovani o‘rnatish” bandini tanlang. Kompyuterda o‘rnatish belgisi manzil qatorida ham ko‘rinishi mumkin.';
  installDialog.showModal();
});
document.getElementById('install-close').addEventListener('click', () => installDialog.close());
installDialog.addEventListener('click', event => { if (event.target === installDialog) { const r = installDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) installDialog.close(); } });
update();
