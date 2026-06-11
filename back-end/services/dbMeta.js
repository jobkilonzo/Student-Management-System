import db from "../database/mysql_database.js";

export const tableExists = async (tableName) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS c
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = ?
      `,
      [tableName]
    );
    return Number(rows?.[0]?.c || 0) > 0;
  } catch {
    return false;
  }
};

