import db from "../config/db.js";

/**
 * GET all machines
 * Used by frontend to list machines
 */
export const getMachines = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT machine_id, code FROM machines"
    );

    res.json(rows);
  } catch (err) {
    console.error("getMachines error:", err);
    res.status(500).json({ message: "Failed to fetch machines" });
  }
};
