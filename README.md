# Relaxing Pomodoro Timer

This is a clean, lightweight Pomodoro timer built to help you stay focused. It runs entirely in your web browser, using simple and customisable sessions to structure your work and breaks.

## Features

- Three Timer Modes: Easy switching between Focus sessions, Short Breaks, and Long Breaks.
- Fully Customisable: Open the settings modal to adjust durations for each of the three modes.
- Built-in Synthesised Audio: Select from three sounds (Gentle Chime, Soft Bell, and Digital Beep). Since the app uses the Web Audio API to generate the sounds in real time, there are no external audio files to download.
- Progress Tracker: Keeps track of your daily focus time in hours and minutes.
- Midnight Auto-Reset: The daily tracker automatically resets at midnight so you start fresh every morning.
- Dark Mode: Toggle between light and dark themes. The app remembers your preference.
- Local Storage Support: Your settings, daily focus time, and dark mode preferences are saved in your browser, so everything stays intact if you close or refresh the page.

## Running Locally

Because the app is built using vanilla HTML, CSS, and JavaScript, you do not need to install any packages, build tools, or servers.

1. Clone or download this repository to your computer.
2. Open index.html in any modern web browser.

## Using the GitHub Hosted Version

If this project is hosted on GitHub, you can access and run it directly online using GitHub Pages.

### How to access it
Here click this: [Pomodoro Timer](https://devxdebanjan.github.io/PomodoroTimer/)

### How it behaves when hosted
- No Installation Needed: You can run and use the timer straight from the link on any device (computer, tablet, or mobile phone).
- Data Privacy: Even though the app is hosted online, all your settings, preferences, and daily stats are stored directly on your device inside your browser's local storage. None of your data is sent to a server or stored remotely.
- Audio Support: Audio alerts work exactly the same way when hosted. Just make sure to interact with the page once after loading it so the browser allows the audio player to initialize.
