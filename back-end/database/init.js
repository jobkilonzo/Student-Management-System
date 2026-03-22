import db from "./mysql_database.js";
import bcrypt from "bcryptjs";

const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','registrar','student','accountant','tutor') NOT NULL DEFAULT 'student',
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
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
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