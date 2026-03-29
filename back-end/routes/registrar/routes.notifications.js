// routes.notifications.js
import { Router } from "express";
import notificationsControllerFactory from "../../controller/registrar/controller.notifications.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

/**
 * Notifications router
 * @param {import('socket.io').Server} io - Socket.IO instance
 */
export default function notificationsRouter(io) {
  const router = Router();

  // Inject io into controller
  const {
    getNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    updateNotifications
  } = notificationsControllerFactory(io);

  router.use(authenticateToken);

  router.get("/", getNotifications);
  router.post("/", authorizeRoles("admin", "registrar"), createNotification);
  router.put("/:id/read", updateNotification);
  router.delete("/:id", authorizeRoles("admin", "registrar"), deleteNotification);
router.patch("/:id", authorizeRoles("admin", "registrar"), updateNotifications);
  return router;
}