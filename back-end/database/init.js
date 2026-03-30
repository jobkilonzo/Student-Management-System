import db from "./mysql_database.js";
import bcrypt from "bcryptjs";

const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','registrar','student','accountant','tutor','exam_officer') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

const COURSES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

const UNITS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS units (
    unit_id INT AUTO_INCREMENT PRIMARY KEY,
    unit_code VARCHAR(50) NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
`;

const STUDENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reg_no VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male','Female') NOT NULL,
    dob DATE,
    id_number VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    course_id INT NOT NULL,
    module VARCHAR(100),
    term VARCHAR(50),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    photo VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
`;

const MARKS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    unit_id INT NOT NULL,
    cat_marks DECIMAL(5,2),
    end_term_marks DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    grade VARCHAR(5),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_unit (student_id, unit_id)
  ) ENGINE=InnoDB;
`;

const NOTIFICATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    role ENUM('admin','registrar','student','accountant','tutor','exam_officer','all') NOT NULL DEFAULT 'admin',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

const UNIT_ASSIGNMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS unit_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    unit_id INT NOT NULL,
    course_id INT NOT NULL,
    module VARCHAR(100) DEFAULT 'Module 1',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_tutor_unit (tutor_id, unit_id)
  ) ENGINE=InnoDB;
`;

const UNIT_MARK_CONTROLS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS unit_mark_controls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    unit_id INT NOT NULL,
    can_enter_marks TINYINT(1) NOT NULL DEFAULT 0,
    can_edit_delete TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    UNIQUE KEY unique_tutor_unit_control (tutor_id, unit_id)
  ) ENGINE=InnoDB;
`;

const COURSE_FEES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS course_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'KSh',
    set_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const FEE_PAYMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(120),
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const STUDENT_PROGRESSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS student_progressions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    course_code VARCHAR(50),
    course_name VARCHAR(255),
    module VARCHAR(100),
    term VARCHAR(50),
    fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    changed_by INT NULL,
    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const DEFAULT_ADMIN_EMAIL = "admin@school.com";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_ADMIN_NAME = "Administrator";

export const initDatabase = async () => {
  try {
    // Create tables
    await db.execute(USERS_TABLE_SQL);
    await db.execute(COURSES_TABLE_SQL);
    await db.execute(UNITS_TABLE_SQL);
    await db.execute(STUDENTS_TABLE_SQL);
    await db.execute(MARKS_TABLE_SQL);
    await db.execute(NOTIFICATIONS_TABLE_SQL);
    await db.execute(UNIT_ASSIGNMENTS_TABLE_SQL);
    await db.execute(UNIT_MARK_CONTROLS_TABLE_SQL);
    await db.execute(COURSE_FEES_TABLE_SQL);
    await db.execute(FEE_PAYMENTS_TABLE_SQL);
    await db.execute(STUDENT_PROGRESSIONS_TABLE_SQL);

    console.log("All tables created or already exist");

    // Check if admin exists
    const [adminRows] = await db.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminRows.length === 0) {
      const hashedPassword = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
      await db.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashedPassword]
      );
      console.log(
        `Created default admin user (${DEFAULT_ADMIN_EMAIL}) with password: ${DEFAULT_ADMIN_PASSWORD}`
      );
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};
