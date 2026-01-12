import express from "express";
import { loginOperator } from "../controllers/operatorController.js";

const router = express.Router();

router.post("/login", loginOperator);

export default router;
