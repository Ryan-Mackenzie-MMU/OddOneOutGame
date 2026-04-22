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