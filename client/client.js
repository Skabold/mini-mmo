const readline = require("readline");
const io = require("socket.io-client");
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const GATEWAY_URL = `http://localhost:${process.env.GATEWAY_PORT || 3000}`;

const socket = io(GATEWAY_URL);

let pseudo = "";
let zone = "";
let position = { x: 0, y: 0 };

function askPseudo() {
  rl.question("Entrez votre pseudo : ", (answer) => {
    pseudo = answer;
    askZone();
  });
}

function askZone() {
  rl.question("Choisissez une zone (A, B ou C) : ", (answer) => {
    zone = answer.toUpperCase();
    joinGame();
    startListeningToCommands();
  });
}

function joinGame() {
  position = {
    x: Math.floor(Math.random() * 10),
    y: Math.floor(Math.random() * 10),
  };

  socket.emit("player:joined", {
    pseudo,
    zone,
    position,
  });

  console.log(
    `Connecté à la zone ${zone} en position (${position.x}, ${position.y})`
  );
}

function startListeningToCommands() {
  rl.setPrompt('Déplacez-vous avec z/q/s/d ou tapez "exit" > ');
  rl.prompt();

  rl.on("line", (input) => {
    input = input.trim().toLowerCase();
    if (input === "exit") {
      rl.close();
      socket.disconnect();
      return;
    }

    switch (input) {
      case "z":
        position.y -= 1;
        break;
      case "s":
        position.y += 1;
        break;
      case "q":
        position.x -= 1;
        break;
      case "d":
        position.x += 1;
        break;
      default:
        console.log("Commande inconnue.");
        rl.prompt();
        return;
    }

    socket.emit("player:moved", { pseudo, zone, position });
    console.log(`Nouvelle position : (${position.x}, ${position.y})`);
    rl.prompt();
  });
}

socket.on("zone:update:positions", (players) => {
  console.clear();
  console.log(`\n Déplacez-vous avec z/q/s/d ou tapez "exit" > \n Joueurs dans la zone ${zone} :`);
  try {
    const list = JSON.parse(players);
    for (const id in list) {
      const p = list[id];
      console.log(`- ${p.pseudo} (${p.x}, ${p.y})`);
    }
  } catch (err) {
    console.log("Erreur de parsing des joueurs :", err);
  }
});

askPseudo();
