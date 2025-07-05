const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require("redis");
require("dotenv").config();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const redisPub = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
const redisSub = redisPub.duplicate();

const port = process.env.GATEWAY_PORT || 3000;

// Connexions actives : socket.id → zone
const socketZoneMap = new Map();

// Nouveau cache des joueurs par zone
const zonePlayersCache = {}; // { zoneName: { socketId: {pseudo, x, y, zone} } }

io.on("connection", (socket) => {
  console.log(`Client connecté : ${socket.id}`);

  socket.on("player:joined", (data) => {
    socket.data.pseudo = data.pseudo;
    socket.data.zone = data.zone;
    socketZoneMap.set(socket.id, data.zone);

    redisPub.publish(
      "player:joined",
      JSON.stringify({
        socketId: socket.id,
        ...data,
      })
    );
  });

  socket.on("player:moved", (data) => {
    redisPub.publish(
      "player:moved",
      JSON.stringify({
        socketId: socket.id,
        ...data,
      })
    );
  });

  socket.on("disconnect", () => {
    const zone = socketZoneMap.get(socket.id);
    redisPub.publish(
      "player:left",
      JSON.stringify({
        socketId: socket.id,
        zone,
        pseudo: socket.data.pseudo,
      })
    );
    socketZoneMap.delete(socket.id);
    console.log(`Client déconnecté : ${socket.id}`);
  });
});

// Redis : écoute les updates de position depuis les ZoneServices
redisSub.subscribe("zone:update:positions", (message) => {
  const data = JSON.parse(message); // contient { socketId: { pseudo, x, y, zone } }

  const anyPlayer = Object.values(data)[0];
  if (!anyPlayer) return;

  const zone = anyPlayer.zone;
  zonePlayersCache[zone] = data;

  // Diffuse les données mises à jour uniquement aux clients concernés
  for (const [socketId, playerZone] of socketZoneMap.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.connected) {
      const playersInZone = zonePlayersCache[playerZone] || {};
      socket.emit("zone:update:positions", JSON.stringify(playersInZone));
    }
  }
});

async function start() {
  await redisPub.connect();
  await redisSub.connect();
  httpServer.listen(port, () => {
    console.log(`Gateway en écoute sur le port ${port}`);
  });
}

start().catch(console.error);
