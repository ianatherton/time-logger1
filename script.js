// 15-Minute Task Logger
// Main JavaScript implementation

// Utility Functions
function generateColorPalette(numColors) {//probablyhereyeah?
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        // Use HSL for better control over hue distribution
        const hue = Math.floor((i * 360) / numColors);
        const saturation = 87; // Moderate saturation (0-100)
        const lightness = 55; // Moderate lightness (0-100)
        palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return palette;
}

function dataURItoBlob(dataURI) {
    // Convert base64 to raw binary data held in a string
    const byteString = atob(dataURI.split(',')[1]);
    
    // Separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    
    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    // Create a blob with the ArrayBuffer
    return new Blob([ab], { type: mimeString });
}

// Global variables
const TIMER_DURATION = 15 * 60; // 15 minutes in seconds
const LOGGING_INTERVAL = 10; // Log every 10 seconds
const COLOR_PALETTE = generateColorPalette(128); // 64 different hues

let currentProject = null;
let tasks = [];
let taskColors = {};
let logs = [];
let activeTask = null;
let timerInterval = null;
let timerValue = TIMER_DURATION;
let timerRunning = false;
let loggingInterval = null;
let currentTimeframe = 'day';
let chart = null;
let isDarkTheme = false;
let soundVolume = 0.7;
let customSoundFile = null;
let lastLogTime = 0;

// DOM Elements
const domElements = {
    // Screens
    startupScreen: document.getElementById('startup-screen'),
    mainInterface: document.getElementById('main-interface'),
    
    // Project management
    existingProjects: document.getElementById('existing-projects'),
    newProjectName: document.getElementById('new-project-name'),
    createProjectBtn: document.getElementById('create-project-btn'),
    currentProjectName: document.getElementById('current-project-name'),
    switchProjectBtn: document.getElementById('switch-project-btn'),
    
    // Task management
    activeTaskName: document.getElementById('active-task-name'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskList: document.getElementById('task-list'),
    
    // Timer
    timerValue: document.getElementById('timer-value'),
    timerProgressBar: document.getElementById('timer-progress-bar'),
    timerStart: document.getElementById('timer-start'),
    timerPause: document.getElementById('timer-pause'),
    timerReset: document.getElementById('timer-reset'),
    
    // Visualization
    timeframeBtns: document.querySelectorAll('.timeframe-btn'),
    visualizationChart: document.getElementById('visualization-chart'),
    logEntries: document.getElementById('log-entries'),
    exportLogBtn: document.getElementById('export-log-btn'),
    
    // Modals
    timerCompletionModal: document.getElementById('timer-completion-modal'),
    completedTaskName: document.getElementById('completed-task-name'),
    continueTaskBtn: document.getElementById('continue-task-btn'),
    selectNewTaskBtn: document.getElementById('select-new-task-btn'),
    settingsModal: document.getElementById('settings-modal'),
    soundSelect: document.getElementById('sound-select'),
    customSoundInput: document.getElementById('custom-sound-input'),
    customSoundBtn: document.getElementById('custom-sound-btn'),
    volumeSlider: document.getElementById('volume-slider'),
    settingsSaveBtn: document.getElementById('settings-save-btn'),
    settingsCancelBtn: document.getElementById('settings-cancel-btn'),
    
    // Audio
    notificationSound: document.getElementById('notification-sound'),
    
    // Theme toggle
    themeToggle: document.getElementById('theme-toggle')
};

// Initialization
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadSettings();
    loadProjects();
    setupEventListeners();
    
    // Initialize timer display
    updateTimerDisplay();
}

// Settings & Theme Management
function loadSettings() {
    // Load theme preference
    isDarkTheme = localStorage.getItem('theme') === 'dark';
    updateTheme();
    
    // Load sound settings
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume !== null) {
        soundVolume = parseFloat(savedVolume);
        domElements.volumeSlider.value = soundVolume;
        domElements.notificationSound.volume = soundVolume;
    }
    
    const savedSound = localStorage.getItem('notificationSound');
    if (savedSound === 'custom' && localStorage.getItem('customSoundData')) {
        domElements.soundSelect.value = 'custom';
        domElements.customSoundBtn.classList.remove('hidden');
        
        // Load and set custom sound
        const soundData = localStorage.getItem('customSoundData');
        customSoundFile = dataURItoBlob(soundData);
        domElements.notificationSound.src = URL.createObjectURL(customSoundFile);
    } else if (savedSound) {
        domElements.soundSelect.value = savedSound;
        domElements.notificationSound.src = `assets/sounds/${savedSound}`;
    }
}

function updateTheme() {
    if (isDarkTheme) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        domElements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        domElements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Update chart colors if chart exists
    if (chart) {
        updateVisualization();
    }
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    updateTheme();
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    domElements.themeToggle.addEventListener('click', toggleTheme);
    
    // Project management
    domElements.createProjectBtn.addEventListener('click', createNewProject);
    domElements.existingProjects.addEventListener('change', selectExistingProject);
    domElements.switchProjectBtn.addEventListener('click', showStartupScreen);
    
    // Task management
    domElements.addTaskBtn.addEventListener('click', addNewTask);
    domElements.newTaskInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addNewTask();
    });
    
    // Timer controls
    domElements.timerStart.addEventListener('click', startTimer);
    domElements.timerPause.addEventListener('click', pauseTimer);
    domElements.timerReset.addEventListener('click', resetTimer);
    
    // Timer completion modal
    domElements.continueTaskBtn.addEventListener('click', continueTask);
    domElements.selectNewTaskBtn.addEventListener('click', closeTimerCompletionModal);
    
    // Visualization
    domElements.timeframeBtns.forEach(btn => {
        btn.addEventListener('click', () => changeTimeframe(btn.dataset.timeframe));
    });
    
    // Export data
    domElements.exportLogBtn.addEventListener('click', exportLogData);
    
    // Sound settings
    domElements.soundSelect.addEventListener('change', handleSoundSelection);
    domElements.customSoundBtn.addEventListener('click', () => domElements.customSoundInput.click());
    domElements.customSoundInput.addEventListener('change', handleCustomSoundUpload);
    domElements.volumeSlider.addEventListener('input', adjustVolume);
    domElements.settingsSaveBtn.addEventListener('click', saveSettings);
    domElements.settingsCancelBtn.addEventListener('click', () => domElements.settingsModal.classList.add('hidden'));
}

// Project Management Functions
function loadProjects() {
    const projectList = JSON.parse(localStorage.getItem('projects') || '[]');
    
    // Clear existing options except the default one
    while (domElements.existingProjects.options.length > 1) {
        domElements.existingProjects.remove(1);
    }
    
    // Add projects to select
    projectList.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        domElements.existingProjects.appendChild(option);
    });
}

function createNewProject() {
    const projectName = domElements.newProjectName.value.trim();
    
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }
    
    // Get existing projects
    const projectList = JSON.parse(localStorage.getItem('projects') || '[]');
    
    // Check if project already exists
    if (projectList.includes(projectName)) {
        alert('A project with this name already exists');
        return;
    }
    
    // Add new project
    projectList.push(projectName);
    localStorage.setItem('projects', JSON.stringify(projectList));
    
    // Add to select dropdown
    const option = document.createElement('option');
    option.value = projectName;
    option.textContent = projectName;
    domElements.existingProjects.appendChild(option);
    
    // Select the new project
    domElements.existingProjects.value = projectName;
    selectExistingProject();
}

function selectExistingProject() {
    const selectedProject = domElements.existingProjects.value;
    
    if (!selectedProject) {
        return;
    }
    
    // Load project data
    loadProject(selectedProject);
    
    // Show main interface
    showMainInterface();
}

function loadProject(projectName) {
    currentProject = projectName;
    domElements.currentProjectName.textContent = projectName;
    
    // Load tasks
    tasks = JSON.parse(localStorage.getItem(`project_${projectName}_tasks`) || '[]');
    
    // Load task colors
    taskColors = JSON.parse(localStorage.getItem(`project_${projectName}_colors`) || '{}');
    
    // Load logs
    logs = JSON.parse(localStorage.getItem(`project_${projectName}_logs`) || '[]');
    
    // Update UI
    renderTaskList();
    updateVisualization();
    renderLogEntries();
    renderTaskList();
    updateVisualization();
    renderLogEntries();
    
    // Reset active task
    activeTask = null;
    domElements.activeTaskName.textContent = 'No task selected';
    resetTimer();
}

function saveProject() {
    if (!currentProject) return;
    
    localStorage.setItem(`project_${currentProject}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`project_${currentProject}_colors`, JSON.stringify(taskColors));
    localStorage.setItem(`project_${currentProject}_logs`, JSON.stringify(logs));
}

function showStartupScreen() {
    domElements.mainInterface.classList.add('hidden');
    domElements.startupScreen.classList.remove('hidden');
    
    // Stop any running timers
    if (timerRunning) {
        pauseTimer();
    }
    
    // Reload projects in case there are changes
    loadProjects();
}

function showMainInterface() {
    domElements.startupScreen.classList.add('hidden');
    domElements.mainInterface.classList.remove('hidden');
}

// Task Management Functions
function addNewTask() {
    const taskName = domElements.newTaskInput.value.trim();
    
    if (!taskName) {
        alert('Please enter a task name');
        return;
    }
    
    // Add task to array
    tasks.push(taskName);
    
    // Assign color if not already assigned
    if (!taskColors[taskName]) {
        // Pick a random color index from the palette
        const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
        taskColors[taskName] = COLOR_PALETTE[randomIndex];
    }
    
    // Save project
    saveProject();
    
    // Update UI
    renderTaskList();
    updateVisualization();
    renderLogEntries();
    renderTaskList();
    domElements.newTaskInput.value = '';
}

function renderTaskList() {
    domElements.taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        
        // Create radio button for task selection
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'active-task';
        radio.className = 'task-radio';
        radio.value = index;
        radio.checked = activeTask === index;
        radio.addEventListener('change', () => setActiveTask(index));
        
        // Create color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'task-color';
        colorIndicator.style.backgroundColor = taskColors[task];
        
        // Create task name span
        const taskName = document.createElement('span');
        taskName.className = 'task-name';
        taskName.textContent = task;
        
        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit Task';
        editBtn.addEventListener('click', () => editTask(index));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete Task';
        deleteBtn.addEventListener('click', () => deleteTask(index));
        
        // Add elements to task item
        taskItem.appendChild(radio);
        taskItem.appendChild(colorIndicator);
        taskItem.appendChild(taskName);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        taskItem.appendChild(actionsDiv);
        
        // Add task item to list
        domElements.taskList.appendChild(taskItem);
    });
}

function editTask(index) {
    const taskItem = domElements.taskList.children[index];
    const taskNameElement = taskItem.querySelector('.task-name');
    const taskName = tasks[index];
    
    // Replace task name with input
    const inputGroup = document.createElement('div');
    inputGroup.style.display = 'flex';
    inputGroup.style.flex = '1';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = taskName;
    input.className = 'edit-task-input';
    
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    saveBtn.title = 'Save';
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(saveBtn);
    
    taskNameElement.replaceWith(inputGroup);
    input.focus();
    
    // Handle save
    function saveEdit() {
        const newName = input.value.trim();
        
        if (newName && newName !== taskName) {
            // Update task name
            tasks[index] = newName;
            
            // Transfer color to new name
            taskColors[newName] = taskColors[taskName];
            delete taskColors[taskName];
            
            // Update logs for this task
            logs.forEach(log => {
                if (log.task === taskName) {
                    log.task = newName;
                }
            });
            
            // Save project
            saveProject();
            
            // Update active task if this was the active one
            if (activeTask === index) {
                domElements.activeTaskName.textContent = newName;
            }
            
            // Update visualizations
            updateVisualization();
            renderLogEntries();
        }
        
        // Restore task list
        renderTaskList();
    }
    
    // Add event listeners
    saveBtn.addEventListener('click', saveEdit);
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') renderTaskList();
    });
    
    // Handle click outside
    document.addEventListener('click', function clickOutside(e) {
        if (!inputGroup.contains(e.target)) {
            saveEdit();
            document.removeEventListener('click', clickOutside);
        }
    });
}

function deleteTask(index) {
    if (confirm(`Are you sure you want to delete "${tasks[index]}"?`)) {
        const taskName = tasks[index];
        
        // Remove task
        tasks.splice(index, 1);
        
        // Remove color
        delete taskColors[taskName];
        
        // Save project
        saveProject();
        
        // Update UI
    renderTaskList();
    updateVisualization();
    renderLogEntries();
        renderTaskList();
        
        // Reset active task if this was the active one
        if (activeTask === index) {
            activeTask = null;
            domElements.activeTaskName.textContent = 'No task selected';
        } else if (activeTask > index) {
            // Adjust active task index
            activeTask--;
        }
        
        // Update visualizations
        updateVisualization();
    }
}

function setActiveTask(index) {
    activeTask = index;
    domElements.activeTaskName.textContent = tasks[index];
    resetTimer();
}

// Timer Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (activeTask === null) {
        alert('Please select a task before starting the timer');
        return;
    }
    
    if (timerRunning) return;
    
    timerRunning = true;
    
    // Toggle buttons
    domElements.timerStart.classList.add('hidden');
    domElements.timerPause.classList.remove('hidden');
    
    // Start timer interval
    timerInterval = setInterval(() => {
        timerValue--;
        updateTimerDisplay();
        
        if (timerValue <= 0) {
            completeTimer();
        }
    }, 1000);
    
    // Start logging interval (every 10 seconds)
    startLoggingInterval();
}

function pauseTimer() {
    if (!timerRunning) return;
    
    timerRunning = false;
    
    // Toggle buttons
    domElements.timerPause.classList.add('hidden');
    domElements.timerStart.classList.remove('hidden');
    
    // Clear intervals
    clearInterval(timerInterval);
    clearInterval(loggingInterval);
}

function resetTimer() {
    pauseTimer();
    timerValue = TIMER_DURATION;
    updateTimerDisplay();
    domElements.timerProgressBar.style.width = '100%';
}

function updateTimerDisplay() {
    domElements.timerValue.textContent = formatTime(timerValue);
    
    // Update progress bar
    const progressPercentage = (timerValue / TIMER_DURATION) * 100;
    domElements.timerProgressBar.style.width = `${progressPercentage}%`;
}

function completeTimer() {
    pauseTimer();
    
    // Log the completed interval
    logCompletedInterval();
    
    // Play notification sound
    playNotificationSound();
    
    // Show completion modal
    showTimerCompletionModal();
}

function logCompletedInterval() {
    if (activeTask === null) return;
    
    const taskName = tasks[activeTask];
    const timestamp = new Date().toISOString();
    
    logs.push({
        task: taskName,
        timestamp: timestamp,
        duration: TIMER_DURATION // 15 minutes in seconds
    });
    
    saveProject();
    updateVisualization();
    renderLogEntries();
}

function startLoggingInterval() {
    // Clear any existing interval
    if (loggingInterval) {
        clearInterval(loggingInterval);
    }
    
    // Initialize last log time
    lastLogTime = Date.now();
    
    // Start new logging interval
    loggingInterval = setInterval(() => {
        if (!timerRunning || activeTask === null) return;
        
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastLogTime) / 1000);
        
        // Only log if at least LOGGING_INTERVAL seconds have passed
        if (elapsedSeconds >= LOGGING_INTERVAL) {
            const taskName = tasks[activeTask];
            const timestamp = new Date().toISOString();
            
            logs.push({
                task: taskName,
                timestamp: timestamp,
                duration: elapsedSeconds
            });
            
            saveProject();
            updateVisualization();
            
            // Update last log time
            lastLogTime = now;
        }
    }, 1000); // Check every second
}

function playNotificationSound() {
    domElements.notificationSound.currentTime = 0;
    domElements.notificationSound.play();
}

function showTimerCompletionModal() {
    if (activeTask === null) return;
    
    domElements.completedTaskName.textContent = tasks[activeTask];
    domElements.timerCompletionModal.classList.remove('hidden');
}

function closeTimerCompletionModal() {
    domElements.timerCompletionModal.classList.add('hidden');
    domElements.notificationSound.pause();
    domElements.notificationSound.currentTime = 0;
}

function continueTask() {
    closeTimerCompletionModal();
    resetTimer();
    startTimer();
}

// Visualization Functions
function changeTimeframe(timeframe) {
    currentTimeframe = timeframe;
    
    // Update active button
    domElements.timeframeBtns.forEach(btn => {
        if (btn.dataset.timeframe === timeframe) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update visualization and log entries
    updateVisualization();
    renderLogEntries();
}

function updateVisualization() {
    if (!currentProject || logs.length === 0) {
        // Clear chart if no data
        if (chart) {
            chart.destroy();
            chart = null;
        }
        return;
    }
    
    // Filter logs based on current timeframe
    const filteredLogs = filterLogsByTimeframe();
    
    // Destroy previous chart if exists
    if (chart) {
        chart.destroy();
    }
    
    // Create new chart based on timeframe
    const ctx = domElements.visualizationChart.getContext('2d');
    
    if (currentTimeframe === 'day') {
        createDayView(ctx, filteredLogs);
    } else {
        createAggregatedView(ctx, filteredLogs);
    }
}

function filterLogsByTimeframe() {
    const now = new Date();
    let startDate;
    
    switch (currentTimeframe) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            break;
        case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }
    
    return logs.filter(log => new Date(log.timestamp) >= startDate);
}

function createDayView(ctx, filteredLogs) {
    // Create a 24-hour timeline
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const taskData = {};
    
    // Initialize data for each task
    const uniqueTasks = [...new Set(filteredLogs.map(log => log.task))];
    uniqueTasks.forEach(task => {
        taskData[task] = Array(24).fill(0);
    });
    
    // Fill task data
    filteredLogs.forEach(log => {
        const date = new Date(log.timestamp);
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const taskName = log.task;
        
        // Add data in 10-second increments, scaled to minutes
        const durationInMinutes = log.duration / 60;
        taskData[taskName][hour] += durationInMinutes;
    });
    
    // Create datasets for the chart
    const datasets = uniqueTasks.map(task => {
        return {
            label: task,
            data: createTimelineData(hours, taskData[task]),
            backgroundColor: taskColors[task] || '#ccc',
            borderColor: taskColors[task] || '#ccc',
        };
    });
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(h => {
                const hour12 = h % 12 || 12; // Convert 0 to 12
                const ampm = h < 12 ? 'AM' : 'PM';
                return `${hour12}:00 ${ampm}`;
            }),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Hour of Day'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Minutes'
                    },
                    max: 60 // Maximum of 60 minutes per hour
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Task Timeline - Day View',
                    color: isDarkTheme ? '#e2e8f0' : '#212529'
                }
            }
        }
    });
}

function createTimelineData(hours, values) {
    return hours.map((_, index) => values[index]);
}

function createAggregatedView(ctx, filteredLogs) {
    // Aggregate data by task
    const taskTotals = {};
    
    filteredLogs.forEach(log => {
        const taskName = log.task;
        if (!taskTotals[taskName]) {
            taskTotals[taskName] = 0;
        }
        taskTotals[taskName] += log.duration;
    });
    
    // Convert seconds to minutes
    Object.keys(taskTotals).forEach(task => {
        taskTotals[task] = Math.round(taskTotals[task] / 60);
    });
    
    // Prepare data for chart
    const tasks = Object.keys(taskTotals);
    const durations = tasks.map(task => taskTotals[task]);
    const colors = tasks.map(task => taskColors[task] || '#ccc');
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tasks,
            datasets: [{
                label: 'Minutes',
                data: durations,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Minutes'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Task Summary - ${currentTimeframe.toUpperCase()} View`,
                    color: isDarkTheme ? '#e2e8f0' : '#212529'
                }
            }
        }
    });
}

function renderLogEntries() {
    // Clear existing entries
    domElements.logEntries.innerHTML = '';
    
    // Filter logs based on current timeframe
    const filteredLogs = filterLogsByTimeframe();
    
    // Sort by timestamp (newest first)
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Render log entries
    sortedLogs.forEach(log => {
        const entryElement = document.createElement('div');
        entryElement.className = 'log-entry';
        
        // Create color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'task-color';
        colorIndicator.style.backgroundColor = taskColors[log.task] || '#ccc';
        
        // Format time
        const date = new Date(log.timestamp);
        const formattedTime = date.toLocaleString();
        const durationMinutes = Math.round(log.duration / 60);
        
        entryElement.innerHTML = `
            <div>
                ${colorIndicator.outerHTML}
                <span>${log.task}</span>
                <span class="duration">(${durationMinutes} min)</span>
            </div>
            <div class="timestamp">${formattedTime}</div>
        `;
        
        domElements.logEntries.appendChild(entryElement);
    });
}

// Data Export Functions
function exportLogData() {
    if (!currentProject || logs.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Filter logs based on current timeframe
    const filteredLogs = filterLogsByTimeframe();
    
    // Convert to CSV
    const csvContent = generateCSV(filteredLogs);
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentProject}_${currentTimeframe}_logs.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateCSV(logs) {
    // CSV header
    let csv = 'Task,Timestamp,Duration (seconds),Duration (minutes)\n';
    
    // Add rows
    logs.forEach(log => {
        const durationMinutes = (log.duration / 60).toFixed(2);
        const row = `"${log.task}","${log.timestamp}",${log.duration},${durationMinutes}\n`;
        csv += row;
    });
    
    return csv;
}

// Sound Settings Functions
function handleSoundSelection() {
    const selection = domElements.soundSelect.value;
    
    if (selection === 'custom') {
        domElements.customSoundBtn.classList.remove('hidden');
    } else {
        domElements.customSoundBtn.classList.add('hidden');
        domElements.notificationSound.src = `assets/sounds/${selection}`;
    }
}

function handleCustomSoundUpload() {
    const file = domElements.customSoundInput.files[0];
    
    if (file) {
        // Validate file type
        const fileTypes = ['.mp3', '.wav', '.ogg'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        
        if (!fileTypes.includes(fileExt.toLowerCase())) {
            alert('Please select an audio file (.mp3, .wav, or .ogg)');
            return;
        }
        
        // Create object URL and set as source
        customSoundFile = file;
        const url = URL.createObjectURL(file);
        domElements.notificationSound.src = url;
        
        // Save to local storage (convert to data URI)
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('customSoundData', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function adjustVolume() {
    soundVolume = parseFloat(domElements.volumeSlider.value);
    domElements.notificationSound.volume = soundVolume;
}

function saveSettings() {
    // Save volume
    localStorage.setItem('soundVolume', soundVolume);
    
    // Save sound selection
    const selection = domElements.soundSelect.value;
    localStorage.setItem('notificationSound', selection);
    
    // Close modal
    domElements.settingsModal.classList.add('hidden');
}
