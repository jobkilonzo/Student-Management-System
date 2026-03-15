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

const DEFAULT_ADMIN_EMAIL = "admin@school.com";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_ADMIN_NAME = "Administrator";

export const initDatabase = () => {
  db.query(USERS_TABLE_SQL, (err) => {
    if (err) {
      console.error("Failed to create users table", err);
      return;
    }

    db.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
      (err2, results) => {
        if (err2) {
          console.error("Failed to query admin users", err2);
          return;
        }
        if (results && results.length === 0) {
          const hashedPassword = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
          db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
            [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashedPassword],
            (insertErr) => {
              if (insertErr) {
                console.error("Failed to create default admin user", insertErr);
              } else {
                console.log(
                  `Created default admin user (${DEFAULT_ADMIN_EMAIL}) with password: ${DEFAULT_ADMIN_PASSWORD}`
                );
              }
            }
          );
        }
      }
    );
  });
};
