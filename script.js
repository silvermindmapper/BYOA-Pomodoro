// DOM elements
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const addTimeBtn = document.getElementById('add-time');
const modeBtn = document.getElementById('mode-button');
const workEmoji = document.getElementById('work-emoji');
const restEmoji = document.getElementById('rest-emoji');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const topicSelect = document.getElementById('topic-select');
const newTopicInput = document.getElementById('new-topic');
const saveTaskBtn = document.getElementById('save-task');
const skipTaskBtn = document.getElementById('skip-task');
const closeModalBtn = document.querySelector('.close-modal');
const currentTaskEl = document.querySelector('.task-label');
const topicListEl = document.getElementById('topic-list');
const focusCountEl = document.getElementById('focus-count');
const breakCountEl = document.getElementById('break-count');
const clearStatsBtn = document.getElementById('clear-stats');

// Timer variables
let interval;
let timeLeft;
let isRunning = false;
const WORK_TIME = 25 * 60; // 25 minutes in seconds
const REST_TIME = 5 * 60; // 5 minutes in seconds
const FIVE_MINUTES = 5 * 60; // 5 minutes in seconds
let originalTitle = document.title;
let currentTopic = '';
let topicsData = {};
let focusCount = 0;
let breakCount = 0;

// Initialize timer
let isWorkMode = true;
timeLeft = WORK_TIME;
updateTimerDisplay();

// Set initial mode display - work emoji is active by default
workEmoji.classList.add('active');
restEmoji.classList.remove('active');

// Load saved data
loadDataFromStorage();
populateTopicSelect();
renderTopicList();

// Event listeners
startBtn.addEventListener('click', handleStartClick);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
addTimeBtn.addEventListener('click', addFiveMinutes);
modeBtn.addEventListener('click', toggleMode);
closeModalBtn.addEventListener('click', closeModal);
clearStatsBtn.addEventListener('click', clearAllStats);
skipTaskBtn.addEventListener('click', function() {
    // If there's a current topic, keep using it; otherwise, clear it
    if (!currentTopic && (topicSelect.value || newTopicInput.value.trim())) {
        // User selected or started typing a topic but clicked Skip
        // Let's still save this topic
        saveTopic();
    } else {
        closeModal();
        actuallyStartTimer();
    }
});
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    saveTopic();
});

// Topic select change handler
topicSelect.addEventListener('change', function() {
    if (this.value) {
        // Clear the new topic field if a topic is selected
        newTopicInput.value = '';
    }
});

// Handle modal clicks outside the content
window.addEventListener('click', function(event) {
    if (event.target === taskModal) {
        closeModal();
    }
});

// Set up notification permissions
if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

// Load all data from storage
function loadDataFromStorage() {
    // Load topics data
    const savedTopics = localStorage.getItem('focusTimerTopics');
    if (savedTopics) {
        topicsData = JSON.parse(savedTopics);
    }
    
    // Load current topic
    const savedTopic = localStorage.getItem('focusTimerTopic');
    if (savedTopic) {
        currentTopic = savedTopic;
        currentTaskEl.textContent = currentTopic;
    }
    
    // Load session counts
    const savedFocusCount = localStorage.getItem('focusTimerFocusCount');
    if (savedFocusCount) {
        focusCount = parseInt(savedFocusCount, 10);
        focusCountEl.textContent = focusCount;
    }
    
    const savedBreakCount = localStorage.getItem('focusTimerBreakCount');
    if (savedBreakCount) {
        breakCount = parseInt(savedBreakCount, 10);
        breakCountEl.textContent = breakCount;
    }
}

// Delete a topic
function deleteTopic(topic) {
    if (confirm(`Are you sure you want to delete "${topic}" from your tracking?`)) {
        // Remove from data
        delete topicsData[topic];
        
        // If this was the current topic, clear it
        if (currentTopic === topic) {
            currentTopic = '';
            currentTaskEl.textContent = '';
            localStorage.setItem('focusTimerTopic', '');
        }
        
        // Save updated data
        localStorage.setItem('focusTimerTopics', JSON.stringify(topicsData));
        
        // Update UI
        populateTopicSelect();
        renderTopicList();
    }
}

// Clear all topic stats
function clearAllStats() {
    if (confirm('Are you sure you want to clear all topic statistics?')) {
        topicsData = {};
        focusCount = 0;
        breakCount = 0;
        
        localStorage.removeItem('focusTimerTopics');
        localStorage.setItem('focusTimerFocusCount', '0');
        localStorage.setItem('focusTimerBreakCount', '0');
        
        focusCountEl.textContent = '0';
        breakCountEl.textContent = '0';
        
        renderTopicList();
    }
}

// Populate the topic select dropdown
function populateTopicSelect() {
    // Clear existing options except the first one
    while (topicSelect.options.length > 1) {
        topicSelect.remove(1);
    }
    
    // Add options for each topic
    const topics = Object.keys(topicsData).sort();
    
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        topicSelect.appendChild(option);
    });
    
    // Select the current topic if it exists
    if (currentTopic && topics.includes(currentTopic)) {
        topicSelect.value = currentTopic;
    }
}

// Render the topic list
function renderTopicList() {
    // Clear existing topic items
    topicListEl.innerHTML = '';
    
    const topics = Object.entries(topicsData).sort((a, b) => b[1] - a[1]);
    
    if (topics.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Complete your first focus session to start tracking!';
        topicListEl.appendChild(emptyState);
    } else {
        // Create topic items
        topics.forEach(([topic, count]) => {
            createTopicItem(topic, count);
        });
    }
}

// Create a topic item element
function createTopicItem(topic, count) {
    const topicItem = document.createElement('div');
    topicItem.className = 'topic-item';
    
    const topicInfo = document.createElement('div');
    topicInfo.className = 'topic-info';
    
    const topicName = document.createElement('div');
    topicName.className = 'topic-name';
    topicName.textContent = topic;
    
    const topicActions = document.createElement('div');
    topicActions.className = 'topic-actions';
    
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-topic';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete topic';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTopic(topic);
    });
    
    const countBadge = document.createElement('div');
    countBadge.className = 'pomodoro-count';
    countBadge.textContent = count;
    countBadge.setAttribute('data-topic', topic);
    
    topicInfo.appendChild(topicName);
    topicActions.appendChild(deleteBtn);
    topicActions.appendChild(countBadge);
    
    topicItem.appendChild(topicInfo);
    topicItem.appendChild(topicActions);
    topicListEl.appendChild(topicItem);
}

// Increment topic count
function incrementTopicCount(topic) {
    if (!topic) return;
    
    // Update the topics data
    topicsData[topic] = (topicsData[topic] || 0) + 1;
    
    // Save to localStorage
    localStorage.setItem('focusTimerTopics', JSON.stringify(topicsData));
    
    // Update the UI
    renderTopicList();
    
    // Highlight the updated count
    setTimeout(() => {
        const countEl = document.querySelector(`.pomodoro-count[data-topic="${topic}"]`);
        if (countEl) {
            countEl.classList.add('highlight');
            setTimeout(() => {
                countEl.classList.remove('highlight');
            }, 1000);
        }
    }, 100);
}

// Increment session counts
function incrementSessionCount(isWork) {
    if (isWork) {
        focusCount++;
        focusCountEl.textContent = focusCount;
        localStorage.setItem('focusTimerFocusCount', focusCount.toString());
    } else {
        breakCount++;
        breakCountEl.textContent = breakCount;
        localStorage.setItem('focusTimerBreakCount', breakCount.toString());
    }
}

// Show modal when start is clicked in work mode
function handleStartClick() {
    if (isRunning) return;
    
    if (isWorkMode) {
        openTopicModal();
    } else {
        actuallyStartTimer();
    }
}

// Open the topic modal
function openTopicModal() {
    // Reset form
    if (!currentTopic) {
        topicSelect.value = '';
    }
    newTopicInput.value = '';
    
    taskModal.classList.add('show');
    setTimeout(() => {
        if (currentTopic) {
            // If we have a current topic, focus on the submit button
            saveTaskBtn.focus();
        } else {
            // Otherwise focus on the topic select
            topicSelect.focus();
        }
    }, 300);
}

// Close the topic modal
function closeModal() {
    taskModal.classList.remove('show');
}

// Save the topic
function saveTopic() {
    let topic = topicSelect.value;
    const newTopic = newTopicInput.value.trim();
    
    // Use new topic if provided, otherwise use selected topic
    if (newTopic) {
        topic = newTopic;
    }
    
    if (topic) {
        currentTopic = topic;
        
        // Update the topic display
        currentTaskEl.textContent = currentTopic;
        
        // Save to localStorage
        localStorage.setItem('focusTimerTopic', currentTopic);
        
        // Add topic to tracking data if it doesn't exist yet
        if (!topicsData.hasOwnProperty(currentTopic)) {
            // Initialize with count 0
            topicsData[currentTopic] = 0;
            
            // Save to localStorage
            localStorage.setItem('focusTimerTopics', JSON.stringify(topicsData));
            
            // Update UI immediately to show the new topic in the tracker
            populateTopicSelect();
            
            // Show the new topic in the tracker list even with 0 count
            renderTopicList();
            
            console.log(`New topic "${currentTopic}" added to tracker with count 0`);
        }
    }
    
    closeModal();
    actuallyStartTimer();
}

// Clear topic when done
function clearTopicDisplay() {
    // Only clear display but keep the current topic for next session
    currentTaskEl.textContent = '';
}

// Function to add 5 minutes to the timer
function addFiveMinutes() {
    timeLeft += FIVE_MINUTES;
    updateTimerDisplay();
    
    // Provide visual feedback
    addTimeBtn.classList.add('active');
    setTimeout(() => {
        addTimeBtn.classList.remove('active');
    }, 300);
    
    // Play a subtle sound to confirm the action
    const confirmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-click-2866.mp3');
    confirmSound.volume = 0.3;
    confirmSound.play().catch(err => console.log('Could not play confirmation sound', err));
}

// Timer functions
function actuallyStartTimer() {
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
            
            // Update counters when timer ends
            if (isWorkMode) {
                incrementSessionCount(true);
                // Increment topic count for work sessions only if there's a topic
                if (currentTopic) {
                    incrementTopicCount(currentTopic);
                }
                clearTopicDisplay();
            } else {
                incrementSessionCount(false);
            }
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
addTimeBtn.addEventListener('click', clearTitleFlash);
modeBtn.addEventListener('click', clearTitleFlash);
skipTaskBtn.addEventListener('click', clearTitleFlash);
saveTaskBtn.addEventListener('click', clearTitleFlash);
clearStatsBtn.addEventListener('click', clearTitleFlash);

// Add event delegation for delete topic buttons
topicListEl.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-topic')) {
        clearTitleFlash();
    }
});

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