# xkytimer

xkytimer is a lightweight, browser-based speedcubing timer. It is designed to be fast, accurate, and easy to use, utilizing native JavaScript performance APIs to ensure millisecond-precise timing.

[![Sponsor on GitHub](https://dabuttonfactory.com/button.png?t=Click+To+Try&f=Roboto-Bold&ts=28&tc=fff&hp=45&vp=20&w=1000&h=50&c=11&bgt=unicolored&bgc=f00)](https://xkyrage.github.io/xkytimer-speedcube-timer/)

## Features

* **Precision Timing:** Uses `performance.now()` and `requestAnimationFrame()` to prevent time drift and ensure highly accurate solve times.
* **WCA-Style Scrambles:** Automatically generates 20-move 3x3 scrambles, preventing consecutive moves on the same face.
* **Session Tracking:** Records and displays your recent solve times in a local list.
* **Zero Dependencies:** Built entirely with vanilla HTML, CSS, and JavaScript. No frameworks or external libraries required.

## Preview
In Action
<img width="2553" height="1293" alt="image" src="https://github.com/user-attachments/assets/56811ba5-e088-4719-b86c-340adade15c7" />
Export Session
<img width="1446" height="773" alt="image" src="https://github.com/user-attachments/assets/e993d92c-93e7-4c6e-8ee2-a0ede2d68d20" />
Export Format
<img width="1529" height="1022" alt="image" src="https://github.com/user-attachments/assets/0837bd39-7c48-4e30-a69a-de4f6b1a4217" />

### Latest Version
- with WCA inspection Mode Toggle
- Add Puzzle selection for scramble logic, for now its only for 2x2x2, 3x3x3 and pyraminx
- Stop Action Mode Option, now user can choose to stop the timer with space button, mouseclick or wiht any button
- Add session average, Current Ao5, Current Ao12 and Best Time within the session
- Add time gap beside the solve time result
- Add +2 button to add to secs for invalid solved
- Add DNF button to mark the solve as DNF
- Add delete solve in history section
- Add Time gap within solve history
- Add DISTRACTION FREE MODE when time is running
  
  <img width="2556" height="1281" alt="image" src="https://github.com/user-attachments/assets/7219bb31-a507-4c40-afc6-568fbc6534a5" />
  <img width="2558" height="1259" alt="image" src="https://github.com/user-attachments/assets/d3f63906-eda3-463b-9f06-ff90e1a58d10" />





## Usage

### Installation
1. Clone the repository or download the source code.
   
```bash
   git clone [https://github.com/yourusername/xkytimer.git](https://github.com/yourusername/xkytimer.git)
