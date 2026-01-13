import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import operatorRoutes from "./routes/operatorRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import needleLogsRoutes from "./routes/needleLogsRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/operators", operatorRoutes);
app.use("/machines", machineRoutes);
app.use("/logs", needleLogsRoutes);

// ===== FRONTEND DIST SERVING =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// path to frontend/dist
const frontendDistPath = path.join(__dirname, "../frontend/dist");

// Serve static files
app.use(express.static(frontendDistPath));

// React router support
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// =================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Backend + Frontend running:");
  console.log(`→ Local: http://localhost:${PORT}`);
  console.log(`→ LAN:   http://<SERVER-IP>:${PORT}`);
});
