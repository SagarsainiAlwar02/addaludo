const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const BOARD_SIZE = 56;

// 🎲 Dice Roll
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// 🎯 Check if token can move
export function canMove(tokenPos, dice) {
  if (tokenPos === -1 && dice === 6) return true;
  if (tokenPos >= 0) return true;
  return false;
}

// 🚶 Move Token
export function moveToken(tokenPos, dice) {
  // 🏁 token start from home
  if (tokenPos === -1 && dice === 6) {
    return 0;
  }

  if (tokenPos >= 0) {
    const newPos = tokenPos + dice;

    // ❌ invalid move (out of board)
    if (newPos > BOARD_SIZE) return tokenPos;

    return newPos;
  }

  return tokenPos;
}

// 💣 Kill Logic (returns updated opponent tokens)
export function checkKill(newPos, opponentTokens) {
  return opponentTokens.map((pos) => {
    if (pos === newPos && !SAFE_CELLS.has(newPos)) {
      return -1; // send back to home
    }
    return pos;
  });
}

// 🏆 Win Check (all tokens reached end)
export function checkWin(playerTokens) {
  return playerTokens.every((pos) => pos === BOARD_SIZE);
}

// 🔒 Safe cell check
export function isSafeCell(pos) {
  return SAFE_CELLS.has(pos);
}

// 🎯 BONUS: validate move (important for anti-cheat)
export function isValidMove(tokenPos, dice) {
  if (tokenPos === -1 && dice === 6) return true;
  if (tokenPos >= 0 && tokenPos + dice <= BOARD_SIZE) return true;
  return false;
}