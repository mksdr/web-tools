// gomoku/gomoku.js

document.addEventListener('DOMContentLoaded', () => {
  // Game State variables
  let board = [];
  let history = []; // Stack of { r, c, player, notation }
  let currentPlayer = 1; // 1 = BLACK, 2 = WHITE
  let gameMode = 'vsAI'; // 'vsAI' or 'local2P'
  let playerColor = 1; // 1 = Player is BLACK (first), 2 = Player is WHITE (second)
  let difficulty = 'normal'; // 'easy', 'normal', 'hard'
  let isGameOver = false;
  let winner = null;
  
  let showMoveNumbers = false;
  let showForbiddenPoints = true;
  let aiThinking = false;
  
  // Rules and AI module references
  const Rules = window.GomokuRules;
  const AI = window.GomokuAI;
  
  // DOM Elements
  const boardContainer = document.getElementById('gomoku-board-container');
  const boardLines = document.getElementById('board-lines');
  const starPoints = document.getElementById('star-points');
  const boardGrid = document.getElementById('board-grid');
  
  const statusTurnBadge = document.getElementById('status-turn-badge');
  const statusMessage = document.getElementById('status-message');
  const aiThinkingIndicator = document.getElementById('ai-thinking-indicator');
  
  const selectGameMode = document.getElementById('select-game-mode');
  const selectDifficulty = document.getElementById('select-difficulty');
  const difficultyContainer = document.getElementById('difficulty-container');
  const selectPlayerColor = document.getElementById('select-player-color');
  const colorContainer = document.getElementById('color-container');
  
  const btnRestart = document.getElementById('btn-restart');
  const btnUndo = document.getElementById('btn-undo');
  const toggleNumbers = document.getElementById('toggle-numbers');
  const toggleForbidden = document.getElementById('toggle-forbidden');
  
  const moveHistoryList = document.getElementById('move-history-list');
  const btnCopyRecord = document.getElementById('btn-copy-record');
  const btnImportRecord = document.getElementById('btn-import-record');
  
  // Initialize game board array
  function initBoardArray() {
    board = Array(15).fill(null).map(() => Array(15).fill(0));
    history = [];
    currentPlayer = 1;
    isGameOver = false;
    winner = null;
  }
  
  // Initialize board DOM layout
  function drawBoardBG() {
    // Clean containers
    boardLines.innerHTML = '';
    starPoints.innerHTML = '';
    
    // Draw 15 horizontal and 15 vertical grid lines
    // Lines align with the centers of the cells: (i + 0.5) / 15 * 100%
    for (let i = 0; i < 15; i++) {
      const pct = ((i + 0.5) / 15) * 100;
      
      // Horizontal Line
      const hLine = document.createElement('div');
      hLine.className = 'absolute left-[3.33%] right-[3.33%] h-[1px] bg-neutral-300 dark:bg-neutral-700 pointer-events-none';
      hLine.style.top = `${pct}%`;
      boardLines.appendChild(hLine);
      
      // Vertical Line
      const vLine = document.createElement('div');
      vLine.className = 'absolute top-[3.33%] bottom-[3.33%] w-[1px] bg-neutral-300 dark:bg-neutral-700 pointer-events-none';
      vLine.style.left = `${pct}%`;
      boardLines.appendChild(vLine);
    }
    
    // Draw Star Points (화점) at (3,3), (3,11), (7,7), (11,3), (11,11)
    const stars = [
      [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ];
    stars.forEach(([r, c]) => {
      const topPct = ((r + 0.5) / 15) * 100;
      const leftPct = ((c + 0.5) / 15) * 100;
      
      const star = document.createElement('div');
      star.className = 'absolute w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm';
      star.style.top = `${topPct}%`;
      star.style.left = `${leftPct}%`;
      starPoints.appendChild(star);
    });
  }
  
  // Render the grid elements (cells, stones, and forbidden marks)
  function renderGrid() {
    boardGrid.innerHTML = '';
    
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.className = 'relative aspect-square cursor-pointer flex items-center justify-center group';
        cell.dataset.row = r;
        cell.dataset.col = c;
        
        const cellVal = board[r][c];
        const isForbiddenPoint = (currentPlayer === 1 && showForbiddenPoints && Rules.isForbidden(r, c, board, 1));
        
        // 1. Placed Stone
        if (cellVal !== 0) {
          const stone = document.createElement('div');
          // Responsive stone sizing
          stone.className = `w-[88%] h-[88%] rounded-full flex items-center justify-center select-none transition-transform duration-200 transform scale-100 relative`;
          
          if (cellVal === 1) {
            // Black stone gradient and 3D look
            stone.classList.add('bg-gradient-to-br', 'from-neutral-700', 'to-neutral-900', 'shadow-md', 'shadow-black/50', 'border', 'border-neutral-800');
          } else {
            // White stone gradient
            stone.classList.add('bg-gradient-to-br', 'from-white', 'to-neutral-200', 'shadow-md', 'shadow-black/30', 'border', 'border-neutral-300');
          }
          
          // Display move numbers if toggled
          if (showMoveNumbers) {
            const moveIndex = history.findIndex(m => m.r === r && m.c === c);
            if (moveIndex !== -1) {
              const numSpan = document.createElement('span');
              numSpan.className = `text-[10px] sm:text-xs font-bold ${cellVal === 1 ? 'text-neutral-300' : 'text-neutral-700'}`;
              numSpan.innerText = moveIndex + 1;
              stone.appendChild(numSpan);
            }
          }
          
          // Highlight the most recent move
          const latestMove = history[history.length - 1];
          if (latestMove && latestMove.r === r && latestMove.c === c) {
            const pulseNode = document.createElement('div');
            pulseNode.className = `absolute -inset-0.5 rounded-full border-2 border-indigo-500 animate-ping opacity-75`;
            stone.appendChild(pulseNode);
            
            const dotIndicator = document.createElement('div');
            dotIndicator.className = `absolute w-1.5 h-1.5 rounded-full ${cellVal === 1 ? 'bg-indigo-400' : 'bg-indigo-600'}`;
            stone.appendChild(dotIndicator);
          }
          
          cell.appendChild(stone);
        }
        // 2. Empty cell with forbidden point indicator (Black's turn only)
        else if (isForbiddenPoint && !isGameOver && !aiThinking) {
          const forbiddenMark = document.createElement('div');
          forbiddenMark.className = 'w-6 h-6 rounded-full border border-red-500 bg-red-500/10 flex items-center justify-center text-[10px] text-red-500 font-extrabold select-none shadow-sm';
          forbiddenMark.innerText = 'X';
          cell.appendChild(forbiddenMark);
          
          // Hover overlay explaining forbidden point
          const tooltip = document.createElement('div');
          tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg z-30 pointer-events-none whitespace-nowrap font-medium';
          tooltip.innerText = getForbiddenReason(r, c);
          cell.appendChild(tooltip);
        }
        // 3. Normal empty cell (Show hover preview if human turn)
        else if (!isGameOver && !aiThinking && isHumanTurn()) {
          const preview = document.createElement('div');
          preview.className = `w-[88%] h-[88%] rounded-full opacity-0 group-hover:opacity-30 transition-opacity border-dashed border pointer-events-none`;
          
          if (currentPlayer === 1) {
            preview.classList.add('bg-neutral-800', 'border-neutral-900');
          } else {
            preview.classList.add('bg-white', 'border-neutral-300');
          }
          cell.appendChild(preview);
        }
        
        // Add click listener
        cell.addEventListener('click', () => handleCellClick(r, c));
        boardGrid.appendChild(cell);
      }
    }
  }
  
  // Get description of why a cell is forbidden
  function getForbiddenReason(r, c) {
    // Temporarily place stone
    board[r][c] = 1;
    let reason = '금수 (Forbidden)';
    try {
      if (Rules.checkOverline(r, c, board, 1)) {
        reason = '장목 금수 (6목 이상)';
      } else if (Rules.countFours(r, c, board, 1) >= 2) {
        reason = '4-4 금수';
      } else if (Rules.countOpenThrees(r, c, board, 1, 0) >= 2) {
        reason = '3-3 금수';
      }
    } finally {
      board[r][c] = 0;
    }
    return reason;
  }
  
  // Determines if it is currently a human player's turn
  function isHumanTurn() {
    if (gameMode === 'local2P') return true;
    return currentPlayer === playerColor;
  }
  
  // Handle cell selection click
  function handleCellClick(r, c) {
    if (isGameOver || aiThinking || board[r][c] !== 0) return;
    
    // In vs AI mode, ensure it's human's turn
    if (!isHumanTurn()) return;
    
    // Check Renju rules for Black
    if (currentPlayer === 1 && Rules.isForbidden(r, c, board, 1)) {
      showToast('금수 자리에는 둘 수 없습니다!');
      return;
    }
    
    makeMove(r, c);
  }
  
  // Make a move on the board
  function makeMove(r, c) {
    const notation = Rules.coordToNotation(r, c);
    board[r][c] = currentPlayer;
    history.push({ r, c, player: currentPlayer, notation });
    
    // Check Win Condition
    if (Rules.checkFive(r, c, board, currentPlayer)) {
      endGame(currentPlayer);
      return;
    }
    
    // Check Board Full (Draw)
    if (history.length === 225) {
      endGame('draw');
      return;
    }
    
    // Switch Turn
    currentPlayer = 3 - currentPlayer;
    updateUI();
    
    // Trigger AI if it's AI's turn
    if (gameMode === 'vsAI' && currentPlayer !== playerColor && !isGameOver) {
      triggerAI();
    }
  }
  
  // Trigger AI calculation in the background
  function triggerAI() {
    setAIThinking(true);
    
    // Use setTimeout to allow UI thread to render "thinking" state
    setTimeout(() => {
      try {
        const bestMove = AI.getBestMove(board, currentPlayer, difficulty);
        if (bestMove) {
          makeMove(bestMove.r, bestMove.c);
        } else {
          // Fallback if AI finds no move (should only happen if board full)
          endGame('draw');
        }
      } catch (err) {
        console.error('AI Move Error:', err);
        showToast('AI 연산 중 오류가 발생했습니다.');
      } finally {
        setAIThinking(false);
      }
    }, 250); // Small delay to feel natural and show spinner
  }
  
  // Set AI thinking state
  function setAIThinking(isThinking) {
    aiThinking = isThinking;
    if (isThinking) {
      aiThinkingIndicator.classList.remove('hidden');
      aiThinkingIndicator.classList.add('flex');
    } else {
      aiThinkingIndicator.classList.add('hidden');
      aiThinkingIndicator.classList.remove('flex');
    }
    renderGrid();
  }
  
  // Handle game end state
  function endGame(gameWinner) {
    isGameOver = true;
    winner = gameWinner;
    updateUI();
    
    let msg = '';
    if (winner === 'draw') {
      msg = '무승부입니다!';
    } else if (winner === 1) {
      msg = '흑돌 승리!';
    } else {
      msg = '백돌 승리!';
    }
    
    // Display result message
    statusMessage.innerText = msg;
    statusMessage.className = 'text-xl font-black text-indigo-600 dark:text-space-accent animate-bounce';
    
    showToast(msg);
  }
  
  // Update overall UI elements (badges, logs, undo button state)
  function updateUI() {
    // 1. Render Grid
    renderGrid();
    
    // 2. Update Status Message and Turn Badges
    if (!isGameOver) {
      statusMessage.className = 'text-sm text-gray-600 dark:text-gray-400 font-medium';
      if (currentPlayer === 1) {
        statusMessage.innerText = '흑돌의 차례입니다.';
        statusTurnBadge.className = 'w-3 h-3 rounded-full bg-neutral-800 dark:bg-neutral-100 border border-neutral-600 shadow-sm animate-pulse';
      } else {
        statusMessage.innerText = '백돌의 차례입니다.';
        statusTurnBadge.className = 'w-3 h-3 rounded-full bg-neutral-100 border border-neutral-400 shadow-sm animate-pulse';
      }
    }
    
    // 3. Update Move History Sidebar
    renderHistoryList();
    
    // 4. Update Undo Button State
    if (history.length > 0) {
      btnUndo.disabled = false;
      btnUndo.classList.remove('opacity-40', 'cursor-not-allowed');
    } else {
      btnUndo.disabled = true;
      btnUndo.classList.add('opacity-40', 'cursor-not-allowed');
    }
  }
  
  // Render move history list
  function renderHistoryList() {
    moveHistoryList.innerHTML = '';
    
    if (history.length === 0) {
      moveHistoryList.innerHTML = `
        <div class="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
          기보 기록이 없습니다.
        </div>
      `;
      return;
    }
    
    history.forEach((move, index) => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between py-1.5 px-3 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-white/5 border border-transparent transition-colors';
      
      const numSpan = document.createElement('span');
      numSpan.className = 'font-bold text-gray-400 w-6';
      numSpan.innerText = `${index + 1}.`;
      
      const colorIndicator = document.createElement('div');
      colorIndicator.className = `w-2.5 h-2.5 rounded-full mr-2 border border-gray-400 shadow-sm flex-shrink-0 ${move.player === 1 ? 'bg-neutral-800' : 'bg-white'}`;
      
      const notationSpan = document.createElement('span');
      notationSpan.className = 'font-mono text-gray-700 dark:text-gray-300 font-semibold';
      notationSpan.innerText = move.notation;
      
      const leftPart = document.createElement('div');
      leftPart.className = 'flex items-center';
      leftPart.appendChild(numSpan);
      leftPart.appendChild(colorIndicator);
      leftPart.appendChild(notationSpan);
      
      const roleSpan = document.createElement('span');
      roleSpan.className = 'text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 font-medium';
      
      if (gameMode === 'vsAI') {
        const isAI = move.player !== playerColor;
        roleSpan.innerText = isAI ? 'AI' : '플레이어';
        roleSpan.classList.add(isAI ? 'text-indigo-500' : 'text-neutral-500');
      } else {
        roleSpan.innerText = move.player === 1 ? '흑' : '백';
      }
      
      item.appendChild(leftPart);
      item.appendChild(roleSpan);
      
      moveHistoryList.appendChild(item);
    });
    
    // Auto scroll history list to bottom
    moveHistoryList.scrollTop = moveHistoryList.scrollHeight;
  }
  
  // Undo last moves
  function performUndo() {
    if (isGameOver || aiThinking || history.length === 0) return;
    
    if (gameMode === 'vsAI') {
      // Revert 2 moves if vs AI (revert AI's move and player's move)
      if (history.length >= 2) {
        const m1 = history.pop();
        const m2 = history.pop();
        board[m1.r][m1.c] = 0;
        board[m2.r][m2.c] = 0;
      } else {
        // Only 1 move on the board
        const m1 = history.pop();
        board[m1.r][m1.c] = 0;
        currentPlayer = playerColor; // Ensure it reverts to human turn
      }
    } else {
      // Revert 1 move in local 2-Player mode
      const m = history.pop();
      board[m.r][m.c] = 0;
      currentPlayer = 3 - currentPlayer;
    }
    
    updateUI();
    showToast('한 수 되돌렸습니다.');
  }
  
  // Restart Game
  function restartGame() {
    initBoardArray();
    drawBoardBG();
    updateUI();
    
    // If AI plays first (AI is Black, which plays first)
    if (gameMode === 'vsAI' && playerColor === 2) {
      triggerAI();
    }
    showToast('새 게임을 시작합니다.');
  }
  
  // Export moves record
  function copyRecord() {
    if (history.length === 0) {
      showToast('복사할 기보 기록이 없습니다.');
      return;
    }
    
    const recordString = history.map(m => m.notation).join(', ');
    navigator.clipboard.writeText(recordString)
      .then(() => showToast('기보가 클립보드에 복사되었습니다!'))
      .catch(() => showToast('기보 복사 실패.'));
  }
  
  // Import moves record
  function importRecord() {
    const input = prompt('불러올 기보를 입력해주세요 (예: H8, H9, I9, J10):');
    if (!input) return;
    
    const moves = input.split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length >= 2);
      
    if (moves.length === 0) {
      showToast('유효하지 않은 기보 형식입니다.');
      return;
    }
    
    // Reset board first
    initBoardArray();
    drawBoardBG();
    
    let delay = 0;
    let count = 0;
    
    // Replay moves sequentially with small delay for cool animation effect
    for (const moveNotation of moves) {
      const coord = Rules.notationToCoord(moveNotation);
      if (!coord) {
        showToast(`기보 오류: 잘못된 좌표 '${moveNotation}'`);
        break;
      }
      
      const { r, c } = coord;
      if (board[r][c] !== 0) {
        showToast(`기보 오류: 중복 배치 '${moveNotation}'`);
        break;
      }
      
      // Check Renju rules for Black's moves during replay
      if (currentPlayer === 1 && Rules.isForbidden(r, c, board, 1)) {
        showToast(`기보 규칙 위반: 흑 금수 위치 '${moveNotation}'`);
        break;
      }
      
      // Place stone
      board[r][c] = currentPlayer;
      history.push({ r, c, player: currentPlayer, notation: moveNotation });
      
      // Check win
      if (Rules.checkFive(r, c, board, currentPlayer)) {
        isGameOver = true;
        winner = currentPlayer;
        break;
      }
      
      currentPlayer = 3 - currentPlayer;
      count++;
    }
    
    updateUI();
    if (isGameOver) {
      endGame(winner);
    }
    showToast(`기보 로드 완료: ${count}개 수 재현됨.`);
  }
  
  // Helper to show modern styled toasts
  function showToast(message) {
    // Remove existing toast if visible
    const existing = document.getElementById('gomoku-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'gomoku-toast';
    toast.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-neutral-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl backdrop-blur border border-white/10 shadow-lg z-50 transition-all duration-300 translate-y-2 opacity-0 pointer-events-none';
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Animation trigger
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);
    
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
  
  // Event listeners for Settings
  selectGameMode.addEventListener('change', (e) => {
    gameMode = e.target.value;
    
    // Toggle difficulty selection visibility
    if (gameMode === 'vsAI') {
      difficultyContainer.classList.remove('hidden');
      colorContainer.classList.remove('hidden');
    } else {
      difficultyContainer.classList.add('hidden');
      colorContainer.classList.add('hidden');
    }
    
    restartGame();
  });
  
  selectDifficulty.addEventListener('change', (e) => {
    difficulty = e.target.value;
  });
  
  selectPlayerColor.addEventListener('change', (e) => {
    playerColor = parseInt(e.target.value, 10);
    restartGame();
  });
  
  btnRestart.addEventListener('click', restartGame);
  btnUndo.addEventListener('click', performUndo);
  
  toggleNumbers.addEventListener('change', (e) => {
    showMoveNumbers = e.target.checked;
    renderGrid();
  });
  
  toggleForbidden.addEventListener('change', (e) => {
    showForbiddenPoints = e.target.checked;
    renderGrid();
  });
  
  btnCopyRecord.addEventListener('click', copyRecord);
  btnImportRecord.addEventListener('click', importRecord);
  
  function drawCoordinates() {
    const topCoord = document.getElementById('coords-top');
    const bottomCoord = document.getElementById('coords-bottom');
    const leftCoord = document.getElementById('coords-left');
    const rightCoord = document.getElementById('coords-right');
    
    if (!topCoord) return;
    
    topCoord.innerHTML = '';
    bottomCoord.innerHTML = '';
    leftCoord.innerHTML = '';
    rightCoord.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
      const pct = ((i + 0.5) / 15) * 100;
      const letter = String.fromCharCode(65 + i);
      const number = 15 - i;
      
      // Top & Bottom (A-O)
      const labelTop = document.createElement('div');
      labelTop.className = 'absolute -translate-x-1/2 text-[9px] sm:text-[11px] font-bold text-amber-950/50 dark:text-neutral-500 font-mono w-4 text-center';
      labelTop.style.left = `${pct}%`;
      labelTop.innerText = letter;
      topCoord.appendChild(labelTop);
      
      const labelBottom = labelTop.cloneNode(true);
      bottomCoord.appendChild(labelBottom);
      
      // Left & Right (15-1)
      const labelLeft = document.createElement('div');
      labelLeft.className = 'absolute -translate-y-1/2 text-[9px] sm:text-[11px] font-bold text-amber-950/50 dark:text-neutral-500 font-mono h-4 flex items-center justify-center w-4';
      labelLeft.style.top = `${pct}%`;
      labelLeft.innerText = number;
      leftCoord.appendChild(labelLeft);
      
      const labelRight = labelLeft.cloneNode(true);
      rightCoord.appendChild(labelRight);
    }
  }

  // Run Game Setup on startup
  initBoardArray();
  drawBoardBG();
  drawCoordinates();
  updateUI();
});
