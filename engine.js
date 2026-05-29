
        const timerDisplay = document.getElementById('timer');
        const scrambleDisplay = document.getElementById('scramble');
        const timesList = document.getElementById('times-list');
        const btnPrevScramble = document.getElementById('btn-prev-scramble');
        const puzzleSelect = document.getElementById('puzzle-select');
        const inspectionToggle = document.getElementById('wca-inspection');
        const hintDisplay = document.querySelector('.hint');
        const btnToggleDraw = document.getElementById('btn-toggle-draw');
        const scrambleHintIcon = document.getElementById('scramble-hint-icon');
        const scrambleHintPopup = document.getElementById('scramble-hint-popup');
        const scrambleDraw = document.getElementById('scramble-draw');


        let state = 'idle'; 
        let startTime, animationFrameId;
        let inspectionTimeout, inspectionInterval;
        let inspectionSeconds = 15;
        let holdTimeout;
        const HOLD_REQUIRED_MS = 300; 
        
        let allSolves = [];
        let scramblesHistory = [];
        let currentScrambleIndex = -1;

        function updateHint() {

         const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
                if (inspectionToggle.checked) {
             hintDisplay.innerHTML = isTouchDevice 
                 ? "Tap timer zone above to start 15s inspection, then hold to ready" 
                 : "Press Space/Click to start 15s inspection, then hold to ready";
    }       else {
             hintDisplay.innerHTML = isTouchDevice 
                 ? "Hold timer zone above to ready <br> Release to start and Tap anywhere to stop" 
                 : "Hold Spacebar or Click to ready. Release to start.<br>Tap to stop (Alt+Z deletes last solve)";
    }
}

scrambleHintIcon.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the click from instantly bubbling up and closing
    scrambleHintPopup.classList.toggle('show');
});

// Close the popup if the user clicks anywhere else on the screen
document.addEventListener('click', (e) => {
    if (scrambleHintPopup.classList.contains('show') && e.target !== scrambleHintIcon && !scrambleHintPopup.contains(e.target)) {
        scrambleHintPopup.classList.remove('show');
    }
});

        function init() {
            loadFromLocalStorage();
            changePuzzle(); 
            updateUI();
            updateHint(); 
 
            inspectionToggle.addEventListener('change', updateHint);
    
            document.addEventListener('click', function(e) {
             if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                e.target.blur();
        }
    });
}


        function loadFromLocalStorage() {
            try {
                const stored = localStorage.getItem('xkytimer_solves');
                if (stored) allSolves = JSON.parse(stored);
            } catch (e) { allSolves = []; }
        }

        function saveToLocalStorage() {
            localStorage.setItem('xkytimer_solves', JSON.stringify(allSolves));
            updateUI();
        }

        const PUZZLE_DEFS = {
            '2x2': { moves: ['U','R','F'], mods: ['',"'",'2'], len: 11 },
            '3x3': { moves: ['U','D','R','L','F','B'], mods: ['',"'",'2'], len: 20 },
            '4x4': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw'], mods: ['',"'",'2'], len: 45 },
            '5x5': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw'], mods: ['',"'",'2'], len: 60 },
            '6x6': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw','3Uw','3Dw','3Rw','3Lw','3Fw','3Bw'], mods: ['',"'",'2'], len: 80 },
            '7x7': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw','3Uw','3Dw','3Rw','3Lw','3Fw','3Bw'], mods: ['',"'",'2'], len: 100 },
            '8x8': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw','3Uw','3Dw','3Rw','3Lw','3Fw','3Bw','4Uw','4Dw','4Rw','4Lw','4Fw','4Bw'], mods: ['',"'",'2'], len: 120 },
            '9x9': { moves: ['U','D','R','L','F','B','Uw','Dw','Rw','Lw','Fw','Bw','3Uw','3Dw','3Rw','3Lw','3Fw','3Bw','4Uw','4Dw','4Rw','4Lw','4Fw','4Bw'], mods: ['',"'",'2'], len: 120 },
            'pyraminx': { moves: ['U','L','R','B'], mods: ['',"'",'2'], tips: ['u','l','r','b'], tipMods: ['',"'" ], len: 10 }
        };

        function generateScramble(type) {
            const def = PUZZLE_DEFS[type];
            let scramble = [];
            const axisMatches = {
                'U':0, 'D':0, 'Uw':0, 'Dw':0, '3Uw':0, '3Dw':0, '4Uw':0, '4Dw':0,
                'R':1, 'L':1, 'Rw':1, 'Lw':1, '3Rw':1, '3Lw':1, '4Rw':1, '4Lw':1,
                'F':2, 'B':2, 'Fw':2, 'Bw':2, '3Fw':2, '3Bw':2, '4Fw':2, '4Bw':2
            };

            let lastAxis = -1;
            let secondLastAxis = -1;

            for (let i = 0; i < def.len; i++) {
                let move, axis;
                do {
                    move = def.moves[Math.floor(Math.random() * def.moves.length)];
                    axis = axisMatches[move];
                } while (axis === lastAxis || (axis === secondLastAxis && axis === lastAxis));
                
                secondLastAxis = lastAxis;
                lastAxis = axis;
                
                let mod = def.mods[Math.floor(Math.random() * def.mods.length)];
                scramble.push(move + mod);
            }

            if (def.tips) {
                def.tips.forEach(tip => {
                    if (Math.random() > 0.5) {
                        let mod = def.tipMods[Math.floor(Math.random() * def.tipMods.length)];
                        scramble.push(tip + mod);
                    }
                });
            }

            return scramble.join(' ');
        }
        
        // --- 3x3 Scramble Visualizer ---


function drawScramble(scrambleStr) {
    // Only show the visualizer (and the mobile button) if 3x3 is selected
    if (puzzleSelect.value !== '3x3') {
        scrambleDraw.style.display = 'none';
        btnToggleDraw.classList.remove('show-on-mobile'); // Hide button
        return;
    }
    
    scrambleDraw.style.display = 'grid';
    btnToggleDraw.classList.add('show-on-mobile');

    // Standard WCA Colors
    const state = {
        U: Array(9).fill('#ffffff'), // White
        R: Array(9).fill('#ff3b30'), // Red
        F: Array(9).fill('#34c759'), // Green
        D: Array(9).fill('#ffcc00'), // Yellow
        L: Array(9).fill('#ff9500'), // Orange
        B: Array(9).fill('#007aff')  // Blue
    };

    // Helper to rotate a single face 90deg clockwise
    const rotateFace = (face) => {
        const temp = [...face];
        face[0] = temp[6]; face[1] = temp[3]; face[2] = temp[0];
        face[3] = temp[7]; face[4] = temp[4]; face[5] = temp[1];
        face[6] = temp[8]; face[7] = temp[5]; face[8] = temp[2];
    };

    // Helper to cycle the edges of adjacent faces
    const cycle = (a, ai, b, bi, c, ci, d, di) => {
        for (let i = 0; i < 3; i++) {
            let temp = state[a][ai[i]];
            state[a][ai[i]] = state[d][di[i]];
            state[d][di[i]] = state[c][ci[i]];
            state[c][ci[i]] = state[b][bi[i]];
            state[b][bi[i]] = temp;
        }
    };

    // Definitions of how each basic move affects the array
    const moves = {
        'U': () => { rotateFace(state.U); cycle('F', [0,1,2], 'L', [0,1,2], 'B', [0,1,2], 'R', [0,1,2]); },
        'D': () => { rotateFace(state.D); cycle('F', [6,7,8], 'R', [6,7,8], 'B', [6,7,8], 'L', [6,7,8]); },
        'F': () => { rotateFace(state.F); cycle('U', [6,7,8], 'R', [0,3,6], 'D', [2,1,0], 'L', [8,5,2]); },
        'B': () => { rotateFace(state.B); cycle('U', [2,1,0], 'L', [0,3,6], 'D', [6,7,8], 'R', [8,5,2]); },
        'R': () => { rotateFace(state.R); cycle('U', [8,5,2], 'B', [0,3,6], 'D', [8,5,2], 'F', [8,5,2]); },
        'L': () => { rotateFace(state.L); cycle('U', [0,3,6], 'F', [0,3,6], 'D', [0,3,6], 'B', [8,5,2]); }
    };

    // Apply the scramble string
    const tokens = scrambleStr.split(' ');
    tokens.forEach(token => {
        if (!token) return;
        const baseMove = token[0];
        let times = 1;
        if (token.includes('2')) times = 2;
        else if (token.includes("'")) times = 3;

        for(let i = 0; i < times; i++) {
            if (moves[baseMove]) moves[baseMove]();
        }
    });

    // Render the state to HTML
    scrambleDraw.innerHTML = '';
    ['U', 'L', 'F', 'R', 'B', 'D'].forEach(faceName => {
        const faceDiv = document.createElement('div');
        faceDiv.className = 'cube-face';
        faceDiv.id = 'face-' + faceName;
        state[faceName].forEach(color => {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            sticker.style.backgroundColor = color;
            faceDiv.appendChild(sticker);
        });
        scrambleDraw.appendChild(faceDiv);
    });
}
        function changePuzzle() {
            scramblesHistory = [generateScramble(puzzleSelect.value)];
            currentScrambleIndex = 0;
            scrambleDisplay.textContent = scramblesHistory[0];
            btnPrevScramble.disabled = true;
            
            drawScramble(scramblesHistory[0]); 
            puzzleSelect.blur();
        }

        function navigateScramble(direction) {
            if (direction === 1) {
                currentScrambleIndex++;
                if (currentScrambleIndex >= scramblesHistory.length) {
                    scramblesHistory.push(generateScramble(puzzleSelect.value));
                }
            } else if (direction === -1 && currentScrambleIndex > 0) {
                currentScrambleIndex--;
            }
            scrambleDisplay.textContent = scramblesHistory[currentScrambleIndex];
            btnPrevScramble.disabled = currentScrambleIndex === 0;
            
            drawScramble(scramblesHistory[currentScrambleIndex]); // <--- ADD THIS
        }

        function formatTime(ms) {
            if (!ms || ms === Infinity || isNaN(ms)) return 'DNF';
            let totalSecs = ms / 1000;
            let mins = Math.floor(totalSecs / 60);
            let secs = Math.floor(totalSecs % 60);
            let millis = Math.floor(ms % 1000);
            let str = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
            return `${str}.${millis.toString().padStart(3, '0')}`;
        }

        function getActualTimeMs(solve) {
            if (solve.penalty === 'DNF') return Infinity;
            return solve.timeMs + (solve.penalty === '+2' ? 2000 : 0);
        }

        function calculateAverage(solvesArray, count) {
            if (solvesArray.length < count) return '--';
            
            let recent = solvesArray.slice(-count);
            let times = recent.map(s => getActualTimeMs(s));
            
            let dnfCount = times.filter(t => t === Infinity).length;
            if (dnfCount > 1) return 'DNF';

            times.sort((a, b) => a - b);
            times.pop(); 
            times.shift(); 
            
            let sum = times.reduce((a, b) => a + b, 0);
            return formatTime(sum / times.length);
        }

        function updateUI() {
            timesList.innerHTML = '';
            

            let currentPuzzleSolves = allSolves.filter(s => s.puzzle === puzzleSelect.value);
            let validTimes = currentPuzzleSolves.map(getActualTimeMs).filter(t => t !== Infinity);
            

            document.getElementById('stat-best').textContent = validTimes.length > 0 ? formatTime(Math.min(...validTimes)) : '--';
            document.getElementById('stat-mean').textContent = validTimes.length > 0 ? formatTime(validTimes.reduce((a,b)=>a+b,0) / validTimes.length) : '--';
            document.getElementById('stat-ao5').textContent = calculateAverage(currentPuzzleSolves, 5);
            document.getElementById('stat-ao12').textContent = calculateAverage(currentPuzzleSolves, 12);


            const displaySolves = [...allSolves].reverse();
            displaySolves.forEach((solve, index) => {
                const solveNum = displaySolves.length - index; 
                let finalTimeStr = formatTime(getActualTimeMs(solve));
                
                let timeClass = 'solve-time';
                if (solve.penalty === '+2') timeClass += ' plus-two';
                if (solve.penalty === 'DNF') timeClass += ' dnf';

                let gapHtml = '';

                let prevSolve = displaySolves.slice(index + 1).find(s => s.puzzle === solve.puzzle);
                
                if (prevSolve) { 
                    let currentMs = getActualTimeMs(solve);
                    let prevMs = getActualTimeMs(prevSolve);

                    if (currentMs !== Infinity && prevMs !== Infinity) {
                        let diffMs = currentMs - prevMs;
                        if (diffMs > 0) {
                            gapHtml = `<span class="time-gap plus">(+${formatTime(diffMs)})</span>`;
                        } else if (diffMs < 0) {
                            gapHtml = `<span class="time-gap minus">(-${formatTime(Math.abs(diffMs))})</span>`;
                        } else {
                            gapHtml = `<span class="time-gap" style="color: #888;">(0.000)</span>`;
                        }
                    }
                }

                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="solve-header">
                        <div class="solve-info">
                            <span style="min-width: 30px;">${solveNum}.</span>
                            <span class="${timeClass}">${finalTimeStr}</span>
                            ${gapHtml}
                            <span style="font-size: 0.8rem; color:#888;">[${solve.puzzle}]</span>
                            <span style="font-size: 0.8rem; color:#666;">(${formatTime(solve.timeMs)})</span>
                        </div>
                        <div class="penalty-controls">
                            <button class="btn-penalty ${solve.penalty === '+2' ? 'active' : ''}" onclick="togglePenalty(${solve.id}, '+2')">+2</button>
                            <button class="btn-penalty ${solve.penalty === 'DNF' ? 'active' : ''}" onclick="togglePenalty(${solve.id}, 'DNF')">DNF</button>
                            <button class="btn-penalty" onclick="deleteSolve(${solve.id})" style="color: #ff5252;">&times;</button>
                        </div>
                    </div>
                    <div class="solve-scramble">${solve.scramble}</div>
                `;
                timesList.appendChild(li);
            });
        }

        function togglePenalty(id, type) {
            let solve = allSolves.find(s => s.id === id);
            if (solve) {
                solve.penalty = solve.penalty === type ? 'none' : type;
                saveToLocalStorage();
            }
        }

        function deleteSolve(id) {
            if(confirm('Delete this solve?')) {
                allSolves = allSolves.filter(s => s.id !== id);
                saveToLocalStorage();
            }
        }


        function updateInspectionDisplay() {
            if(inspectionSeconds > 0) {
                timerDisplay.textContent = inspectionSeconds;
            } else if (inspectionSeconds > -2) {
                timerDisplay.textContent = '+2';
            } else {
                timerDisplay.textContent = 'DNF';
                state = 'idle'; 
                clearInterval(inspectionInterval);
                document.body.classList.remove('no-scroll', 'solving-mode');
            }
        }

        function handlePressDown() {
            if (state === 'idle') {
                document.body.classList.add('no-scroll'); 
                
                if (inspectionToggle.checked) {
                    state = 'inspecting';
                    inspectionSeconds = 15;
                    timerDisplay.classList.add('inspecting');
                    timerDisplay.classList.remove('stopped'); 
                    document.body.classList.add('solving-mode'); 
                    updateInspectionDisplay();
                    
                    inspectionInterval = setInterval(() => {
                        inspectionSeconds--;
                        updateInspectionDisplay();
                    }, 1000);
                } else {
                    beginWaitPhase();
                }
            } else if (state === 'inspecting') {
                beginWaitPhase();
            }
        }

        function beginWaitPhase() {
            state = 'waiting';
            timerDisplay.classList.add('waiting');
            timerDisplay.classList.remove('stopped', 'ready', 'inspecting');
            
            timerDisplay.textContent = '0.000';

            holdTimeout = setTimeout(() => {
                if (state === 'waiting') {
                    state = 'ready';
                    timerDisplay.classList.remove('waiting');
                    timerDisplay.classList.add('ready');
                    document.body.classList.add('solving-mode'); 
                }
            }, HOLD_REQUIRED_MS);
        }

        function handleReleaseUp() {
            if (state === 'waiting') {
                clearTimeout(holdTimeout);
                if (inspectionToggle.checked && inspectionSeconds > -2) {
                    state = 'inspecting';
                    timerDisplay.classList.remove('waiting');
                    timerDisplay.classList.add('inspecting');
                    updateInspectionDisplay();
                } else {
                    state = 'idle';
                    timerDisplay.classList.remove('waiting');
                    document.body.classList.remove('no-scroll', 'solving-mode');
                    timerDisplay.textContent = '0.000';
                }
            } else if (state === 'ready') {
                clearInterval(inspectionInterval);
                state = 'running';
                timerDisplay.classList.remove('ready');
                startTime = performance.now();
                animationFrameId = requestAnimationFrame(updateTimerLoop);
            }
        }

        function handleTimerStop() {
            if (state === 'running') {
                state = 'idle';
                cancelAnimationFrame(animationFrameId);
                const finalTimeMs = performance.now() - startTime;
                
                let autoPenalty = 'none';
                if(inspectionToggle.checked) {
                    if (inspectionSeconds <= 0 && inspectionSeconds > -2) autoPenalty = '+2';
                    if (inspectionSeconds <= -2) autoPenalty = 'DNF';
                }

                let gapHtml = '';
                let currentPuzzleSolves = allSolves.filter(s => s.puzzle === puzzleSelect.value);
                
                if (currentPuzzleSolves.length > 0) {
                    let prevSolve = currentPuzzleSolves[currentPuzzleSolves.length - 1];
                    let prevMs = getActualTimeMs(prevSolve);
                    
                    let currentMs = finalTimeMs;
                    if (autoPenalty === '+2') currentMs += 2000;
                    if (autoPenalty === 'DNF') currentMs = Infinity;

                    if (currentMs !== Infinity && prevMs !== Infinity) {
                        let diffMs = currentMs - prevMs;
                        if (diffMs > 0) {
                            gapHtml = `<span class="main-time-gap plus">(+${formatTime(diffMs)})</span>`;
                        } else if (diffMs < 0) {
                            gapHtml = `<span class="main-time-gap minus">(-${formatTime(Math.abs(diffMs))})</span>`;
                        } else {
                            gapHtml = `<span class="main-time-gap" style="color: #888;">(0.000)</span>`;
                        }
                    }
                }

                timerDisplay.innerHTML = formatTime(finalTimeMs) + gapHtml;
                timerDisplay.classList.add('stopped');
                document.body.classList.remove('no-scroll', 'solving-mode'); 

                allSolves.push({
                    id: Date.now(),
                    puzzle: puzzleSelect.value,
                    timeMs: finalTimeMs,
                    penalty: autoPenalty,
                    scramble: scramblesHistory[currentScrambleIndex],
                    date: new Date().toISOString()
                });
                
                saveToLocalStorage();
                navigateScramble(1);
            }
        }

        function updateTimerLoop() {
            timerDisplay.textContent = formatTime(performance.now() - startTime);
            animationFrameId = requestAnimationFrame(updateTimerLoop);
        }


        function clearSession() {
            if (confirm("Clear all recorded solves? This will start a fresh session.")) {
                allSolves = [];
                saveToLocalStorage();
                
                state = 'idle';
                timerDisplay.textContent = '0.000';
                timerDisplay.className = ''; 
                
                clearInterval(inspectionInterval);
                clearTimeout(holdTimeout);
                document.body.classList.remove('no-scroll');
            }
        }

        function exportData() {
            if (allSolves.length === 0) return alert("No solves to export.");
            const dataStr = JSON.stringify({ app: "xkytimer", solves: allSolves }, null, 2);
            const blob = new Blob([dataStr], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `xkytimer_export.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            event.target.value = '';
            
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (!parsed.solves) throw new Error("Invalid format");
                    
                    const existingIds = new Set(allSolves.map(s => s.id));
                    parsed.solves.forEach(solve => {
                        if (!existingIds.has(solve.id)) allSolves.push(solve);
                    });
                    
                    allSolves.sort((a, b) => a.id - b.id);
                    saveToLocalStorage();
                    alert("Import successful!");
                } catch (error) { alert("Failed to parse file."); }
            };
            reader.readAsText(file);
        }


        

function toggleScrambleDraw() {
    scrambleDraw.classList.toggle('force-hide');
    const isHidden = scrambleDraw.classList.contains('force-hide');
    
    // Change the button text based on the state
    btnToggleDraw.textContent = isHidden ? "Show Draw" : "Hide Draw";
    
    // Remove focus so hitting spacebar later doesn't accidentally click it
    btnToggleDraw.blur(); 
}



function isInteractiveElement(el, e) {
    // 1. Always allow interacting with buttons, dropdowns, and our new hint popup
    if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || 
        el.closest('button') !== null || el.closest('.header-controls') !== null || 
        el.closest('.hint-wrapper') !== null) { // <--- ADDED THIS LINE
        return true;
    }

    if (typeof state !== 'undefined' && state !== 'idle') {
        return false;
    }


    if (el.closest('.stats-container') || el.closest('#times-container') || el.closest('footer')) {
        return true;
    }


    if (e && (e.type.includes('touch') || e.type.includes('mouse'))) {
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        const statsBox = document.querySelector('.stats-container');
        
        if (statsBox && statsBox.offsetParent !== null) { 
            if (clientY !== undefined && clientY >= statsBox.getBoundingClientRect().top) {
                return true; // Treat as a scroll
            }
        }
    }

    return false;
}

window.addEventListener('keydown', (e) => {
    // Notice we pass "e" into isInteractiveElement now
    if (isInteractiveElement(e.target, e) && e.target.tagName !== 'BUTTON') return;

    if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        if(allSolves.length > 0) deleteSolve(allSolves[allSolves.length-1].id);
        return;
    }

    const stopType = document.getElementById('stop-type').value;

    if (state === 'running') {
        if (stopType === 'any' || e.code === 'Space') {
            e.preventDefault();
            handleTimerStop();
        }
        return; 
    }

    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return; 
        handlePressDown();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') handleReleaseUp();
});

window.addEventListener('mousedown', (e) => {
    if (isInteractiveElement(e.target, e)) return;
    if (e.button !== 0) return; 
    if (e.detail > 1) e.preventDefault(); 

    if (state === 'running') {
        handleTimerStop();
        touchLock = true; 
    } else if (!touchLock) {
        handlePressDown();
    }
});

window.addEventListener('mouseup', (e) => {
    if (isInteractiveElement(e.target, e)) return;
    if (e.button !== 0) return;

    if (state === 'waiting' || state === 'ready') {
        handleReleaseUp();
    }
    touchLock = false;
});

let touchLock = false;

window.addEventListener('touchstart', (e) => {
    if (isInteractiveElement(e.target, e)) return;
    e.preventDefault(); 
    
    if (state === 'running') {
        handleTimerStop();
        touchLock = true; 
    } else if (!touchLock) {
        handlePressDown();
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('no-scroll') && !isInteractiveElement(e.target, e)) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (isInteractiveElement(e.target, e)) return;
    e.preventDefault();
    if (e.touches.length === 0) {
        if (state === 'waiting' || state === 'ready') handleReleaseUp();
        touchLock = false;
    }
}, { passive: false });

window.addEventListener('touchcancel', (e) => {
    if (isInteractiveElement(e.target, e)) return;
    if (state === 'waiting' || state === 'ready') {
        clearTimeout(holdTimeout);
        state = 'idle';
        document.body.classList.remove('no-scroll', 'solving-mode');
        timerDisplay.classList.remove('waiting', 'ready');
        timerDisplay.textContent = '0.000';
    }
    if (e.touches.length === 0) touchLock = false;
});

window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
window.addEventListener('dragstart', function (e) { e.preventDefault(); });
window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'x')) {
        e.preventDefault();
    }
});

init();