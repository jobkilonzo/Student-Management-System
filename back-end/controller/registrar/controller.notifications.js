import db from "../../database/mysql_database.js";
import moment from "moment";

export default (io) => {
  // GET /api/v1/registrar/notifications
  // GET /api/v1/registrar/notifications
const getNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role || "";

    // Parse and validate limit/offset
    let limit = parseInt(req.query.limit, 10);
    let offset = parseInt(req.query.offset, 10);
    if (isNaN(limit) || limit <= 0) limit = 10;
    if (isNaN(offset) || offset < 0) offset = 0;

    const limitInt = Math.floor(limit);
    const offsetInt = Math.floor(offset);

    let query = "";
    let params = [];

    if (userRole === "admin") {
      // Admin sees all notifications
      query = `
        SELECT id, title, message, role, is_read AS isRead, created_at AS createdAt
        FROM notifications
        ORDER BY created_at DESC
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `;
      params = []; // no bound params
    } else {
      // Non-admin sees only notifications for their role or 'all'
      query = `
        SELECT id, title, message, role, is_read AS isRead, created_at AS createdAt
        FROM notifications
        WHERE role = ? OR role = 'all'
        ORDER BY created_at DESC
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `;
      params = [userRole];
    }

    const [rows] = await db.execute(query, params);

    res.json({ notifications: rows });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

  // POST /api/v1/registrar/notifications
  const createNotification = async (req, res) => {
    try {
      const { title, message, role } = req.body;
      if (!title || !message || !role)
        return res.status(400).json({ error: "title, message, and role are required" });

      const [result] = await db.execute(
        "INSERT INTO notifications (title, message, role, is_read, created_at) VALUES (?, ?, ?, 0, ?)",
        [title, message, role, moment().format("YYYY-MM-DD HH:mm:ss")]
      );

      const newNotif = {
        id: result.insertId,
        title,
        message,
        role,
        isRead: false,
        createdAt: moment().format(),
      };

      io.emit("new-notification", newNotif);
      res.status(201).json(newNotif);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  };

  // PUT /api/v1/registrar/notifications/:id/read
  // Mark notification as read/unread
  const updateNotification = async (req, res) => {
    try {
      const { id } = req.params;
      const { isRead } = req.body;

      if (isRead === undefined)
        return res.status(400).json({ error: "isRead field is required" });

      const [existing] = await db.execute("SELECT * FROM notifications WHERE id = ?", [id]);
      if (existing.length === 0) return res.status(404).json({ error: "Notification not found" });

      await db.execute("UPDATE notifications SET is_read = ? WHERE id = ?", [
        isRead ? 1 : 0,
        id,
      ]);

      const updatedNotif = {
        ...existing[0],
        isRead: isRead,
      };

      io.emit("update-notification", updatedNotif);
      res.json({ message: "Notification read status updated", notification: updatedNotif });
    } catch (error) {
      console.error("Update read status error:", error);
      res.status(500).json({ error: "Failed to update read status" });
    }
  };

  // PATCH /api/v1/registrar/notifications/:id
  // Edit title, message, role
  const updateNotifications = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, role } = req.body;

      const [existing] = await db.execute("SELECT * FROM notifications WHERE id = ?", [id]);
      if (existing.length === 0) return res.status(404).json({ error: "Notification not found" });

      const updateFields = [];
      const params = [];

      if (title !== undefined) { updateFields.push("title = ?"); params.push(title); }
      if (message !== undefined) { updateFields.push("message = ?"); params.push(message); }
      if (role !== undefined) { updateFields.push("role = ?"); params.push(role); }

      if (!updateFields.length) return res.status(400).json({ error: "No fields to update" });

      params.push(id);
      await db.execute(`UPDATE notifications SET ${updateFields.join(", ")} WHERE id = ?`, params);

      const updatedNotif = {
        id: existing[0].id,
        title: title ?? existing[0].title,
        message: message ?? existing[0].message,
        role: role ?? existing[0].role,
        isRead: existing[0].is_read,
        createdAt: existing[0].created_at,
      };

      io.emit("update-notification", updatedNotif);
      res.json({ message: "Notification updated", notification: updatedNotif });
    } catch (error) {
      console.error("Edit notification error:", error);
      res.status(500).json({ error: "Failed to edit notification" });
    }
  };

  // DELETE /api/v1/registrar/notifications/:id
  const deleteNotification = async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.execute("DELETE FROM notifications WHERE id = ?", [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Notification not found" });

      io.emit("delete-notification", { id });
      res.json({ message: "Notification deleted", id });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  };

  return { getNotifications, createNotification, updateNotification, updateNotifications, deleteNotification };
};