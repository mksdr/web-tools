// gomoku/ai.js

// Gomoku AI module based on Minimax with Alpha-Beta pruning

/**
 * Quick local heuristic evaluation of playing at (r, c) for player.
 * Checks overlapping 5-cell windows in 4 directions.
 */
function getQuickLocalScore(r, c, board, player) {
  const opponent = 3 - player;
  let score = 0;
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Anti-diagonal /
  ];
  
  for (const [dr, dc] of directions) {
    // Evaluate all 5-cell windows that cover (r, c)
    for (let offset = -4; offset <= 0; offset++) {
      let pCount = 0;
      let oCount = 0;
      let isValidWindow = true;
      
      for (let step = 0; step < 5; step++) {
        const currR = r + (offset + step) * dr;
        const currC = c + (offset + step) * dc;
        
        if (currR < 0 || currR >= 15 || currC < 0 || currC >= 15) {
          isValidWindow = false;
          break;
        }
        
        const cell = board[currR][currC];
        if (cell === player) pCount++;
        else if (cell === opponent) oCount++;
      }
      
      if (isValidWindow) {
        if (pCount > 0 && oCount === 0) {
          // Player's own threat shape: give high weight
          score += Math.pow(10, pCount);
        } else if (oCount > 0 && pCount === 0) {
          // Opponent's threat shape: block value (slightly lower weight than attack)
          score += Math.pow(10, oCount) * 0.85;
        }
      }
    }
  }
  return score;
}

/**
 * Gets candidate moves within a radius of 2 from any active stone on the board.
 * Filters out forbidden moves for Black if Black is the player.
 */
function getCandidateMoves(board, player) {
  const candidates = [];
  const visited = new Set();
  const BOARD_SIZE = 15;
  const BLACK = 1;
  const EMPTY = 0;
  
  // Find all occupied cells
  const occupied = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        occupied.push({ r, c });
      }
    }
  }
  
  // If board is empty, play at center (H8 / 7,7)
  if (occupied.length === 0) {
    return [{ r: 7, c: 7 }];
  }
  
  // Scan neighbors of occupied cells
  const radius = 2;
  const rules = window.GomokuRules || (typeof require !== 'undefined' ? require('./rules.js') : null);
  
  for (const stone of occupied) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = stone.r + dr;
        const nc = stone.c + dc;
        
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            visited.add(key);
            
            // If the player to move is Black, check if this move is forbidden (Renju rules)
            if (player === BLACK && rules) {
              if (rules.isForbidden(nr, nc, board, BLACK)) {
                continue;
              }
            }
            
            candidates.push({ r: nr, c: nc });
          }
        }
      }
    }
  }
  
  return candidates;
}

/**
 * Full line analysis using run-length encoding.
 */
function evaluateLine(line, player) {
  const EMPTY = 0;
  const opponent = 3 - player;
  let score = 0;
  
  if (line.length < 5) return 0;
  
  const runs = [];
  let currentVal = line[0];
  let currentLen = 1;
  for (let i = 1; i < line.length; i++) {
    if (line[i] === currentVal) {
      currentLen++;
    } else {
      runs.push({ val: currentVal, len: currentLen });
      currentVal = line[i];
      currentLen = 1;
    }
  }
  runs.push({ val: currentVal, len: currentLen });
  
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run.val === player) {
      const L = run.len;
      const leftEmpty = (i > 0 && runs[i-1].val === EMPTY);
      const rightEmpty = (i < runs.length - 1 && runs[i+1].val === EMPTY);
      
      // Continuous patterns
      if (L >= 5) {
        score += 100000;
      } else if (L === 4) {
        if (leftEmpty && rightEmpty) {
          score += 18000; // Open 4 (win guaranteed)
        } else if (leftEmpty || rightEmpty) {
          score += 2200;  // Closed 4
        }
      } else if (L === 3) {
        if (leftEmpty && rightEmpty) {
          score += 2500;  // Open 3
        } else if (leftEmpty || rightEmpty) {
          score += 250;   // Closed 3
        }
      } else if (L === 2) {
        if (leftEmpty && rightEmpty) {
          score += 200;   // Open 2
        } else if (leftEmpty || rightEmpty) {
          score += 20;    // Closed 2
        }
      }
    }
    
    // Jumped/spaced patterns (e.g. O _ O O, O O _ O)
    if (i < runs.length - 2 && 
        run.val === player && 
        runs[i+1].val === EMPTY && runs[i+1].len === 1 && 
        runs[i+2].val === player) {
      
      const L1 = run.len;
      const L2 = runs[i+2].len;
      const total = L1 + L2;
      
      const leftEmpty = (i > 0 && runs[i-1].val === EMPTY);
      const rightEmpty = (i < runs.length - 3 && runs[i+3].val === EMPTY);
      
      if (total === 4) {
        score += 2200; // Jumped 4 (same value as closed 4)
      } else if (total === 3) {
        if (leftEmpty && rightEmpty) {
          score += 1200; // Open jumped 3
        } else if (leftEmpty || rightEmpty) {
          score += 120;
        }
      } else if (total === 2) {
        if (leftEmpty && rightEmpty) {
          score += 100;
        } else if (leftEmpty || rightEmpty) {
          score += 10;
        }
      }
    }
  }
  
  return score;
}

/**
 * Returns all rows, columns, and diagonals of length >= 5.
 */
function getAllLines(board) {
  const lines = [];
  const BOARD_SIZE = 15;
  
  // Rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    lines.push(board[r]);
  }
  
  // Columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    const col = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      col.push(board[r][c]);
    }
    lines.push(col);
  }
  
  // Diagonals (top-left to bottom-right) \
  for (let r = 0; r <= 10; r++) {
    const diag = [];
    let currR = r, currC = 0;
    while (currR < BOARD_SIZE && currC < BOARD_SIZE) {
      diag.push(board[currR][currC]);
      currR++;
      currC++;
    }
    if (diag.length >= 5) lines.push(diag);
  }
  for (let c = 1; c <= 10; c++) {
    const diag = [];
    let currR = 0, currC = c;
    while (currR < BOARD_SIZE && currC < BOARD_SIZE) {
      diag.push(board[currR][currC]);
      currR++;
      currC++;
    }
    if (diag.length >= 5) lines.push(diag);
  }
  
  // Anti-diagonals (bottom-left to top-right) /
  for (let r = 4; r < BOARD_SIZE; r++) {
    const diag = [];
    let currR = r, currC = 0;
    while (currR >= 0 && currC < BOARD_SIZE) {
      diag.push(board[currR][currC]);
      currR--;
      currC++;
    }
    if (diag.length >= 5) lines.push(diag);
  }
  for (let c = 1; c <= 10; c++) {
    const diag = [];
    let currR = 14, currC = c;
    while (currR >= 0 && currC < BOARD_SIZE) {
      diag.push(board[currR][currC]);
      currR--;
      currC++;
    }
    if (diag.length >= 5) lines.push(diag);
  }
  
  return lines;
}

/**
 * Computes heuristic score for the entire board state.
 */
function evaluateBoard(board, player) {
  const opponent = 3 - player;
  let score = 0;
  
  const lines = getAllLines(board);
  for (const line of lines) {
    score += evaluateLine(line, player);
    score -= evaluateLine(line, opponent) * 1.15; // Slightly prioritize defense
  }
  return score;
}

/**
 * Minimax algorithm with Alpha-Beta pruning and selective search limits.
 */
function minimax(board, depth, alpha, beta, isMaximizing, aiPlayer, maxCandidates) {
  const EMPTY = 0;
  const opponent = 3 - aiPlayer;
  const playerToMove = isMaximizing ? aiPlayer : opponent;
  
  // Generate candidate moves
  const candidates = getCandidateMoves(board, playerToMove);
  
  // Base cases
  if (depth === 0 || candidates.length === 0) {
    return { score: evaluateBoard(board, aiPlayer), move: null };
  }
  
  // Quick check if a win is already on the board
  const currentScore = evaluateBoard(board, aiPlayer);
  if (Math.abs(currentScore) >= 80000) {
    return { score: currentScore, move: null };
  }
  
  // Sort candidates using quick local scores
  const scoredCandidates = candidates.map(move => {
    const localScore = getQuickLocalScore(move.r, move.c, board, playerToMove);
    return { r: move.r, c: move.c, localScore };
  });
  
  scoredCandidates.sort((a, b) => b.localScore - a.localScore);
  
  // Beam search: slice to keep only the most promising moves to speed up deep searches
  const activeCandidates = scoredCandidates.slice(0, maxCandidates);
  
  let bestMove = null;
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of activeCandidates) {
      board[move.r][move.c] = aiPlayer;
      const evaluation = minimax(board, depth - 1, alpha, beta, false, aiPlayer, maxCandidates).score;
      board[move.r][move.c] = EMPTY;
      
      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Beta cut-off
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of activeCandidates) {
      board[move.r][move.c] = opponent;
      const evaluation = minimax(board, depth - 1, alpha, beta, true, aiPlayer, maxCandidates).score;
      board[move.r][move.c] = EMPTY;
      
      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha cut-off
      }
    }
    return { score: minEval, move: bestMove };
  }
}

/**
 * Entry point to compute the best move for the AI.
 */
function getBestMove(board, aiPlayer, difficulty = 'normal') {
  let depth = 3;
  let maxCandidates = 12; // Limit branching factor
  
  if (difficulty === 'easy') {
    depth = 1;
    maxCandidates = 15;
  } else if (difficulty === 'normal') {
    depth = 3;
    maxCandidates = 10;
  } else if (difficulty === 'hard') {
    depth = 4;
    maxCandidates = 8;
  }
  
  const result = minimax(board, depth, -Infinity, Infinity, true, aiPlayer, maxCandidates);
  return result.move;
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBestMove, evaluateBoard, getCandidateMoves
  };
} else {
  window.GomokuAI = {
    getBestMove, evaluateBoard, getCandidateMoves
  };
}
