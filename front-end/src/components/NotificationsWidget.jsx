import { useState, useEffect, useRef } from "react";
import { makeRequest } from "../../axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // backend URL

const NotificationsWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Utility to deduplicate notifications by id
  const deduplicate = (notifArray) => {
    const map = new Map();
    notifArray.forEach((n) => {
      // Use both id and createdAt to ensure uniqueness
      map.set(`${n.id}-${n.createdAt}`, n);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    fetchNotifications();
    setupRealtime();

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await makeRequest.get("/registrar/notifications");
      const notifData = res.data.notifications || [];
      const uniqueNotif = deduplicate(notifData);
      setNotifications(uniqueNotif);
      setUnreadCount(uniqueNotif.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const setupRealtime = () => {
    socket.on("new-notification", (newNotif) => {
      setNotifications((prev) => {
        const updated = deduplicate([newNotif, ...prev]);
        setUnreadCount(updated.filter((n) => !n.isRead).length);
        return updated;
      });
    });

    socket.on("update-notification", (updatedNotif) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotif.id ? { ...n, ...updatedNotif } : n
        )
      );
    });

    socket.on("delete-notification", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  };

  const markAsRead = async (id) => {
    try {
      await makeRequest.put(`/registrar/notifications/${id}/read`, { isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark notification as read:", err.response?.data || err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Icon */}
      <button
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11a6 6 0 10-12 0v3c0 .386-.149.735-.395 1.001L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={`notif-${n.id}-${n.createdAt}`}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 cursor-pointer border-b transition 
                    ${!n.isRead ? "bg-blue-200 border-blue-400" : "bg-white hover:bg-gray-100"}`}
                >
                  <p className="font-semibold text-black text-sm">{n.title}</p>
                  <p className="text-xs text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsWidget;