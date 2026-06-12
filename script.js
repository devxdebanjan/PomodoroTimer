// DOM Elements
const timeLeftDisplay = document.getElementById('time-left');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const totalFocusDisplay = document.getElementById('total-focus-display');

// Dark Mode Elements
const darkModeBtn = document.getElementById('dark-mode-btn');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const focusDurationInput = document.getElementById('focus-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const alarmSoundSelect = document.getElementById('alarm-sound');
const testAudioBtn = document.getElementById('test-audio-btn');

// Notes Elements
const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note-btn');
const notesList = document.getElementById('notes-list');
const notesCount = document.getElementById('notes-count');
const notesEmpty = document.getElementById('notes-empty');

// State
let timer;
let isRunning = false;
let currentMode = 'focus'; // focus, shortBreak, longBreak
let timeLeft = 25 * 60; // in seconds
let sessionFocusSeconds = 0; // accumulated focus time in current session
let notes = []; // Array of { id, text, checked }

// Settings
let durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

// Web Audio API Context
let audioCtx = null;

// Initialize
function init() {
    loadSettings();
    loadDailyStats();
    loadDarkMode();
    loadNotes();
    switchMode(currentMode);
    setupEventListeners();
    checkMidnightReset();
    
    // Check for midnight every minute
    setInterval(checkMidnightReset, 60000);
}

function setupEventListeners() {
    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Dark Mode
    darkModeBtn.addEventListener('click', toggleDarkMode);

    // Settings
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    testAudioBtn.addEventListener('click', () => playSound(alarmSoundSelect.value));
    
    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if(e.target === settingsModal) {
            closeSettings();
        }
    });

    // Notes
    addNoteBtn.addEventListener('click', addNote);
    noteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addNote();
    });
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timeLeftDisplay.textContent = formattedTime;
    document.title = `${formattedTime} - ${currentMode === 'focus' ? 'Focus' : 'Break'}`;
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timer);
        startBtn.textContent = 'Start';
        isRunning = false;
    } else {
        startBtn.textContent = 'Pause';
        isRunning = true;
        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (currentMode === 'focus') {
                sessionFocusSeconds++;
            }

            if (timeLeft <= 0) {
                handleTimerComplete();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = 'Start';
    
    // Commit accumulated focus seconds to daily stats
    if (sessionFocusSeconds > 0) {
        addFocusTime(sessionFocusSeconds);
        sessionFocusSeconds = 0;
    }
    
    timeLeft = durations[currentMode];
    updateDisplay();
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update active button
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Theme Colors via CSS variables
    const root = document.body;
    if (mode === 'focus') {
        root.style.setProperty('--bg-color', 'var(--focus-bg)');
        root.style.setProperty('--primary-color', 'var(--focus-color)');
    } else if (mode === 'shortBreak') {
        root.style.setProperty('--bg-color', 'var(--short-break-bg)');
        root.style.setProperty('--primary-color', 'var(--short-break-color)');
    } else if (mode === 'longBreak') {
        root.style.setProperty('--bg-color', 'var(--long-break-bg)');
        root.style.setProperty('--primary-color', 'var(--long-break-color)');
    }

    resetTimer();
}

function handleTimerComplete() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = 'Start';
    
    // Play sound
    playSound(localStorage.getItem('pomodoroSound') || 'chime');
    
    // Auto switch mode suggestion or just reset
    if (currentMode === 'focus') {
        switchMode('shortBreak');
    } else {
        switchMode('focus');
    }
}

// ---- Daily Stats Logic ----
function loadDailyStats() {
    const today = new Date().toLocaleDateString();
    const storedDate = localStorage.getItem('pomodoroDate');
    
    if (storedDate !== today) {
        // New day, reset stats
        localStorage.setItem('pomodoroDate', today);
        localStorage.setItem('pomodoroFocusTime', '0');
    }
    
    updateStatsDisplay();
}

function addFocusTime(seconds) {
    checkMidnightReset(); // Ensure we are adding to the correct day
    
    let totalSeconds = parseInt(localStorage.getItem('pomodoroFocusTime') || '0', 10);
    totalSeconds += seconds;
    localStorage.setItem('pomodoroFocusTime', totalSeconds.toString());
    
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const totalSeconds = parseInt(localStorage.getItem('pomodoroFocusTime') || '0', 10);
    const minutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        const remainingMins = minutes % 60;
        totalFocusDisplay.textContent = `${hours}h ${remainingMins}m`;
    } else {
        totalFocusDisplay.textContent = `${minutes}m`;
    }
}

function checkMidnightReset() {
    const today = new Date().toLocaleDateString();
    const storedDate = localStorage.getItem('pomodoroDate');
    
    if (storedDate && storedDate !== today) {
        localStorage.setItem('pomodoroDate', today);
        localStorage.setItem('pomodoroFocusTime', '0');
        updateStatsDisplay();
    }
}

// ---- Settings Logic ----
function loadSettings() {
    const savedFocus = localStorage.getItem('pomodoroFocusDuration');
    const savedShort = localStorage.getItem('pomodoroShortBreakDuration');
    const savedLong = localStorage.getItem('pomodoroLongBreakDuration');
    const savedSound = localStorage.getItem('pomodoroSound');

    if (savedFocus) durations.focus = parseInt(savedFocus) * 60;
    if (savedShort) durations.shortBreak = parseInt(savedShort) * 60;
    if (savedLong) durations.longBreak = parseInt(savedLong) * 60;

    focusDurationInput.value = durations.focus / 60;
    shortBreakDurationInput.value = durations.shortBreak / 60;
    longBreakDurationInput.value = durations.longBreak / 60;
    
    if (savedSound) {
        alarmSoundSelect.value = savedSound;
    }
    
    timeLeft = durations[currentMode];
}

function openSettings() {
    settingsModal.classList.remove('hidden');
    // Pause timer if running
    if (isRunning) {
        toggleTimer();
    }
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const focusMins = parseInt(focusDurationInput.value) || 25;
    const shortMins = parseInt(shortBreakDurationInput.value) || 5;
    const longMins = parseInt(longBreakDurationInput.value) || 15;
    const sound = alarmSoundSelect.value;
    
    durations.focus = focusMins * 60;
    durations.shortBreak = shortMins * 60;
    durations.longBreak = longMins * 60;
    
    localStorage.setItem('pomodoroFocusDuration', focusMins);
    localStorage.setItem('pomodoroShortBreakDuration', shortMins);
    localStorage.setItem('pomodoroLongBreakDuration', longMins);
    localStorage.setItem('pomodoroSound', sound);
    
    closeSettings();
    resetTimer(); // Apply new times
}

// ---- Dark Mode Logic ----
function loadDarkMode() {
    const isDark = localStorage.getItem('pomodoroDarkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
    updateDarkModeIcon(isDark);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('pomodoroDarkMode', isDark);
    updateDarkModeIcon(isDark);
}

function updateDarkModeIcon(isDark) {
    if (isDark) {
        moonIcon.classList.add('d-none');
        sunIcon.classList.remove('d-none');
    } else {
        sunIcon.classList.add('d-none');
        moonIcon.classList.remove('d-none');
    }
}

// ---- Audio Generation using Web Audio API ----
function playSound(type) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const t = audioCtx.currentTime;

    if (type === 'chime') {
        // Gentle Chime
        playOscillator('sine', 523.25, t, 0.5, 0.5); // C5
        playOscillator('sine', 659.25, t + 0.1, 0.5, 0.5); // E5
        playOscillator('sine', 783.99, t + 0.2, 0.5, 1.5); // G5
        playOscillator('sine', 1046.50, t + 0.3, 0.5, 2.0); // C6
    } else if (type === 'bell') {
        // Soft Bell
        playOscillator('triangle', 880, t, 0.8, 1.5); // A5
        playOscillator('sine', 1760, t, 0.3, 1.0); // A6
    } else if (type === 'beep') {
        // Digital Beep
        playOscillator('square', 600, t, 0.2, 0.1);
        playOscillator('square', 600, t + 0.2, 0.2, 0.1);
        playOscillator('square', 600, t + 0.4, 0.2, 0.3);
    }
}

function playOscillator(type, frequency, startTime, volume, duration) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05); // attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // decay

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

// ---- Notes Logic ----
function loadNotes() {
    const saved = localStorage.getItem('pomodoroNotes');
    if (saved) {
        try {
            notes = JSON.parse(saved);
        } catch (e) {
            notes = [];
        }
    }
    renderNotes();
}

function saveNotes() {
    localStorage.setItem('pomodoroNotes', JSON.stringify(notes));
}

function addNote() {
    const text = noteInput.value.trim();
    if (!text) return;

    const note = {
        id: Date.now().toString(),
        text: text,
        checked: false
    };

    notes.push(note);
    saveNotes();
    renderNotes();
    noteInput.value = '';
    noteInput.focus();
}

function toggleNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.checked = !note.checked;
        saveNotes();
        renderNotes();
    }
}

function deleteNote(id) {
    const li = document.querySelector(`[data-note-id="${id}"]`);
    if (li) {
        li.classList.add('removing');
        setTimeout(() => {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
        }, 250);
    }
}

function renderNotes() {
    notesList.innerHTML = '';

    const uncheckedCount = notes.filter(n => !n.checked).length;
    notesCount.textContent = uncheckedCount;

    // Bump animation on count badge
    notesCount.classList.add('bump');
    setTimeout(() => notesCount.classList.remove('bump'), 200);

    // Toggle empty state
    if (notes.length === 0) {
        notesEmpty.classList.remove('d-none');
    } else {
        notesEmpty.classList.add('d-none');
    }

    notes.forEach(note => {
        const li = document.createElement('li');
        li.className = `note-item${note.checked ? ' checked' : ''}`;
        li.setAttribute('data-note-id', note.id);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'note-checkbox';
        checkbox.checked = note.checked;
        checkbox.addEventListener('change', () => toggleNote(note.id));

        const span = document.createElement('span');
        span.className = 'note-text';
        span.textContent = note.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'note-delete-btn';
        deleteBtn.setAttribute('aria-label', 'Delete note');
        deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        deleteBtn.addEventListener('click', () => deleteNote(note.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        notesList.appendChild(li);
    });
}

// Start app
init();
