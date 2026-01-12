import express from "express";
const router = express.Router();

// GET all logs
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query(`
      SELECT ncl.*, m.machine_name, s.supervisor_name
      FROM needle_change_logs ncl
      LEFT JOIN machines m ON ncl.machine_id = m.machine_id
      LEFT JOIN supervisors s ON ncl.supervisor_id = s.supervisor_id
      ORDER BY ncl.log_id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
