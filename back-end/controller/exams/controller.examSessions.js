import db from "../../database/mysql_database.js";

// List all exam sessions
export const listExamSessions = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, session_name, DATE_FORMAT(start_time, '%H:%i') AS start_time, DATE_FORMAT(end_time, '%H:%i') AS end_time, display_order, is_active FROM exam_sessions ORDER BY display_order ASC, id ASC");
    return res.json({ success: true, sessions: rows });
  } catch (err) {
    console.error('List exam sessions error:', err);
    return res.status(500).json({ error: 'Failed to load exam sessions' });
  }
};

// Get single session
export const getExamSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const [rows] = await db.execute('SELECT * FROM exam_sessions WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    return res.json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('Get exam session error:', err);
    return res.status(500).json({ error: 'Failed to load session' });
  }
};

// Create session
export const createExamSession = async (req, res) => {
  try {
    const { session_name, start_time, end_time, display_order, is_active } = req.body;
    if (!session_name || !start_time || !end_time) {
      return res.status(400).json({ error: 'session_name, start_time and end_time are required' });
    }
    const [result] = await db.execute(
      'INSERT INTO exam_sessions (session_name, start_time, end_time, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [session_name, start_time, end_time, display_order || 0, is_active ? 1 : 0]
    );
    const [rows] = await db.execute('SELECT * FROM exam_sessions WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('Create exam session error:', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

// Update session
export const updateExamSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const { session_name, start_time, end_time, display_order, is_active } = req.body;
    await db.execute(
      'UPDATE exam_sessions SET session_name = COALESCE(?, session_name), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), display_order = COALESCE(?, display_order), is_active = COALESCE(?, is_active) WHERE id = ?',
      [session_name, start_time, end_time, display_order, typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null, id]
    );
    const [rows] = await db.execute('SELECT * FROM exam_sessions WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('Update exam session error:', err);
    return res.status(500).json({ error: 'Failed to update session' });
  }
};

// Delete session
export const deleteExamSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    await db.execute('DELETE FROM exam_sessions WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete exam session error:', err);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};
