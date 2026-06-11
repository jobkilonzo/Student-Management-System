-- Seeder: default exam sessions
INSERT INTO exam_sessions (session_name, start_time, end_time, display_order, is_active)
VALUES
  ('08:00 - 10:00', '08:00:00', '10:00:00', 1, 1),
  ('10:30 - 12:30', '10:30:00', '12:30:00', 2, 1),
  ('13:30 - 15:30', '13:30:00', '15:30:00', 3, 1),
  ('17:00 - 19:00', '17:00:00', '19:00:00', 4, 1)
ON DUPLICATE KEY UPDATE
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);
