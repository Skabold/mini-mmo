const { createClient } = require('redis');
require('dotenv').config();

const ZONE_NAME = 'C'; 

const redis = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
const sub = redis.duplicate();

const players = {}; // { socketId: { pseudo, x, y, zone } }

async function start() {
  await redis.connect();
  await sub.connect();

  console.log(`ZoneService ${ZONE_NAME} connecté à Redis`);

  await sub.subscribe('player:joined', handlePlayerJoined);
  await sub.subscribe('player:moved', handlePlayerMoved);
  await sub.subscribe('player:left', handlePlayerLeft);

  // Envoie régulier de l’état local à Gateway
  setInterval(() => {
    redis.publish('zone:update:positions', JSON.stringify(players));
  }, 5000);
}

function handlePlayerJoined(message) {
  const data = JSON.parse(message);
  if (data.zone !== ZONE_NAME) return;

  players[data.socketId] = {
    pseudo: data.pseudo,
    x: data.position.x,
    y: data.position.y,
    zone: data.zone
  };

  console.log(`${data.pseudo} a rejoint la zone ${ZONE_NAME}`);
}

function handlePlayerMoved(message) {
  const data = JSON.parse(message);
  if (data.zone !== ZONE_NAME) return;

  if (players[data.socketId]) {
    players[data.socketId].x = data.position.x;
    players[data.socketId].y = data.position.y;

    console.log(`${data.pseudo} déplacé en (${data.position.x}, ${data.position.y})`);
  }
}

function handlePlayerLeft(message) {
  const data = JSON.parse(message);
  if (data.zone !== ZONE_NAME) return;

  delete players[data.socketId];
  console.log(`${data.pseudo} a quitté la zone ${ZONE_NAME}`);
}

start().catch(console.error);
