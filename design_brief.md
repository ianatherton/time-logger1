# Design Brief: 15-Minute Task Logger

**Version:** 0.2
**Date:** 2025-04-30

## 1. Core Concept

A browser-based, local-storage-only application for tracking work focus and logging tasks in 15-minute intervals. It emphasizes simplicity, privacy (no accounts or cloud storage), and helps users manage tasks within specific projects.

## 2. Target User

Individuals needing a straightforward, private tool to monitor time spent on specific tasks, encourage focused work sessions via 15-minute blocks, and organize work by project. The user's primary goals are to:

- Maintain focus through structured 15-minute intervals
- Track time allocation across different projects 
- Visualize productivity patterns
- Build consistent work habits without complex setup or cloud dependencies

## 3. Key Features & Flow

### 3.1. Project Management
    *   **Startup Screen:** On first load or when no project is active, prompt the user to either select an existing project or create a new one.
    *   **Project Switching:** Allow switching between existing projects.
    *   **Data Namespacing:** All task data (logs, queue) is stored locally, namespaced by the selected project name (e.g., in `localStorage` using keys like `project_MyProjectName_log`).

### 3.2. Main Interface (per Project)
    *   **Left Panel: Task Management**
        *   **Current Task Display:**
            *   Shows the name of the **single active task**.
            *   Displays a **15-minute interval timer**:
                *   Shows **time remaining** in the current interval (minutes only).
                *   Visual indicator of timer progress (e.g., progress bar).
                *   Start/Pause/Reset controls for the interval timer.
        *   **Task Queue:**
            *   A list of upcoming tasks for the current project.
            *   Ability to add new tasks to the queue.
            *   Ability to edit task names in the queue.
            *   Ability to reorder tasks (e.g., drag and drop).
            *   Mechanism to select the **active task** (e.g., a radio button or checkbox next to each task in the queue). Selecting a task here updates the "Current Task Display" and starts/resets the timer for *that* task. Only one task can be active.
    *   **Right Panel: Visualization & History**
        *   **Graph Visualization:**
            *   **Day View:**
                *   Displays a 24-hour timeline divided into hourly segments.
                *   Tasks appear on the timeline in their actual time positions.
                *   Real-time logging: Tasks active for at least 10 seconds are logged and displayed on the graph every 10 seconds.
                *   Each task is assigned a distinct color from a palette of 64 different hues to ensure visual differentiation.
                *   Color assignments persist per task within a project.
            *   **Other Views (Week/Month/YTD):**
                *   Displays aggregated time spent per task (e.g., bar chart).
                *   Visualizes task timing throughout the selected period (e.g., timeline chart).
            *   Timeframe selection buttons: Day / Week / Month / YTD.
            *   All graphs reflect data *only* for the currently selected project.
        *   **Session/Historical Log:**
            *   Displays logged 15-minute intervals chronologically (Task Name, Timestamp).
            *   Filters match the graph view (Day/Week/Month/YTD).
            *   Shows data *only* for the currently selected project.

### 3.3. Timer & Logging Workflow
    1.  User selects/creates a project.
    2.  User adds tasks to the queue.
    3.  User selects a task from the queue to make it active.
    4.  User clicks "Start" on the 15-minute timer in the "Current Task Display".
    5.  Timer counts down from 15:00.
    6.  **On Timer Completion:**
        *   A looping sound notification plays.
        *   The completed 15-minute interval (active task name, end timestamp) is automatically logged to local storage for the current project.
        *   A prompt appears (e.g., overlay or in the task area): "Interval Complete! Continue with '[Task Name]' or select a new task?"
        *   User interaction (clicking "Continue" or selecting a different task) stops the sound and either starts the next 15-minute interval for the same task or prepares the timer for the newly selected task.
    7.  User can Pause/Reset the timer manually. Pausing stops the clock; Resetting stops and clears the current interval progress *without* logging.

### 3.4. Settings & Data
    *   **End-of-Interval Sound Selection:**
        *   Includes a default sound.
        *   Button/Input allows user to select a local audio file (`.mp3`, `.wav`, `.ogg`) to use as the notification sound. Selection persists in local storage.
        *   Option to adjust notification volume or select from premade sound options.
    *   **Theme Toggle:**
        *   Persistent button in the top-right corner of every screen to toggle between light and dark mode.
        *   Dark mode features a dark grey-blue theme for reduced eye strain during extended use.
        *   Theme preference persists in local storage.
    *   **Data Persistence:** All project names, task queues, logs, and settings use browser `localStorage` or `IndexedDB`.
    *   **Data Export:** Button to export the log data for the **current project** and **selected timeframe** (Day/Week/Month/YTD) as a CSV or JSON file.

## 4. Technical Considerations
    *   Frontend Framework/Library: (To be decided - e.g., Vanilla JS, React, Vue, Svelte)
    *   Charting Library: (To be decided - e.g., Chart.js, D3.js)
    *   Local Storage Strategy: Plan keys carefully for project namespacing. Consider `IndexedDB` for potentially larger log data over time.
    *   Audio Handling: Use the Web Audio API for playback control (looping, stopping).
    *   File Input API: For custom sound selection.

## 5. Exclusions (v1)
    *   No user accounts or cloud sync.
    *   No collaboration features.
    *   No mobile-specific app (focus on desktop browser first).
    *   No complex reporting beyond the specified graphs/logs.

## 6. Potential Improvements (Future Versions)
    *   **Enhanced Task Management:**
        *   Drag-and-drop task reordering in queue for more intuitive prioritization.
        *   Task categories or tags for deeper organization within projects.
    *   **Timer Refinements:**
        *   Option for custom interval lengths beyond the standard 15 minutes.
        *   Auto-transition to next queued task upon interval completion.
        *   Mini breaks between intervals (Pomodoro-style).
    *   **UI Enhancements:**
        *   Keyboard shortcuts for common actions (start/pause timer, task switching).
        *   Visual task completion progress per project.
        *   Weekly/monthly productivity streaks and insights.
    *   **Data Visualization:**
        *   Enhanced chart types and filtering options.
        *   Productivity pattern identification.
        *   Daily/weekly goal setting with visual progress indicators.
