import db from "../../database/mysql_database.js";

export const getFeeTypes = async (_req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name FROM fee_types ORDER BY name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Get Fee Types Error:", err);
    res.status(500).json({ error: "Failed to fetch fee types" });
  }
};