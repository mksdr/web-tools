// gomoku/rules.js

const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
const BOARD_SIZE = 15;

/**
 * Translates array indices (r, c) to Gomoku coordinate notation (e.g., H8).
 * Rows are 1-15 (bottom to top, index 0 is 15, index 14 is 1).
 * Columns are A-O (index 0 is A, index 14 is O).
 */
function coordToNotation(r, c) {
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return '';
  const colLetter = String.fromCharCode(65 + c); // A = 65
  const rowNum = BOARD_SIZE - r;
  return `${colLetter}${rowNum}`;
}

/**
 * Translates Gomoku coordinate notation (e.g., H8) to array indices (r, c).
 */
function notationToCoord(notation) {
  if (!notation || notation.length < 2) return null;
  const colLetter = notation[0].toUpperCase();
  const rowNum = parseInt(notation.substring(1), 10);
  
  const c = colLetter.charCodeAt(0) - 65;
  const r = BOARD_SIZE - rowNum;
  
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
  return { r, c };
}

/**
 * Gets the contiguous segment of stones of the same player containing (r, c) along the (dr, dc) direction.
 */
function getContiguousSegment(r, c, dr, dc, board, player) {
  let k1 = 0;
  while (true) {
    const nr = r + (k1 + 1) * dr;
    const nc = c + (k1 + 1) * dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
    k1++;
  }
  
  let k2 = 0;
  while (true) {
    const nr = r - (k2 + 1) * dr;
    const nc = c - (k2 + 1) * dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
    k2++;
  }
  
  return {
    length: k1 + k2 + 1,
    startRow: r - k2 * dr,
    startCol: c - k2 * dc,
    endRow: r + k1 * dr,
    endCol: c + k1 * dc
  };
}

/**
 * Checks if Black creates an overline (6 or more stones in a row).
 */
function checkOverline(r, c, board, player) {
  if (player !== BLACK) return false;
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Anti-diagonal /
  ];
  for (const [dr, dc] of directions) {
    const seg = getContiguousSegment(r, c, dr, dc, board, BLACK);
    if (seg.length >= 6) return true;
  }
  return false;
}

/**
 * Checks if the move forms exactly 5 (for Black) or 5 or more (for White) in a row.
 */
function checkFive(r, c, board, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];
  for (const [dr, dc] of directions) {
    const seg = getContiguousSegment(r, c, dr, dc, board, player);
    if (player === BLACK) {
      if (seg.length === 5) return true;
    } else {
      if (seg.length >= 5) return true;
    }
  }
  return false;
}

/**
 * Checks if a move in a specific direction creates an open four (exactly 4 stones, both ends empty and winning).
 */
function isOpenFourInDirection(r, c, dr, dc, board) {
  const seg = getContiguousSegment(r, c, dr, dc, board, BLACK);
  if (seg.length !== 4) return false;
  
  const ar = seg.startRow - dr;
  const ac = seg.startCol - dc;
  const br = seg.endRow + dr;
  const bc = seg.endCol + dc;
  
  if (ar < 0 || ar >= BOARD_SIZE || ac < 0 || ac >= BOARD_SIZE || board[ar][ac] !== EMPTY) return false;
  if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE || board[br][bc] !== EMPTY) return false;
  
  // Both ends must be able to form a 5 (i.e. not be blocked or overline)
  board[ar][ac] = BLACK;
  const segA = getContiguousSegment(ar, ac, dr, dc, board, BLACK);
  board[ar][ac] = EMPTY;
  if (segA.length !== 5) return false;
  
  board[br][bc] = BLACK;
  const segB = getContiguousSegment(br, bc, dr, dc, board, BLACK);
  board[br][bc] = EMPTY;
  if (segB.length !== 5) return false;
  
  return true;
}

/**
 * Counts the number of directions in which a "four" is formed.
 */
function countFours(r, c, board, player = BLACK) {
  let count = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];
  
  for (const [dr, dc] of directions) {
    let hasFour = false;
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const er = r + i * dr;
      const ec = c + i * dc;
      if (er < 0 || er >= BOARD_SIZE || ec < 0 || ec >= BOARD_SIZE) continue;
      if (board[er][ec] !== EMPTY) continue;
      
      board[er][ec] = BLACK;
      try {
        const seg = getContiguousSegment(r, c, dr, dc, board, BLACK);
        if (seg.length === 5) {
          hasFour = true;
        }
      } finally {
        board[er][ec] = EMPTY;
      }
      if (hasFour) break;
    }
    if (hasFour) {
      count++;
    }
  }
  return count;
}

/**
 * Counts the number of directions in which an open three is formed.
 */
function countOpenThrees(r, c, board, player = BLACK, depth = 0) {
  let count = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];
  
  for (const [dr, dc] of directions) {
    let hasOpenThree = false;
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const er = r + i * dr;
      const ec = c + i * dc;
      if (er < 0 || er >= BOARD_SIZE || ec < 0 || ec >= BOARD_SIZE) continue;
      if (board[er][ec] !== EMPTY) continue;
      
      // If E itself is forbidden, this cannot be used as an open three threat
      if (depth < 1) {
        if (isForbidden(er, ec, board, BLACK, depth + 1)) {
          continue;
        }
      }
      
      board[er][ec] = BLACK;
      try {
        if (isOpenFourInDirection(r, c, dr, dc, board)) {
          hasOpenThree = true;
        }
      } finally {
        board[er][ec] = EMPTY;
      }
      
      if (hasOpenThree) break;
    }
    if (hasOpenThree) {
      count++;
    }
  }
  return count;
}

/**
 * Checks if a move by player is forbidden. Only applies to Black (player = BLACK).
 */
function isForbidden(r, c, board, player = BLACK, depth = 0) {
  if (player !== BLACK) return false;
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
  if (board[r][c] !== EMPTY) return false;
  
  // Temporarily place Black stone
  board[r][c] = BLACK;
  let forbidden = false;
  
  try {
    // 1. Overline is forbidden
    if (checkOverline(r, c, board, BLACK)) {
      forbidden = true;
    }
    // 2. Win (exactly 5) overrides 3-3 and 4-4
    else if (checkFive(r, c, board, BLACK)) {
      forbidden = false;
    }
    // 3. Double four (사사) is forbidden
    else if (countFours(r, c, board) >= 2) {
      forbidden = true;
    }
    // 4. Double three (삼삼) is forbidden
    else if (countOpenThrees(r, c, board, BLACK, depth) >= 2) {
      forbidden = true;
    }
  } finally {
    // Revert board state
    board[r][c] = EMPTY;
  }
  
  return forbidden;
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLACK, WHITE, EMPTY, BOARD_SIZE,
    coordToNotation, notationToCoord,
    checkOverline, checkFive, countFours, countOpenThrees, isForbidden
  };
} else {
  window.GomokuRules = {
    BLACK, WHITE, EMPTY, BOARD_SIZE,
    coordToNotation, notationToCoord,
    checkOverline, checkFive, countFours, countOpenThrees, isForbidden
  };
}
