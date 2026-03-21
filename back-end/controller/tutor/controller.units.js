import db from "../../database/mysql_database.js";

export const getAssignedUnits = (req, res) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) return res.status(401).json({ message: "Unauthorized: No tutor ID" });

    const query = `
      SELECT 
        u.unit_name,
        c.course_name,
        ua.module AS term,
        ua.assigned_at
      FROM unit_assignments ua
      JOIN units u ON ua.unit_id = u.unit_id
      JOIN courses c ON ua.course_id = c.course_id
      WHERE ua.tutor_id = ?
    `;

    db.query(query, [tutorId], (err, rows) => {
      if (err) {
        console.error("🔥 ERROR FETCHING UNITS:", err);
        return res.status(500).json({ message: err.message });
      }

      // Map rows to keys frontend expects
      const mappedUnits = rows.map(u => ({
        name: u.unit_name,
        course: u.course_name,
        year: u.course_level,
        term: u.term,
        assignedAt: u.assigned_at
      }));

      console.log(`✅ Fetched ${mappedUnits.length} units for tutor ID ${tutorId}`);  
      res.json({ units: mappedUnits });
    });

  } catch (err) {
    console.error("🔥 UNEXPECTED ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};