// DOM elements
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const modeBtn = document.getElementById('mode-button');
const workEmoji = document.getElementById('work-emoji');
const restEmoji = document.getElementById('rest-emoji');

// Timer variables
let interval;
let timeLeft;
let isRunning = false;
const WORK_TIME = 25 * 60; // 25 minutes in seconds
const REST_TIME = 5 * 60; // 5 minutes in seconds
let originalTitle = document.title;

// Initialize timer
let isWorkMode = true;
timeLeft = WORK_TIME;
updateTimerDisplay();

// Set initial mode display - work emoji is active by default
workEmoji.classList.add('active');
restEmoji.classList.remove('active');

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
modeBtn.addEventListener('click', toggleMode);

// Set up notification permissions
if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

// Timer functions
function startTimer() {
    if (isRunning) return;
    
    // Visual feedback for button press
    startBtn.classList.add('active');
    
    isRunning = true;
    interval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            endTimer();
            notifyUser();
            updateTabTitle("Time Up!");
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    
    startBtn.classList.remove('active');
    
    clearInterval(interval);
    isRunning = false;
}

function resetTimer() {
    pauseTimer();
    timeLeft = isWorkMode ? WORK_TIME : REST_TIME;
    updateTimerDisplay();
}

function endTimer() {
    pauseTimer();
    // Optionally toggle mode automatically at the end of a timer
    // toggleMode();
}

function toggleMode() {
    pauseTimer();
    isWorkMode = !isWorkMode;
    
    // Update the active emoji
    if (isWorkMode) {
        workEmoji.classList.add('active');
        restEmoji.classList.remove('active');
        timeLeft = WORK_TIME;
        document.body.classList.remove('rest-mode');
    } else {
        workEmoji.classList.remove('active');
        restEmoji.classList.add('active');
        timeLeft = REST_TIME;
        document.body.classList.add('rest-mode');
    }
    
    // Add animation to the mode button
    modeBtn.classList.add('animating');
    setTimeout(() => {
        modeBtn.classList.remove('animating');
    }, 300);
    
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
    
    // Update tab title with the current time
    updateTabTitle(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
}

function updateTabTitle(time) {
    const mode = isWorkMode ? '🤓' : '😮‍💨';
    document.title = `${time} ${mode}`;
    
    // If timer is at zero, add attention-grabbing animation to the tab title
    if (time === "Time Up!") {
        startTitleFlash();
    }
}

// Flash the title between "Time Up!" and the mode to grab attention
let titleFlashInterval;
function startTitleFlash() {
    let flashState = true;
    const mode = isWorkMode ? '🤓' : '😮‍💨';
    const modeText = isWorkMode ? 'Focus' : 'Break';
    
    // Clear any existing flash interval
    if (titleFlashInterval) {
        clearInterval(titleFlashInterval);
    }
    
    // Flash the title every 1 second
    titleFlashInterval = setInterval(() => {
        if (flashState) {
            document.title = `Time Up! ${mode}`;
        } else {
            document.title = `⏰ ${modeText} Complete!`;
        }
        flashState = !flashState;
    }, 1000);
    
    // Stop flashing after 10 seconds if user doesn't interact
    setTimeout(() => {
        if (titleFlashInterval) {
            clearInterval(titleFlashInterval);
            titleFlashInterval = null;
            document.title = `Time Up! ${mode}`;
        }
    }, 10000);
}

// Clear title flash when user interacts with the timer
function clearTitleFlash() {
    if (titleFlashInterval) {
        clearInterval(titleFlashInterval);
        titleFlashInterval = null;
    }
}

// Add event listeners to clear title flash on user interaction
startBtn.addEventListener('click', clearTitleFlash);
pauseBtn.addEventListener('click', clearTitleFlash);
resetBtn.addEventListener('click', clearTitleFlash);
modeBtn.addEventListener('click', clearTitleFlash);

function notifyUser() {
    // Play sound
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();
    
    // Vibrate if supported
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
    
    // Show browser notification if supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Timer', {
            body: isWorkMode ? 'Time for a break! Well done.' : 'Break finished! Time to focus again.',
            icon: isWorkMode 
                ? 'https://img.icons8.com/fluency/96/null/break-time.png'
                : 'https://img.icons8.com/fluency/96/null/pomodoro-technique.png'
        });
    }
} 