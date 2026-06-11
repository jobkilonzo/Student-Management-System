import db from "./mysql_database.js";
import bcrypt from "bcryptjs";

async function ensureColumn(table, column, definition) {
  try {
    const safeTable = table.replace(/`/g, "``");
    const safeColumn = column.replace(/`/g, "``");
    const [rows] = await db.execute(
      `SHOW COLUMNS FROM \`${safeTable}\` LIKE '${safeColumn}'`
    );

    if (rows.length === 0) {
      await db.execute(
        `ALTER TABLE \`${safeTable}\` ADD COLUMN \`${safeColumn}\` ${definition}`
      );
      console.log(`Added missing column ${table}.${column}`);
    }
  } catch (err) {
    console.warn(`Could not ensure ${table}.${column}:`, err.message);
  }
}

// Updated table schemas based on actual database dump
const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','registrar','student','accountant','tutor','exam_officer','secretary') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(50) NULL,
    middle_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    gender ENUM('male','female','other') NOT NULL,
    last_login DATETIME NULL,
    last_active DATETIME NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    passport VARCHAR(500) NULL
  ) ENGINE=InnoDB;
`;

const COURSES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    course_type ENUM('non_modular','stage_based','modular','level_based','grade_based') NOT NULL,
    createdAt TIMESTAMP(6) NULL,
    updatedAt TIMESTAMP(6) NULL,
    department ENUM('Technical','Business') NOT NULL,
    course_category ENUM('Technical','Business') DEFAULT 'Technical'
  ) ENGINE=InnoDB;
`;

const UNITS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS units (
    unit_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    unit_code VARCHAR(10) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    module INT NULL,
    stage INT NULL,
    createdAt TIMESTAMP(6) NULL,
    course_code VARCHAR(10) NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
`;

const STUDENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reg_no VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(20) NOT NULL,
    middle_name VARCHAR(20) NULL,
    last_name VARCHAR(20) NOT NULL,
    gender ENUM('Male','Female') NOT NULL,
    dob DATE NULL,
    id_number VARCHAR(50) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    course_id INT NOT NULL,
    module INT NULL,
    term INT NULL,
    address TEXT NULL,
    guardian_name VARCHAR(100) NULL,
    guardian_phone VARCHAR(20) NULL,
    photo VARCHAR(255) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const MARKS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    unit_id INT NOT NULL,
    term TINYINT NOT NULL,
    cat_mark DECIMAL(5,2) DEFAULT 0.00,
    exam_mark DECIMAL(5,2) DEFAULT 0.00,
    grade VARCHAR(20) DEFAULT '-',
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    module INT NULL,
    attendance INT NULL,
    stage INT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_unit_term (student_id, unit_id, term),
    CONSTRAINT marks_chk_1 CHECK (term BETWEEN 1 AND 3)
  ) ENGINE=InnoDB;
`;

const NOTIFICATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    role ENUM('admin','registrar','student','accountant','tutor','exam_officer') NOT NULL DEFAULT 'admin',
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
    module VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (tutor_id, unit_id, course_id)
  ) ENGINE=InnoDB;
`;

const UNIT_MARK_CONTROLS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS unit_mark_controls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    tutor_id INT NOT NULL,
    can_enter_marks TINYINT(1) DEFAULT 0,
    can_edit_delete TINYINT(1) DEFAULT 0,
    UNIQUE KEY unit_id (unit_id, tutor_id)
  ) ENGINE=InnoDB;
`;

const COURSE_FEES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS course_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    term INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'KSh',
    set_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fee_type_id INT NOT NULL,
    module INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id),
    UNIQUE KEY unique_course_term_fee_module (course_id, term, fee_type_id, module)
  ) ENGINE=InnoDB;
`;

const FEE_PAYMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(120) NULL,
    notes TEXT NULL,
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
    course_code VARCHAR(50) NULL,
    course_name VARCHAR(255) NULL,
    module VARCHAR(100) NULL,
    term VARCHAR(50) NULL,
    fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    changed_by INT NULL,
    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const EXAM_SCHEDULES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    course_id INT NOT NULL,
    module VARCHAR(50) NULL,
    exam_date DATE NULL,
    max_marks DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    pass_marks DECIMAL(6,2) NOT NULL DEFAULT 40.00,
    marks_allowed_from DATETIME NULL,
    marks_allowed_to DATETIME NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_exam_schedules_unit (unit_id),
    KEY idx_exam_schedules_course (course_id),
    KEY idx_exam_schedules_marks_allowed_from (marks_allowed_from)
  ) ENGINE=InnoDB;
`;

const EXAM_TIMETABLES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS exam_timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department ENUM('Technical', 'Business') NOT NULL,
    exam_type ENUM('Normal', 'Supplementary', 'Retake') NOT NULL DEFAULT 'Normal',
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_exam_timetables_category (department),
    KEY idx_exam_timetables_exam_type (exam_type),
    KEY idx_exam_timetables_date_start (date_start)
  ) ENGINE=InnoDB;
`;

const EXAM_TIMETABLE_ENTRIES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS exam_timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT NOT NULL,
    unit_id INT NOT NULL,
    course_id INT NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timetable_id) REFERENCES exam_timetables(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    KEY idx_exam_timetable_entries_timetable (timetable_id),
    KEY idx_exam_timetable_entries_unit (unit_id),
    KEY idx_exam_timetable_entries_course (course_id),
    KEY idx_exam_timetable_entries_date (exam_date)
  ) ENGINE=InnoDB;
`;

// New tables from the dump
const ATTENDANCE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    unit_id INT NOT NULL,
    tutor_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present','Absent') DEFAULT 'Absent',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES users(id)
  ) ENGINE=InnoDB;
`;

const AUDIT_LOGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NULL,
    target_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

const FEE_TYPES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS fee_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

const EXAM_SESSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(100) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

const STUDENT_BALANCES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS student_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    total_fees DECIMAL(12,2) DEFAULT 0.00,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    balance DECIMAL(12,2) DEFAULT 0.00,
    last_payment_date DATETIME NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY student_id (student_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
  ) ENGINE=InnoDB;
`;

const STUDENT_FEE_BALANCES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS student_fee_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    course_id INT NULL,
    term INT NULL,
    fee_type_id INT NULL,
    total_fee DECIMAL(12,2) DEFAULT 0.00,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    balance DECIMAL(12,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    module INT NULL,
    UNIQUE KEY student_id (student_id, course_id, term, fee_type_id),
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id)
  ) ENGINE=InnoDB;
`;

const MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL
  ) ENGINE=InnoDB;
`;

const PERMISSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NULL
  ) ENGINE=InnoDB;
`;

const ROLE_PERMISSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(50) NULL,
    permission_id INT NULL
  ) ENGINE=InnoDB;
`;

const TIMETABLES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NULL,
    department_code VARCHAR(50) NULL,
    course_id INT NULL,
    class_id INT NULL,
    intake_id INT NULL,
    room_id INT NULL,
    invigilator_id INT NULL,
    generated_by INT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    term VARCHAR(50) NULL,
    date DATE NULL,
    unit_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL,
    KEY idx_timetables_session (session_id),
    KEY idx_timetables_course (course_id),
    KEY idx_timetables_dept (department_code),
    KEY idx_timetables_room (room_id),
    KEY idx_timetables_invigilator (invigilator_id)
  ) ENGINE=InnoDB;
`;

const DEFAULT_ADMIN_EMAIL = "admin@school.com";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_ADMIN_FIRST_NAME = "System";
const DEFAULT_ADMIN_LAST_NAME = "Administrator";

export const initDatabase = async () => {
  try {
    // Create tables in order (respecting foreign key dependencies)
    await db.execute(USERS_TABLE_SQL);
    await db.execute(FEE_TYPES_TABLE_SQL);
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
    await db.execute(EXAM_SCHEDULES_TABLE_SQL);
    await db.execute(EXAM_TIMETABLES_TABLE_SQL);
    await db.execute(EXAM_TIMETABLE_ENTRIES_TABLE_SQL);
    await db.execute(ATTENDANCE_TABLE_SQL);
    await db.execute(AUDIT_LOGS_TABLE_SQL);
    await db.execute(EXAM_SESSIONS_TABLE_SQL);
    await db.execute(STUDENT_BALANCES_TABLE_SQL);
    await db.execute(STUDENT_FEE_BALANCES_TABLE_SQL);
    await db.execute(MIGRATIONS_TABLE_SQL);
    await db.execute(PERMISSIONS_TABLE_SQL);
    await db.execute(ROLE_PERMISSIONS_TABLE_SQL);
    await db.execute(TIMETABLES_TABLE_SQL);

    // student_units and student_notifications (already in your original)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS student_units (
        student_id INT NOT NULL,
        unit_id INT NOT NULL,
        module INT NULL,
        term INT NULL,
        status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'In Progress',
        assigned_by INT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (student_id, unit_id),
        KEY idx_student_units_student (student_id),
        KEY idx_student_units_unit (unit_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS student_notifications (
        id INT NOT NULL AUTO_INCREMENT,
        student_id INT NOT NULL,
        type ENUM('enrollment_confirmation','fee_reminder','general_announcement') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_student_notifications_student (student_id),
        KEY idx_student_notifications_type (type),
        KEY idx_student_notifications_created_at (created_at),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    console.log("All tables created or already exist");

    // Lightweight migrations for columns that might be missing
    await ensureColumn("units", "module", "INT NULL");
    await ensureColumn("units", "stage", "INT NULL");
    await ensureColumn("marks", "total", "DECIMAL(5,2) NOT NULL DEFAULT 0.00");
    await ensureColumn("marks", "module", "INT NULL");
    await ensureColumn("marks", "attendance", "INT NULL");
    await ensureColumn("marks", "stage", "INT NULL");

    // Check if admin exists (using updated schema with name fields split)
    const [adminRows] = await db.execute(
      "SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1"
    );

    if (adminRows.length === 0) {
      const hashedPassword = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
      await db.execute(
        `INSERT INTO users 
         (email, password, role, first_name, last_name, gender, must_change_password) 
         VALUES (?, ?, 'admin', ?, ?, 'other', 0)`,
        [DEFAULT_ADMIN_EMAIL, hashedPassword, DEFAULT_ADMIN_FIRST_NAME, DEFAULT_ADMIN_LAST_NAME]
      );
      console.log(
        `Created default admin user (${DEFAULT_ADMIN_EMAIL}) with password: ${DEFAULT_ADMIN_PASSWORD}`
      );
    }

    // Insert default fee types if none exist
    const [feeTypes] = await db.execute("SELECT id FROM fee_types LIMIT 1");
    if (feeTypes.length === 0) {
      const defaultFeeTypes = [
        "Tuition Fee",
        "Registration Fee",
        "Examination Fee",
        "Library Fee",
        "Activity Fee",
        "Caution Money"
      ];
      for (const feeType of defaultFeeTypes) {
        await db.execute(
          "INSERT INTO fee_types (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name",
          [feeType]
        );
      }
      console.log("Default fee types inserted");
    }

    // Insert default exam sessions if none exist
    const [examSessions] = await db.execute("SELECT id FROM exam_sessions LIMIT 1");
    if (examSessions.length === 0) {
      const defaultSessions = [
        { name: "Morning Session", start: "09:00:00", end: "12:00:00", order: 1 },
        { name: "Afternoon Session", start: "14:00:00", end: "17:00:00", order: 2 }
      ];
      for (const session of defaultSessions) {
        await db.execute(
          "INSERT INTO exam_sessions (session_name, start_time, end_time, display_order) VALUES (?, ?, ?, ?)",
          [session.name, session.start, session.end, session.order]
        );
      }
      console.log("Default exam sessions inserted");
    }

  } catch (err) {
    console.error("Database initialization error:", err);
    throw err; // Re-throw to let the application handle it
  }
};