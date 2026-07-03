import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import path from "path";
import { fileURLToPath } from "url";
import { createMasterRouter } from "./routes/index";
import passport from "./config/passport";
import { ENV } from "./config/envConfig";
import  db  from "./config/dbconfig"
import cors from "cors"

const app = express();

// ── 1. Body parsers ────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({limit: "50mb"}));
app.use(cookieParser());

// bcz we are using react, origin to allow to connect to react app and credentials are true for the cookie and session access
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));


// Mock or import your live infrastructure services here
const wsPush = (userId: string, event: object) => {
  console.log(`Sending live WS event to user ${userId}`);
};
const enqueueEmail = async (data: object) => { 
  console.log("Email task queued", data);
};
const enqueueSlack = async (data: object) => {
  console.log("Slack dispatch queued", data);
};


// ── 2. Session (required for flash + passport) ─────────────
app.use(session({
  secret: ENV.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// ── 3. Flash (must be after session, before routes) ────────
app.use(flash());
app.use((req, res, next) => {
  res.locals.error    = req.flash("error");
  res.locals.formData = req.flash("formData");
  next();                  // ← you were missing next() here too
});

app.use("/uploads", express.static("uploads"));

// ── 4. Passport (must be after session) ───────────────────
app.use(passport.initialize());

// ── 5. Static files + views ────────────────────────────────
app.set("view engine","ejs")
app.set("views",path.join(__dirname,"../views"))
app.use(express.static(path.join(__dirname,"../public")))

// ── 6. Routes (always last) ────────────────────────────────
app.use("/", createMasterRouter(db,{wsPush,enqueueEmail,enqueueSlack}));

app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${ENV.PORT}`);
}); 