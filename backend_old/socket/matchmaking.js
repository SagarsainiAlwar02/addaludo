const waitingPlayers = [];

function addPlayer(player) {
  waitingPlayers.push(player);
}

function getMatch() {
  if (waitingPlayers.length < 2) return null;

  const p1 = waitingPlayers.shift();
  const p2 = waitingPlayers.shift();

  return [p1, p2];
}

module.exports = { addPlayer, getMatch };