import { WORDS } from './words.js';

const NUMBER_OF_GUESSES = 6;
const FLIP_MS = 350;
const PAD_MS = 120;
const WORD_SET = new Set(WORDS.map(w => w.toLowerCase()));

let guessesRemaining, currentGuess, nextLetter, answer;

const palette = {
  success: '#27ae60',
  error:   '#e74c3c',
  info:    '#f39c12'
};

const boardEl      = document.getElementById('game-board');
const playAgainBtn = document.getElementById('play-again-btn');

const showToast = (text, type = 'info') =>
  Toastify({
    text,
    duration: 3000,
    gravity: 'top',
    position: 'center',
    style: {
      background: palette[type] ?? '#333',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '8px'
    }
  }).showToast();

const initGame = () => {
  guessesRemaining = NUMBER_OF_GUESSES;
  currentGuess = [];
  nextLetter = 0;
  answer = WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();

  boardEl.innerHTML = '';
  for (let r = 0; r < NUMBER_OF_GUESSES; r++) {
    const row = document.createElement('div');
    row.className = 'letter-row';
    for (let c = 0; c < 5; c++) {
      const box = document.createElement('div');
      box.className = 'letter-box';
      row.appendChild(box);
    }
    boardEl.appendChild(row);
  }

  document
    .querySelectorAll('.keyboard-button')
    .forEach(btn => btn.classList.remove('correct', 'present', 'absent'));

  playAgainBtn.style.display = 'none';
};

const resetGameAnimated = () => {
  boardEl.classList.add('fade-out');
  boardEl.addEventListener(
    'animationend',
    () => {
      boardEl.classList.remove('fade-out');
      initGame();
      boardEl.classList.add('fade-in');
      boardEl.addEventListener(
        'animationend',
        () => boardEl.classList.remove('fade-in'),
        { once: true }
      );
    },
    { once: true }
  );
};

const deleteLetter = () => {
  if (!nextLetter) return;
  const row =
    document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
  const box = row.children[nextLetter - 1];
  box.textContent = '';
  box.classList.remove('filled-box');
  currentGuess.pop();
  nextLetter--;
};

const insertLetter = key => {
  if (nextLetter === 5) return;
  const row =
    document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
  const box = row.children[nextLetter];
  box.textContent = key;
  box.classList.add('filled-box');
  currentGuess.push(key);
  nextLetter++;
};

const scoreGuess = (guess, answerArr) => {
  const result = Array(5).fill('absent');
  const freq = {};
  answerArr.forEach(ch => (freq[ch] = (freq[ch] || 0) + 1));

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answerArr[i]) {
      result[i] = 'correct';
      freq[guess[i]]--;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'absent' && freq[guess[i]] > 0) {
      result[i] = 'present';
      freq[guess[i]]--;
    }
  }
  return result;
};

const colourKey = (letter, state) => {
  document.querySelectorAll('.keyboard-button').forEach(btn => {
    if (btn.textContent.toLowerCase() === letter && !btn.classList.contains('correct')) {
      btn.classList.remove('present', 'absent');
      btn.classList.add(state);
    }
  });
};

const checkGuess = () => {
  const rowIdx = NUMBER_OF_GUESSES - guessesRemaining;
  const row = document.getElementsByClassName('letter-row')[rowIdx];
  const guess = currentGuess.join('').toLowerCase();

  if (guess.length !== 5)      return showToast('⏳ Not enough letters!', 'info');
  if (!WORD_SET.has(guess))    return showToast('⛔ Word not in list!', 'error');

  const score = scoreGuess(currentGuess, [...answer]);
  score.forEach((state, i) => {
    const box    = row.children[i];
    const letter = currentGuess[i];
    setTimeout(() => {
      box.classList.add(state);
      colourKey(letter, state);
    }, i * FLIP_MS);
  });

  setTimeout(() => {
    if (guess === answer) {
      showToast('🎉 You guessed right!', 'success');
      playAgainBtn.style.display = 'block';
    } else {
      guessesRemaining--;
      currentGuess = [];
      nextLetter = 0;

      if (!guessesRemaining) {
        showToast(`💀 Game over! The word was "${answer.toUpperCase()}"`, 'error');
        playAgainBtn.style.display = 'block';
      }
    }
  }, 5 * FLIP_MS + PAD_MS);
};

document.addEventListener('keyup', e => {
  if (playAgainBtn.style.display === 'block') return;
  const key = e.key;
  if (key === 'Backspace') return deleteLetter();
  if (key === 'Enter')     return checkGuess();
  if (/^[a-z]$/i.test(key)) insertLetter(key.toLowerCase());
});

document.getElementById('keyboard-cont').addEventListener('click', e => {
  const btn = e.target;
  if (!btn.classList.contains('keyboard-button')) return;
  let key = btn.textContent;
  if (key === 'Del') key = 'Backspace';
  document.dispatchEvent(new KeyboardEvent('keyup', { key }));
});

playAgainBtn.addEventListener('click', resetGameAnimated);

initGame();
