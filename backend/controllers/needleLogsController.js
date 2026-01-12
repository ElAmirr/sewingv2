import db from "../config/db.js";

/**
 * Helper: convert ISO date → MySQL DATETIME
 */
const toMySQLDateTime = (date) => {
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
};

/**
 * POST - operator logs needle change
 */
export const createNeedleLog = async (req, res) => {
  const {
    machine_id,
    operator_id,
    color,
    status, // OK | DELAY
    cycle_start_time,
    cycle_end_time
  } = req.body;

  if (!machine_id || !color || !status || !cycle_start_time || !cycle_end_time) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const cycleStart = toMySQLDateTime(cycle_start_time);
    const cycleEnd = toMySQLDateTime(cycle_end_time);

    const [result] = await db.execute(
      `INSERT INTO needle_change_logs (
        machine_id,
        operator_id,
        color,
        status,
        operator_press_time,
        cycle_start_time,
        cycle_end_time
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [
        machine_id,
        operator_id || null,
        color,
        status,
        cycleStart,
        cycleEnd
      ]
    );

    res.json({
      message: "Needle change logged",
      log_id: result.insertId
    });
  } catch (err) {
    console.error("❌ createNeedleLog error:", err);
    res.status(500).json({ message: "Failed to log needle change" });
  }
};

/**
 * POST - supervisor confirms / rejects needle change
 * Endpoint: POST /logs/confirm
 */
export const confirmNeedleChange = async (req, res) => {
  console.log("📥 Supervisor confirmation payload:", req.body);

  const { log_id, machine_id, supervisor_badge, validation } = req.body;

  if (!supervisor_badge || !validation) {
    return res.status(400).json({ message: "Missing supervisor data" });
  }

  try {
    /* 1️⃣ Find supervisor */
    const [supRows] = await db.execute(
      "SELECT supervisor_id FROM supervisors WHERE badge = ?",
      [supervisor_badge]
    );

    if (!supRows.length) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const supervisor_id = supRows[0].supervisor_id;

    /* 2️⃣ Update ONLY supervisor fields */
    const [updateResult] = await db.execute(
      `
      UPDATE needle_change_logs
      SET
        supervisor_id = ?,
        supervisor_scan_time = NOW(),
        supervisor_confirmation = ?,   -- CONFIRMED | NOT_CONFIRMED
        updated_at = NOW()
      WHERE log_id = ?
      LIMIT 1
      `,
      [
        supervisor_id,
        validation,
        log_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "No needle log found to update" });
    }

    console.log("✅ Supervisor confirmation saved");

    res.json({ message: "Supervisor validation saved" });
  } catch (err) {
    console.error("❌ confirmNeedleChange error:", err);
    res.status(500).json({ message: "Failed to confirm needle change" });
  }
};

/**
 * GET - latest needle log per machine
 */
export const getLatestLogByMachine = async (req, res) => {
  const { machineId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM needle_change_logs
      WHERE machine_id = ?
      ORDER BY operator_press_time DESC
      LIMIT 1
      `,
      [machineId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("❌ getLatestLogByMachine error:", err);
    res.status(500).json({ message: "Failed to fetch log" });
  }
};
