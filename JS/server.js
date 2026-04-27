const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// MYSQL CONNECTION
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
// SERVE FRONTEND
// =============================
app.use(express.static(path.join(__dirname, "..")));

// =============================
// ROOM WORD BANK (NEW - FIX)
// =============================
const words = [
  ["Football", "Basketball", "Cricket", "Tennis", "Swimming"],
  ["Pizza", "Curry", "Steak", "Fish", "Cake"],
  ["Minecraft", "Fortnite", "Clash Royale", "GTA V"],
  ["Titanic", "Frozen", "Inception", "Avatar"],
  ["Taylor Swift", "The Rock", "Ronaldo", "Beyonce"],
  ["Pop", "Rock", "Jazz", "Rap"]
];

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
      if (err) return res.status(500).json(err);
      res.json({ userId: result.insertId });
    }
  );
});

// =============================
// CREATE ROOM + ROOMGAME
// =============================
app.post("/create-room", (req, res) => {
  const code = generateCode();
  const themeIndex = Math.floor(Math.random() * 6);

  db.query(
    "INSERT INTO Rooms (name, game_code) VALUES (?, ?)",
    ["Lobby", code],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const roomId = result.insertId;

      db.query(
        "INSERT INTO RoomGame (room_id, theme_index, started) VALUES (?, ?, 0)",
        [roomId, themeIndex],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            roomId,
            gameCode: code,
            themeIndex
          });
        }
      );
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
      if (!results.length) return res.json(null);
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
      if (err) return res.status(500).json(err);
      res.json({ message: "Joined room" });
    }
  );
});

// =============================
// GET PLAYERS
// =============================
app.get("/room-players/:roomId", (req, res) => {
  db.query(
    `SELECT Users.username
     FROM RoomPlayers
     JOIN Users ON Users.id = RoomPlayers.user_id
     WHERE RoomPlayers.room_id = ?`,
    [req.params.roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// =============================
// GET MY ROLE
// =============================
app.get("/my-role/:roomId/:userId", (req, res) => {
  const { roomId, userId } = req.params;

  db.query(
    `SELECT role, secret_word
     FROM RoomPlayers
     WHERE room_id = ? AND user_id = ?`,
    [roomId, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) return res.json(null);
      res.json(results[0]);
    }
  );
});

// =============================
// START GAME (FIXED SECRET WORD LOGIC)
// =============================
app.post("/start-game/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  db.query(
    "SELECT user_id FROM RoomPlayers WHERE room_id = ?",
    [roomId],
    (err, players) => {
      if (err) return res.status(500).json(err);
      if (!players.length) return res.status(400).json({ error: "No players" });

      const impostorIndex = Math.floor(Math.random() * players.length);

      // STEP 1: get theme
      db.query(
        "SELECT theme_index FROM RoomGame WHERE room_id = ?",
        [roomId],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);

          const themeIndex = result[0].theme_index;

          // STEP 2: PICK ONE WORD FOR ENTIRE ROOM (IMPORTANT CHANGE)
          const sharedWord =
            words[themeIndex][
              Math.floor(Math.random() * words[themeIndex].length)
            ];

          let done = 0;

          // STEP 3: assign roles
          players.forEach((p, i) => {
            const isImpostor = i === impostorIndex;

            const role = isImpostor ? "impostor" : "civilian";

            // 🔥 KEY CHANGE: no per-player random words
            const word = isImpostor ? null : sharedWord;

            db.query(
              `UPDATE RoomPlayers 
               SET role = ?, secret_word = ? 
               WHERE room_id = ? AND user_id = ?`,
              [role, word, roomId, p.user_id],
              (err3) => {
                if (err3) console.error(err3);

                done++;

                if (done === players.length) {
                  db.query(
                    "UPDATE RoomGame SET started = 1 WHERE room_id = ?",
                    [roomId],
                    (err4) => {
                      if (err4) return res.status(500).json(err4);

                      res.json({ success: true });
                    }
                  );
                }
              }
            );
          });
        }
      );
    }
  );
});

// =============================
// ROOM INFO
// =============================
app.get("/room-info/:roomId", (req, res) => {
  db.query(
    "SELECT * FROM Rooms WHERE id = ?",
    [req.params.roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0]);
    }
  );
});

// =============================
// GAME STATE
// =============================
app.get("/room-game/:roomId", (req, res) => {
  db.query(
    "SELECT * FROM RoomGame WHERE room_id = ?",
    [req.params.roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0]);
    }
  );
});

// =============================
// GAME DATA (FINAL JOIN)
// =============================
app.get("/game-data/:roomId/:userId", (req, res) => {

  const sql = `
    SELECT 
      rg.theme_index,
      rp.role,
      rp.secret_word
    FROM RoomGame rg
    JOIN RoomPlayers rp ON rp.room_id = rg.room_id
    WHERE rg.room_id = ? AND rp.user_id = ?
  `;

  db.query(sql, [req.params.roomId, req.params.userId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (!results.length) return res.json(null);
    res.json(results[0]);
  });
});

app.post("/submit-hint", (req, res) => {
  const { roomId, userId, hint } = req.body;

  db.query(
    "UPDATE RoomPlayers SET hint = ? WHERE room_id = ? AND user_id = ?",
    [hint, roomId, userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

app.get("/hints/:roomId", (req, res) => {

  const roomId = req.params.roomId;

  db.query(
    `SELECT Users.username, RoomPlayers.hint, RoomPlayers.user_id
     FROM RoomPlayers
     JOIN Users ON Users.id = RoomPlayers.user_id
     WHERE RoomPlayers.room_id = ?`,
    [roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// =============================
// VOTING
// =============================
app.post("/submit-vote", (req, res) => {
  const { roomId, userId, voteFor } = req.body;

  db.query(
    "UPDATE RoomPlayers SET vote_for = ? WHERE room_id = ? AND user_id = ?",
    [voteFor, roomId, userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

app.get("/votes/:roomId", (req, res) => {
  db.query(
    `SELECT user_id, vote_for FROM RoomPlayers WHERE room_id = ?`,
    [req.params.roomId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// =============================
// RESULTS
// =============================
app.get("/results/:roomId", (req, res) => {
  db.query(
    `SELECT rp.user_id, rp.role, rp.vote_for, u.username
     FROM RoomPlayers rp
     JOIN Users u ON u.id = rp.user_id
     WHERE rp.room_id = ?`,
    [req.params.roomId],
    (err, players) => {
      if (err) return res.status(500).json(err);

      const voteCount = {};

      // Count votes
      players.forEach(p => {
        if (!p.vote_for) return;
        voteCount[p.vote_for] = (voteCount[p.vote_for] || 0) + 1;
      });

      let maxVotes = 0;
      let votedOut = null;

      // Find most voted player
      for (let id in voteCount) {
        if (voteCount[id] > maxVotes) {
          maxVotes = voteCount[id];
          votedOut = parseInt(id);
        }
      }

      // Find impostor
      const impostor = players.find(p => p.role === "impostor");

      // Find eliminated player (to check win condition)
      const eliminated = players.find(p => p.user_id === votedOut);

      const civiliansWin = eliminated && eliminated.role === "impostor";

      // 🔥 MAP IDs → NAMES
      const playerMap = {};
      players.forEach(p => {
        playerMap[p.user_id] = p.username;
      });

      res.json({
        votedOut,
        votedOutName: playerMap[votedOut] || "Unknown",
        impostor: impostor ? impostor.user_id : null,
        impostorName: impostor ? playerMap[impostor.user_id] : "Unknown",
        civiliansWin
      });
    }
  );
});

// app.post("/restart-game/:roomId", (req, res) => {

//   const roomId = req.params.roomId;

//   // 1. signal restart
//   db.query(
//     `UPDATE RoomGame 
//      SET started = 0, restart_flag = 1 
//      WHERE room_id = ?`,
//     [roomId],
//     (err) => {

//       if (err) return res.status(500).json(err);

//       // 2. reset player state
//       db.query(
//         `UPDATE RoomPlayers 
//          SET role = NULL, 
//              secret_word = NULL, 
//              hint = NULL, 
//              vote_for = NULL
//          WHERE room_id = ?`,
//         [roomId],
//         (err2) => {

//           if (err2) return res.status(500).json(err2);

//           res.json({
//             success: true,
//             message: "Restart flagged"
//           });
//         }
//       );
//     }
//   );
// });

// app.post("/force-start/:roomId", (req, res) => {

//   const roomId = req.params.roomId;

//   db.query(
//     "SELECT user_id FROM RoomPlayers WHERE room_id = ?",
//     [roomId],
//     (err, players) => {

//       if (err) return res.status(500).json(err);
//       if (!players.length) return res.status(400).json({ error: "No players" });

//       const impostorIndex = Math.floor(Math.random() * players.length);

//       // 1. NEW RANDOM THEME EVERY GAME
//       const newThemeIndex = Math.floor(Math.random() * words.length);

//       // 2. PICK NEW WORD
//       const sharedWord =
//         words[newThemeIndex][
//           Math.floor(Math.random() * words[newThemeIndex].length)
//         ];

//       // 3. SAVE NEW THEME FIRST
//       db.query(
//         `UPDATE RoomGame SET theme_index = ? WHERE room_id = ?`,
//         [newThemeIndex, roomId],
//         (err2) => {

//           if (err2) return res.status(500).json(err2);

//           let done = 0;

//           players.forEach((p, i) => {

//             const isImpostor = i === impostorIndex;
//             const role = isImpostor ? "impostor" : "civilian";
//             const word = isImpostor ? null : sharedWord;

//             db.query(
//               `UPDATE RoomPlayers 
//                SET role = ?, secret_word = ?, hint = NULL, vote_for = NULL
//                WHERE room_id = ? AND user_id = ?`,
//               [role, word, roomId, p.user_id],
//               (err3) => {

//                 if (err3) console.error(err3);

//                 done++;

//                 if (done === players.length) {

//                   // 4. START GAME + CLEAR FLAG
//                   db.query(
//                     `UPDATE RoomGame 
//                      SET started = 1, restart_flag = 0 
//                      WHERE room_id = ?`,
//                     [roomId],
//                     (err4) => {

//                       if (err4) return res.status(500).json(err4);

//                       res.json({
//                         success: true,
//                         message: "Game started with new theme"
//                       });
//                     }
//                   );
//                 }
//               }
//             );
//           });
//         }
//       );
//     }
//   );
// });

// =============================
// START SERVER
// =============================
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});