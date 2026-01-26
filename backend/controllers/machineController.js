import db from "../config/db.js";

/**
 * GET all machines
 * Used by frontend to list machines
 */
export const getMachines = async (req, res) => {
  try {
    console.log("GET /machines - fetching available machines");

    // Get only machines NOT in active session (ended_at IS NULL)
    const [machines] = await db.execute("SELECT * FROM machines LIMIT 10");

    console.log("Machines found:", machines);
    res.json(machines || []);
  } catch (err) {
    console.error("getMachines error:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};
