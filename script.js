const wordsPerPage = 5;
let currentPage = 1;
let isPlayingAll = false;
let playAllIndex = 0;

const container = document.getElementById("vocab-list");
const pagination = document.getElementById("pagination");
const ttsAllBtn = document.getElementById("tts-all");
const daySelect = document.getElementById("day-select");
const dayNumberSpan = document.getElementById("day-number");

let vocab = [];
let voices = [];

// Generate day options 1 to 40
function generateDayOptions() {
  for (let i = 1; i <= 40; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Day ${i}`;
    daySelect.appendChild(option);
  }
}
generateDayOptions();

function loadVoices() {
  voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    setTimeout(loadVoices, 100);
  }
}
loadVoices();
speechSynthesis.onvoiceschanged = loadVoices;

function renderPage(page = 1) {
  container.innerHTML = "";
  pagination.innerHTML = "";
  currentPage = page;

  if (!vocab.length) {
    container.innerHTML = "<p>No vocabulary for this day.</p>";
    return;
  }

  const start = (page - 1) * wordsPerPage;
  const end = start + wordsPerPage;
  const pageVocab = vocab.slice(start, end);

  pageVocab.forEach(word => {
    const card = document.createElement("div");
    card.className = "word-card";
    card.innerHTML = `
      <div class="word-info">
        <strong>${word.korean}</strong> (${word.roman}) - ${word.english} / ${word.nepali}
      </div>
      <div class="word-buttons">
        <button class="tts-button" title="Play Korean" onclick="speakKorean('${word.korean}')">🇰🇷</button>
        <button class="tts-button" title="Play Nepali" onclick="speakNepali('${word.nepali}')">🇳🇵</button>
        
        <a href="https://ko.dict.naver.com/#/search?query=${encodeURIComponent(word.korean)}"
   target="_blank" rel="noopener noreferrer" class="naver-link" title="Naver Dictionary">📘</a>
        
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination();
  resetPlayAll();
}

function renderPagination() {
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => renderPage(currentPage - 1);
  pagination.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === Math.ceil(vocab.length / wordsPerPage);
  nextBtn.onclick = () => renderPage(currentPage + 1);
  pagination.appendChild(nextBtn);
}

function speak(text, lang, voice = null) {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function speakKorean(text) {
  if (isPlayingAll) stopPlayAll();
  const koVoice = voices.find(v => v.lang.startsWith("ko"));
  if (!koVoice) {
    alert("Korean voice not available.");
    return;
  }
  speak(text, koVoice.lang, koVoice);
}

function speakNepali(text) {
  if (isPlayingAll) stopPlayAll();
  const nepaliVoice = voices.find(v => v.lang.startsWith("ne"));
  if (!nepaliVoice) {
    alert("Nepali voice not available on your device/browser.");
    return;
  }
  speak(text, nepaliVoice.lang, nepaliVoice);
}

function resetPlayAll() {
  isPlayingAll = false;
  playAllIndex = 0;
  ttsAllBtn.textContent = "▶ Play All";
  if (speechSynthesis.speaking) speechSynthesis.cancel();
}

function playAll() {
  if (isPlayingAll) {
    stopPlayAll();
    return;
  }

  if (voices.length === 0) {
    alert("Voices are still loading, please try again shortly.");
    return;
  }

  if (!vocab.length) {
    alert("No vocabulary to play.");
    return;
  }

  isPlayingAll = true;
  ttsAllBtn.textContent = "■ Stop";
  playAllIndex = 0;
  playNext();
}

function stopPlayAll() {
  isPlayingAll = false;
  ttsAllBtn.textContent = "▶ Play All";
  speechSynthesis.cancel();
  playAllIndex = 0;
}

function playNext() {
  if (!isPlayingAll) return;

  const start = (currentPage - 1) * wordsPerPage;
  if (playAllIndex >= wordsPerPage || start + playAllIndex >= vocab.length) {
    stopPlayAll();
    return;
  }

  const word = vocab[start + playAllIndex];
  const koVoice = voices.find(v => v.lang.startsWith("ko"));
  const nepaliVoice = voices.find(v => v.lang.startsWith("ne"));

  if (!koVoice) {
    alert("Korean voice not available.");
    stopPlayAll();
    return;
  }

  const utteranceK = new SpeechSynthesisUtterance(word.korean);
  utteranceK.lang = koVoice.lang;
  utteranceK.voice = koVoice;

  utteranceK.onend = () => {
    if (nepaliVoice) {
      const utteranceN = new SpeechSynthesisUtterance(word.nepali);
      utteranceN.lang = nepaliVoice.lang;
      utteranceN.voice = nepaliVoice;
      utteranceN.onend = () => {
        playAllIndex++;
        playNext();
      };
      speechSynthesis.speak(utteranceN);
    } else {
      playAllIndex++;
      playNext();
    }
  };

  speechSynthesis.speak(utteranceK);
}

ttsAllBtn.addEventListener("click", playAll);

daySelect.addEventListener("change", function () {
  const selected = this.value;
  const selectedVocab = window['vocabDay' + selected];
  if (!selectedVocab || selectedVocab.length === 0) {
    vocab = [];
    container.innerHTML = "<p>No vocabulary for this day.</p>";
    pagination.innerHTML = "";
    dayNumberSpan.textContent = selected;
    return;
  }
  vocab = selectedVocab;
  dayNumberSpan.textContent = selected;
  renderPage(1);
});

// On page load, set vocab for day 1 if exists
window.addEventListener('load', () => {
  const initialVocab = window['vocabDay1'] || [];
  vocab = initialVocab;
  renderPage(1);
  daySelect.value = "1";
  dayNumberSpan.textContent = "1";
});