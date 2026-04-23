const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MySQL connection
const db = mysql.createConnection({
  host: "mudfoot.doc.stu.mmu.ac.uk",
  port: 6306,
  user: "oddoneout",
  password: "NacNeef9",
  database: "oddoneout"
});

// Serve files from the parent folder (one level up)
app.use(express.static(path.join(__dirname, "..")));

// Test route (optional)
app.get("/test", (req, res) => {
  res.send("Server is working");
});


// ✅ Create user
app.post("/create-user", (req, res) => {
  const { username } = req.body;

  db.query(
    "INSERT INTO Users (username) VALUES (?)",
    [username],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ userId: result.insertId });
    }
  );
});

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

app.post("/create-room", (req, res) => {
  const { name } = req.body;

  db.query(
    "INSERT INTO Rooms (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ roomId: result.insertId });
    }
  );
});

app.post("/join-room", (req, res) => {
  const { roomId, userId } = req.body;

  db.query(
    "INSERT INTO RoomPlayers (room_id, user_id) VALUES (?, ?)",
    [roomId, userId],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("User joined room");
    }
  );
});

app.get("/room-players/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  db.query(
    `SELECT Users.username 
     FROM RoomPlayers
     JOIN Users ON RoomPlayers.user_id = Users.id
     WHERE RoomPlayers.room_id = ?`,
    [roomId],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
});

function generateGameCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

app.post("/create-room", (req, res) => {
  const gameCode = generateGameCode();

  db.query(
    "INSERT INTO Rooms (name, game_code) VALUES (?, ?)",
    ["Lobby", gameCode],
    (err, result) => {
      if (err) return res.status(500).send(err);

      res.json({
        roomId: result.insertId,
        gameCode: gameCode
      });
    }
  );
});