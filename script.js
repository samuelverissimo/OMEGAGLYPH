const STORAGE_KEY = 'monotofobia_players';
const ADMIN_KEY = 'monotofobia_admin_logged_in';
const LOGGED_USER_KEY = 'monotofobia_logged_in';

let authMode = 'login';

function loadPlayers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function savePlayers(players) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(LOGGED_USER_KEY) || 'null');
}

function setCurrentUser(user) {
    localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(LOGGED_USER_KEY);
}

function redirectToPhase(phase) {
    const phasePages = {
        1: 'fase1.html',
        2: 'fase2.html',
        3: 'fase3.html',
        4: 'fase4.html',
        5: 'fase5.html',
    };

    const target = phasePages[phase] || 'fase1.html';
    window.location.href = target;
}

function registerUser(name, password) {
    const players = loadPlayers();
    const exists = players.some((player) => player.name.toLowerCase() === name.toLowerCase());

    if (exists) {
        return { success: false, message: 'Esse nome já está cadastrado.' };
    }

    const player = {
        name,
        password,
        phase: 1,
        guess: '',
        createdAt: new Date().toISOString(),
    };

    players.push(player);
    savePlayers(players);
    return { success: true, message: 'Cadastro realizado com sucesso.' };
}

function loginUser(name, password) {
    const players = loadPlayers();
    const player = players.find(
        (item) => item.name.toLowerCase() === name.toLowerCase() && item.password === password
    );

    if (!player) {
        return { success: false, message: 'Nome ou senha inválidos.' };
    }

    setCurrentUser({ name: player.name, password: player.password });
    return { success: true, player };
}

function getPlayerFromStorage() {
    const user = getCurrentUser();
    if (!user) return null;

    const players = loadPlayers();
    return players.find((player) => player.name.toLowerCase() === user.name.toLowerCase());
}

function savePlayerProgress(phase, guess = '') {
    const user = getCurrentUser();
    if (!user) return false;

    const players = loadPlayers();
    const index = players.findIndex((player) => player.name.toLowerCase() === user.name.toLowerCase());

    if (index === -1) return false;

    players[index].phase = Number(phase);
    players[index].guess = guess;
    savePlayers(players);
    return true;
}

function logoutPlayer() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

function checkAdminAuth() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
}

function setAdminAuth(value) {
    if (value) {
        localStorage.setItem(ADMIN_KEY, 'true');
    } else {
        localStorage.removeItem(ADMIN_KEY);
    }
}

function showMessage(element, text, isError = false) {
    if (!element) return;
    element.textContent = text;
    element.style.color = isError ? '#ff9a9a' : '#b6f7c8';
}

function setMode(mode) {
    authMode = mode;
    const buttons = document.querySelectorAll('.toggle-btn');
    const submitButton = document.getElementById('authSubmit');
    const authMessage = document.getElementById('authMessage');

    buttons.forEach((button) => {
        const active = button.dataset.mode === mode;
        button.classList.toggle('active', active);
    });

    if (submitButton) {
        submitButton.textContent = mode === 'login' ? 'Entrar' : 'Cadastrar';
    }

    if (authMessage) {
        authMessage.textContent = '';
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();

    const authMessage = document.getElementById('authMessage');
    const nameInput = document.getElementById('nameInput');
    const passwordInput = document.getElementById('passwordInput');

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !password) {
        showMessage(authMessage, 'Preencha nome e senha.', true);
        return;
    }

    if (authMode === 'register') {
        const result = registerUser(name, password);
        if (!result.success) {
            showMessage(authMessage, result.message, true);
            return;
        }

        showMessage(authMessage, result.message, false);
        nameInput.value = '';
        passwordInput.value = '';
        setMode('login');
        return;
    }

    const result = loginUser(name, password);
    if (!result.success) {
        showMessage(authMessage, result.message, true);
        return;
    }

    const player = result.player;
    redirectToPhase(Number(player.phase || 1));
}

function initLoginScreen() {
    const authForm = document.getElementById('authForm');
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    if (!authForm || !toggleButtons.length) return;

    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => setMode(button.dataset.mode));
    });

    authForm.addEventListener('submit', handleAuthSubmit);
    setMode('login');
}

function initPhasePage() {
    const phaseSelect = document.getElementById('phaseSelect');
    const guessInput = document.getElementById('guessInput');
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const playerName = document.getElementById('playerName');
    const statusMessage = document.getElementById('statusMessage');

    if (!phaseSelect || !guessInput || !saveProgressBtn || !logoutBtn) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const player = getPlayerFromStorage();
    if (!player) {
        window.location.href = 'index.html';
        return;
    }

    if (playerName) {
        playerName.textContent = player.name;
    }

    phaseSelect.value = String(player.phase || 1);
    guessInput.value = player.guess || '';

    saveProgressBtn.addEventListener('click', () => {
        const selectedPhase = Number(phaseSelect.value);
        const guess = guessInput.value.trim();

        const saved = savePlayerProgress(selectedPhase, guess);
        if (saved) {
            showMessage(statusMessage, 'Progresso salvo com sucesso!', false);
            return;
        }

        showMessage(statusMessage, 'Não foi possível salvar seu progresso.', true);
    });

    logoutBtn.addEventListener('click', () => {
        logoutPlayer();
    });
}

function initFase1Page() {
    const form = document.getElementById('fase1Form');
    const guessInput = document.getElementById('fase1Guess');
    const message = document.getElementById('fase1Message');

    if (!form || !guessInput || !message) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const guess = guessInput.value.trim().toLowerCase().replace(/\s+/g, '');
        const isCorrect = guess === 'padredeespadas';

        if (isCorrect) {
            const saved = savePlayerProgress(2, guessInput.value.trim());

            if (!saved) {
                showMessage(message, 'Não foi possível salvar seu progresso.', true);
                return;
            }

            showMessage(message, 'Palpite correto! Indo para a Fase 2...', false);
            redirectToPhase(2);
            return;
        }

        showMessage(
            message,
            'Palpite incorreto. Tente novamente.',
            true
        );
    });
}

let activePianoAudio = null;

function playNoteAudio(note) {
    const normalizedNote = note.toLowerCase();

    if (activePianoAudio) {
        activePianoAudio.pause();
        activePianoAudio.currentTime = 0;
    }

    const noteFileName = encodeURIComponent(normalizedNote);
    const audio = new Audio(`assets/sfx/fase_2/${noteFileName}.wav`);
    activePianoAudio = audio;
    audio.loop = false;
    audio.play().catch(() => {});
}

function initFase2Page() {
    const hintImage = document.getElementById('fase2HintImage');
    const message = document.getElementById('fase2Message');
    const checkButton = document.getElementById('fase2Check');
    const clearButton = document.getElementById('fase2Clear');
    const guessDisplay = document.getElementById('fase2GuessDisplay');
    const pianoKeys = document.querySelectorAll('.page-fase-2 .key');

    if (!hintImage || !message || !checkButton || !clearButton || !guessDisplay || !pianoKeys.length) return;

    const correctAnswer = 'F A C A D A';
    let currentGuess = [];
    let answerAudio = null;

    const setPianoLocked = (isLocked) => {
        pianoKeys.forEach((key) => {
            key.disabled = isLocked;
            key.style.pointerEvents = isLocked ? 'none' : 'auto';
            key.setAttribute('aria-disabled', String(isLocked));
        });
    };

    const renderGuess = () => {
        guessDisplay.textContent = currentGuess.length ? currentGuess.join(' ') : '-';
    };

    hintImage.addEventListener('click', () => {
        if (answerAudio) {
            answerAudio.pause();
            answerAudio.currentTime = 0;
        }

        answerAudio = new Audio('assets/sfx/audio_resposta2.ogg');
        window.__fase2AnswerAudio = answerAudio;
        answerAudio.loop = false;
        setPianoLocked(true);

        answerAudio.addEventListener('ended', () => {
            setPianoLocked(false);
        }, { once: true });

        answerAudio.play().catch(() => {
            setPianoLocked(false);
        });
    });

    pianoKeys.forEach((key) => {
        key.addEventListener('click', () => {
            if (answerAudio && !answerAudio.paused) {
                return;
            }

            const note = key.dataset.note;
            currentGuess.push(note);
            renderGuess();
            playNoteAudio(note);
            showMessage(message, '', false);
        });
    });

    clearButton.addEventListener('click', () => {
        currentGuess = [];
        renderGuess();
        showMessage(message, '', false);
    });

    checkButton.addEventListener('click', () => {
        const guessValue = currentGuess.join(' ');

        if (guessValue === correctAnswer) {
            const saved = savePlayerProgress(3, correctAnswer);

            if (saved) {
                showMessage(message, 'Palpite correto! Indo para a Fase 3...', false);
            } else {
                showMessage(message, 'Palpite correto! Próxima fase liberada.', false);
            }

            setTimeout(() => redirectToPhase(3), 800);
            return;
        }

        currentGuess = [];
        renderGuess();
        showMessage(message, 'Palpite incorreto. Tente novamente.', true);
    });

    renderGuess();
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('authForm')) {
        initLoginScreen();
    }

    if (document.getElementById('phaseSelect')) {
        initPhasePage();
    }

    if (document.getElementById('fase1Form')) {
        initFase1Page();
    }

    if (document.getElementById('fase2HintImage')) {
        initFase2Page();
    }
});

window.monotofobia = {
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    getPlayerFromStorage,
    savePlayerProgress,
    logoutPlayer,
    checkAdminAuth,
    setAdminAuth,
    redirectToPhase,
};
