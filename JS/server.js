const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// MySQL CONNECTION
// =============================
const db = mysql.createConnection({
  host: "mudfoot.doc.stu.mmu.ac.uk",
  port: 6306,
  user: "oddoneout",
  password: "NacNeef9",
  database: "oddoneout"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("Connected to MySQL!");
  }
});

// =============================
// SERVE FRONTEND (THIS FIXES "Cannot GET /")
// =============================
app.use(express.static(path.join(__dirname, "..")));

// =============================
// GENERATE ROOM CODE
// =============================
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// =============================
// CREATE USER
// =============================
app.post("/create-user", (req, res) => {
  const { username } = req.body;

  db.query(
    "INSERT INTO Users (username) VALUES (?)",
    [username],
    (err, result) => {
      if (err) {
        console.error("CREATE USER ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({ userId: result.insertId });
    }
  );
});

// =============================
// CREATE ROOM
// =============================
app.post("/create-room", (req, res) => {
  const code = generateCode();

  db.query(
    "INSERT INTO Rooms (name, game_code) VALUES (?, ?)",
    ["Lobby", code],
    (err, result) => {
      if (err) {
        console.error("CREATE ROOM ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({
        roomId: result.insertId,
        gameCode: code
      });
    }
  );
});

// =============================
// GET ROOM BY CODE
// =============================
app.get("/room-by-code/:code", (req, res) => {
  const code = req.params.code.trim();

  db.query(
    "SELECT id, name, game_code FROM Rooms WHERE game_code = ? LIMIT 1",
    [code],
    (err, results) => {
      if (err) return res.status(500).json(err);

      if (results.length === 0) return res.json(null);

      res.json(results[0]);
    }
  );
});

// =============================
// JOIN ROOM
// =============================
app.post("/join-room", (req, res) => {
  const { roomId, userId } = req.body;

  db.query(
    "INSERT INTO RoomPlayers (room_id, user_id) VALUES (?, ?)",
    [roomId, userId],
    (err) => {
      if (err) {
        console.error("JOIN ROOM ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({ message: "Joined room" });
    }
  );
});

// =============================
// GET PLAYERS (SAFE VERSION)
// =============================
app.get("/room-players/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  db.query(
    `SELECT Users.username
     FROM RoomPlayers
     JOIN Users ON Users.id = RoomPlayers.user_id
     WHERE RoomPlayers.room_id = ?`,
    [roomId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(results);
    }
  );
});

// -----------------------------
// GET MY ROLE (PRIVATE)
// -----------------------------
app.get("/my-role/:roomId/:userId", (req, res) => {
  const { roomId, userId } = req.params;

  db.query(
    `SELECT role, secret_word
     FROM RoomPlayers
     WHERE room_id = ? AND user_id = ?`,
    [roomId, userId],
    (err, results) => {
      if (err) {
        console.error("MY ROLE ERROR:", err);
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        return res.json(null);
      }

      res.json(results[0]);
    }
  );
});

app.post("/start-game/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  // 1. get all players first
  db.query(
    "SELECT user_id FROM RoomPlayers WHERE room_id = ?",
    [roomId],
    (err, players) => {

      if (err) return res.status(500).json(err);
      if (!players.length) {
        return res.status(400).json({ error: "No players in room" });
      }

      const impostorIndex = Math.floor(Math.random() * players.length);

      let done = 0;

      // 2. assign roles
      players.forEach((p, i) => {

        const isImpostor = i === impostorIndex;

        const role = isImpostor ? "impostor" : "civilian";
        const word = isImpostor ? null : "WORD";

        db.query(
          `UPDATE RoomPlayers 
           SET role = ?, secret_word = ? 
           WHERE room_id = ? AND user_id = ?`,
          [role, word, roomId, p.user_id],
          (err) => {

            if (err) console.error("ROLE UPDATE ERROR:", err);

            done++;

            // 3. when all players updated -> start game
            if (done === players.length) {

              db.query(
                "UPDATE Rooms SET game_started = 1 WHERE id = ?",
                [roomId],
                (err2) => {

                  if (err2) return res.status(500).json(err2);

                  // DEBUG (optional but useful)
                  db.query(
                    "SELECT user_id, role, secret_word FROM RoomPlayers WHERE room_id = ?",
                    [roomId],
                    (err3, rows) => {

                      console.log("FINAL STATE:", rows);

                      res.json({
                        success: true,
                        players: rows
                      });
                    }
                  );
                }
              );
            }
          }
        );
      });
    }
  );
});

app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  db.query(
    "SELECT * FROM Rooms WHERE id = ?",
    [roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0]);
    }
  );
});

// =============================
// START SERVER
// =============================
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});