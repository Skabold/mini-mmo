# mini-mmo

Mini projet scolaire illustrant les principes d'une **architecture distribuée** à travers un jeu **MMO textuel minimal**.

---

## 🎯 Objectif

Créer une preuve de concept (POC) d’un mini-MMO où chaque zone est gérée par un service indépendant.  
Les services communiquent via **Redis Pub/Sub**, les clients se connectent par **terminal**, et chaque joueur peut :

- Choisir un pseudo
- Rejoindre une zone (A, B ou C)
- Se déplacer dans cette zone
- Voir les autres joueurs présents

---

## 📁 Structure du projet

```bash
/client/
  client.js
/services/
  gateway/
    gateway.js
  zone-service/
    zone-A.js
    zone-B.js
    zone-C.js
.env
```

---

## ⚙️ Prérequis

- [Node.js](https://nodejs.org/) v20
- Redis en local

---

## 🔥 Installer Redis sur Windows (sans Docker)

1. Télécharger Redis ici : https://github.com/tporadowski/redis/releases  
   _(ex: `redis-5.0.14.1.zip`)_

2. Extraire dans un dossier, ex : `C:\Program Files\Redis`

3. Lancer le serveur depuis PowerShell dans ce dossier :

```powershell
.\redis-server.exe
```

4. Si Redis ne démarre pas (port déjà pris) :

```powershell
netstat -aon | findstr :6379
taskkill /PID <pid> /F
```

---

## 🔧 Installation du projet

Depuis la racine :

```bash
npm install
```

Créer un fichier `.env` :

```env
REDIS_HOST=localhost
REDIS_PORT=6379
GATEWAY_PORT=3000
```

---

## 🚀 Lancement (ordre conseillé)

1. **Redis**  
   (dans un terminal dédié)

   ```powershell
   .\redis-server.exe
   ```

2. **Zones A, B, C**  
   (dans 3 terminaux différents)

   ```bash
   node services/zone-service/zone-A.js
   node services/zone-service/zone-B.js
   node services/zone-service/zone-C.js
   ```

3. **Gateway**

   ```bash
   node services/gateway/gateway.js
   ```

4. **Clients**
   ```bash
   node client/client.js
   ```

---

## ⌨️ Commandes du joueur

- `z` = haut
- `s` = bas
- `q` = gauche
- `d` = droite
- `exit` = quitter

---

## 🧠 Remarques

- Projet **proof of concept**, pas de persistance ni de transitions interzones encore.
- Pour ajouter une zone D ou E, dupliquez un fichier `zone-A.js` et changez `ZONE_NAME`.
