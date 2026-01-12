import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import operatorRoutes from "./routes/operatorRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import needleLogsRoutes from "./routes/needleLogsRoutes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/operators", operatorRoutes);
app.use("/machines", machineRoutes);
app.use("/logs", needleLogsRoutes);



app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
