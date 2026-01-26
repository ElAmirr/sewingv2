import db from "../config/db.js";

export const loginOperator = async (req, res) => {
  console.log("POST /operators/login body:", req.body);

  const badge_code =
    req.body?.badge_code ?? req.body?.badge ?? req.body?.badgeCode ?? req.body?.badgeId;
  const rawMachineId =
    req.body?.machine_id ?? req.body?.machineId ?? req.body?.machine ?? req.body?.machineId;

  const machine_id = rawMachineId ? Number(rawMachineId) : NaN;

  if (!badge_code || !Number.isFinite(machine_id)) {
    return res
      .status(400)
      .json({ message: "Badge and valid machine_id are required", received: req.body });
  }

  const hour = new Date().getHours();
  const shift =
    hour >= 6 && hour < 14 ? "Shift1" :
    hour >= 14 && hour < 22 ? "Shift2" :
    "Shift3";

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [opRows] = await conn.execute(
      "SELECT operator_id, name FROM operators WHERE badge = ? LIMIT 1",
      [badge_code]
    );
    const operator = opRows[0];
    if (!operator) {
      await conn.rollback();
      return res.status(401).json({ message: "Invalid badge" });
    }

    const [sessRows] = await conn.execute(
      `SELECT session_id FROM machine_sessions
       WHERE machine_id = ? AND ended_at IS NULL LIMIT 1`,
      [machine_id]
    );

    if (sessRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Machine already in use" });
    }

    // 🔥 DELETE old ended sessions for this machine
    await conn.execute(
      "DELETE FROM machine_sessions WHERE machine_id = ? AND ended_at IS NOT NULL",
      [machine_id]
    );

    const [result] = await conn.execute(
      `INSERT INTO machine_sessions 
       (machine_id, operator_id, shift, started_at, last_heartbeat)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [machine_id, operator.operator_id, shift]
    );

    // 🔥 FETCH the new session_id
    const [newRows] = await conn.execute(
      "SELECT session_id FROM machine_sessions WHERE machine_id = ? LIMIT 1",
      [machine_id]
    );
    const session_id = newRows[0]?.session_id ?? null;

    await conn.commit();

    return res.json({
      operator,
      machine_id,
      shift,
      session_id,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("loginOperator error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) conn.release();
  }
};

export const logoutOperator = async (req, res) => {
  const { session_id, machine_id, operator_id } = req.body;

  if (!session_id && !machine_id && !operator_id) {
    return res.status(400).json({ message: "session_id or machine_id required" });
  }

  let conn;
  try {
    conn = await db.getConnection();

    if (session_id) {
      await conn.execute(
        "UPDATE machine_sessions SET ended_at = NOW() WHERE session_id = ? AND ended_at IS NULL",
        [session_id]
      );
    } else if (machine_id && operator_id) {
      await conn.execute(
        "UPDATE machine_sessions SET ended_at = NOW() WHERE machine_id = ? AND operator_id = ? AND ended_at IS NULL",
        [machine_id, operator_id]
      );
    } else if (machine_id) {
      await conn.execute(
        "UPDATE machine_sessions SET ended_at = NOW() WHERE machine_id = ? AND ended_at IS NULL",
        [machine_id]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("logoutOperator error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) conn.release();
  }
};
