import db from "../../database/mysql_database.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `
        SELECT
          id,
          email,
          role,
          created_at,
          first_name,
          middle_name,
          last_name,
          TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) AS name
        FROM users
        WHERE id = ? AND role = 'accountant'
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Accountant not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Get Accountant Profile Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
