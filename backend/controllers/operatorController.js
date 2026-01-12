import db from "../config/db.js";

export const loginOperator = async (req, res) => {
  const { badge_code } = req.body;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM operators WHERE badge = ?",
      [badge_code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Operator not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
