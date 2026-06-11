-- Migration: create timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NULL,
  department_code VARCHAR(50) DEFAULT NULL,
  course_id INT DEFAULT NULL,
  class_id INT DEFAULT NULL,
  intake_id INT DEFAULT NULL,
  room_id INT DEFAULT NULL,
  invigilator_id INT DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  term VARCHAR(50) DEFAULT NULL,
  date DATE DEFAULT NULL,
  unit_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timetables_session (session_id),
  INDEX idx_timetables_course (course_id),
  INDEX idx_timetables_dept (department_code),
  INDEX idx_timetables_room (room_id),
  INDEX idx_timetables_invigilator (invigilator_id),
  CONSTRAINT fk_timetables_exam_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL
);
