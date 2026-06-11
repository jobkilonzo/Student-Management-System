import db from "../../database/mysql_database.js";
import { tableExists } from "../../services/dbMeta.js";
import { normalizeTermInput } from "../../services/term.js";
import PDFDocument from "pdfkit";

const sumNumbers = (rows, key) =>
  (rows || []).reduce((acc, r) => acc + Number(r?.[key] || 0), 0);

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const detectAcademicHold = async (studentId) => {
  // Best-effort: support a few common table names without altering schema.
  const candidates = ["academic_holds", "student_holds"];
  for (const table of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (!(await tableExists(table))) continue;
    try {
      // Common patterns: active/is_active/status columns vary; attempt a few.
      // If the query fails due to missing columns, just ignore.
      // eslint-disable-next-line no-await-in-loop
      const [rows] = await db.execute(
        `SELECT * FROM ${table} WHERE student_id = ? LIMIT 5`,
        [studentId]
      );
      if (!rows?.length) continue;

      // treat any record as a hold unless it clearly looks inactive
      const active = rows.some((r) => {
        if ("is_active" in r) return Number(r.is_active) === 1;
        if ("active" in r) return Number(r.active) === 1;
        if ("status" in r) return String(r.status).toLowerCase() !== "inactive";
        return true;
      });
      if (active) return { hasHold: true, table };
    } catch {
      // ignore
    }
  }
  return { hasHold: false, table: null };
};

export const buildExamCardForStudentId = async ({ studentId, termOverride }) => {
  const [studentRows] = await db.execute(
    `
    SELECT
      s.id,
      s.user_id,
      s.reg_no,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.gender,
      s.course_id,
      s.module,
      s.term,
      c.course_code,
      c.course_name
    FROM students s
    LEFT JOIN courses c ON c.course_id = s.course_id
    WHERE s.id = ?
    LIMIT 1
    `,
    [studentId]
  );

  if (!studentRows.length) {
    const err = new Error("Student not found");
    err.status = 404;
    throw err;
  }

  const student = studentRows[0];
  const normalized = normalizeTermInput({ term: termOverride ?? student.term });
  const currentTerm = normalized.term;

  // Registered units (CURRENT TERM ONLY)
  const unitWhere = ["su.student_id = ?"];
  const unitParams = [studentId];
  if (currentTerm !== undefined && currentTerm !== null && String(currentTerm) !== "") {
    unitWhere.push("su.term = ?");
    unitParams.push(currentTerm);
  }

  const [unitRows] = await db.execute(
    `
    SELECT
      su.unit_id,
      su.module,
      su.term,
      su.status,
      u.unit_code,
      u.unit_name,
      u.course_id,
      c.course_code,
      c.course_name
    FROM student_units su
    LEFT JOIN units u ON u.unit_id = su.unit_id
    LEFT JOIN courses c ON c.course_id = u.course_id
    WHERE ${unitWhere.join(" AND ")}
    ORDER BY u.unit_code
    `,
    unitParams
  );

  if (!unitRows.length) {
    const err = new Error("No registered units for current TERM");
    err.status = 400;
    err.code = "NO_REGISTERED_UNITS";
    throw err;
  }

  // Incomplete registration (best-effort): block if any unit status looks pending
  const hasIncomplete = unitRows.some((r) => String(r.status || "").toLowerCase() === "pending");
  if (hasIncomplete) {
    const err = new Error("Registration is incomplete for current TERM");
    err.status = 400;
    err.code = "INCOMPLETE_REGISTRATION";
    throw err;
  }

  // Exam schedule summary (from timetable entries, if present)
  const unitIds = unitRows.map((u) => Number(u.unit_id)).filter(Boolean);
  const placeholders = unitIds.map(() => "?").join(",");
  const [scheduleRows] = await db.execute(
    `
    SELECT
      ete.unit_id,
      ete.exam_date,
      ete.exam_time,
      u.unit_code,
      u.unit_name
    FROM exam_timetable_entries ete
    LEFT JOIN units u ON u.unit_id = ete.unit_id
    WHERE ete.unit_id IN (${placeholders})
    ORDER BY ete.exam_date, ete.exam_time, u.unit_code
    `,
    unitIds
  );

  // Finance (reuse existing balances if present)
  let outstandingBalance = 0;
  let currentTermBalance = null;

  if (await tableExists("student_balances")) {
    const [bal] = await db.execute(
      "SELECT COALESCE(balance, 0) AS balance FROM student_balances WHERE student_id = ? LIMIT 1",
      [studentId]
    );
    outstandingBalance = safeNumber(bal?.[0]?.balance, 0);
  }

  if (await tableExists("student_fee_balances")) {
    const [termRows] = await db.execute(
      `
      SELECT COALESCE(balance, 0) AS balance
      FROM student_fee_balances
      WHERE student_id = ?
        AND course_id = ?
        AND term = ?
        AND COALESCE(module, 0) = COALESCE(?, 0)
      `,
      [studentId, student.course_id, currentTerm, student.module || null]
    );
    currentTermBalance = sumNumbers(termRows, "balance");
  }

  const hold = await detectAcademicHold(studentId);
  const effectiveBalance = currentTermBalance != null ? currentTermBalance : outstandingBalance;
  const cleared = !hold.hasHold && Number(effectiveBalance) <= 0;

  return {
    student: {
      id: student.id,
      reg_no: student.reg_no,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      gender: student.gender,
    },
    course: {
      course_id: student.course_id,
      course_code: student.course_code,
      course_name: student.course_name,
      module: student.module ?? null,
      term: currentTerm ?? null,
    },
    registered_units: unitRows.map((r) => ({
      unit_id: r.unit_id,
      unit_code: r.unit_code,
      unit_name: r.unit_name,
      term: r.term ?? null,
      module: r.module ?? null,
    })),
    exam_schedule_summary: scheduleRows.map((r) => ({
      unit_id: r.unit_id,
      unit_code: r.unit_code,
      unit_name: r.unit_name,
      exam_date: r.exam_date,
      exam_time: r.exam_time,
    })),
    finance: {
      currency: "KSh",
      outstanding_balance: Number(effectiveBalance || 0),
      clearance_status: cleared ? "Cleared" : "Not Cleared",
      academic_hold: hold.hasHold ? { active: true, source: hold.table } : { active: false },
    },
  };
};

// GET /student/exam-card (current student)
export const getMyExamCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute("SELECT id FROM students WHERE user_id = ? LIMIT 1", [userId]);
    if (!rows.length) return res.status(404).json({ error: "Student not found" });

    const card = await buildExamCardForStudentId({ studentId: rows[0].id });

    if (card.finance.clearance_status !== "Cleared") {
      return res.status(403).json({
        error: "Exam card generation blocked: clearance required",
        code: "NOT_CLEARED",
        finance: card.finance,
      });
    }

    return res.json({ success: true, exam_card: card });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to generate exam card", code: err.code });
  }
};

// GET /registrar/exam-cards/:studentId
export const getStudentExamCard = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: "studentId is required" });

    const term = req.query.term ?? req.query.semester;
    const card = await buildExamCardForStudentId({ studentId, termOverride: term });
    return res.json({ success: true, exam_card: card });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to generate exam card", code: err.code });
  }
};

// GET /registrar/exam-cards (list students)
export const listExamCardStudents = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const term = req.query.term ?? req.query.semester;

    const where = [];
    const params = [];

    if (term !== undefined && term !== null && String(term) !== "") {
      where.push("s.term = ?");
      params.push(term);
    }

    if (search) {
      where.push("(s.reg_no LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(
      `
      SELECT
        s.id,
        s.reg_no,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.term,
        s.module,
        c.course_code,
        c.course_name
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY s.createdAt DESC, s.id DESC
      LIMIT 200
      `,
      params
    );

    return res.json({ success: true, students: rows });
  } catch (err) {
    console.error("List exam card students error:", err);
    return res.status(500).json({ error: "Failed to load students" });
  }
};

// Helper function to generate PDF from exam card data (4 cards per A4 page)
const generateExamCardPDF = (card) => {
  const doc = new PDFDocument({ bufferPages: true });

  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const CARDS_PER_ROW = 2;
  const CARDS_PER_COL = 2;
  const MARGIN = 10;
  const CARD_WIDTH = (A4_WIDTH - MARGIN * 3) / CARDS_PER_ROW;
  const CARD_HEIGHT = (A4_HEIGHT - MARGIN * 3) / CARDS_PER_COL;

  const drawCard = (xPos, yPos) => {
    const cardMargin = 8;
    const contentStartX = xPos + cardMargin;
    const contentStartY = yPos + cardMargin;
    const contentWidth = CARD_WIDTH - cardMargin * 2;
    const contentHeight = CARD_HEIGHT - cardMargin * 2;

    // Card border
    doc.rect(xPos, yPos, CARD_WIDTH, CARD_HEIGHT).stroke();

    // Header
    doc.fontSize(10)
      .font("Helvetica-Bold")
      .text("EXAMINATION CARD", contentStartX, contentStartY, { width: contentWidth, align: "center" });

    let currentY = contentStartY + 20;

    doc.fontSize(7)
      .font("Helvetica")
      .text("Official Examination Admission Document", contentStartX, currentY, { width: contentWidth, align: "center" });

    currentY += 12;

    // Student Information
    doc.fontSize(8).font("Helvetica-Bold").text("Student Info", contentStartX, currentY);
    currentY += 10;

    doc.fontSize(7).font("Helvetica");
    const studentInfo = [
      `Reg: ${card.student.reg_no}`,
      `Name: ${`${card.student.first_name} ${card.student.middle_name || ""} ${card.student.last_name}`.trim()}`,
      `Gender: ${card.student.gender || "N/A"}`,
    ];

    studentInfo.forEach((line) => {
      if (currentY > yPos + contentHeight - 40) return;
      doc.text(line, contentStartX, currentY, { width: contentWidth, fontSize: 7 });
      currentY += 8;
    });

    currentY += 5;

    // Course Information
    doc.fontSize(8).font("Helvetica-Bold").text("Course", contentStartX, currentY);
    currentY += 10;

    doc.fontSize(7).font("Helvetica");
    const courseInfo = [
      `Code: ${card.course.course_code || "N/A"}`,
      `Term: ${card.course.term || "N/A"}`,
      `Module: ${card.course.module || "N/A"}`,
    ];

    courseInfo.forEach((line) => {
      if (currentY > yPos + contentHeight - 40) return;
      doc.text(line, contentStartX, currentY, { width: contentWidth, fontSize: 7 });
      currentY += 8;
    });

    currentY += 5;

    // Units Count
    doc.fontSize(8).font("Helvetica-Bold").text("Units", contentStartX, currentY);
    doc.fontSize(7).font("Helvetica").text(`Registered: ${card.registered_units?.length || 0}`, contentStartX + 35, currentY);
    currentY += 10;

    // Finance Status
    doc.fontSize(8).font("Helvetica-Bold").text("Finance", contentStartX, currentY);
    currentY += 10;

    doc.fontSize(7).font("Helvetica");
    const financeInfo = [
      `Balance: ${card.finance.currency} ${card.finance.outstanding_balance.toFixed(2)}`,
      `Status: ${card.finance.clearance_status}`,
      `Hold: ${card.finance.academic_hold.active ? "Yes" : "No"}`,
    ];

    financeInfo.forEach((line) => {
      if (currentY > yPos + contentHeight - 30) return;
      doc.text(line, contentStartX, currentY, { width: contentWidth, fontSize: 7 });
      currentY += 8;
    });

    // Stamping instruction at bottom
    currentY = yPos + CARD_HEIGHT - 25;
    doc.fontSize(6)
      .font("Helvetica-Bold")
      .rect(contentStartX, currentY - 2, contentWidth, 20)
      .stroke();

    doc.fontSize(6)
      .font("Helvetica")
      .text("⚠ Submit to Finance for official stamping", contentStartX + 2, currentY + 2, {
        width: contentWidth - 4,
        align: "center",
      });

    doc.fontSize(5)
      .font("Helvetica")
      .text("before sitting for examination", contentStartX + 2, currentY + 10, {
        width: contentWidth - 4,
        align: "center",
      });
  };

  // Draw 4 cards on a single page in 2x2 grid
  const positions = [
    [MARGIN, MARGIN],
    [MARGIN + CARD_WIDTH + MARGIN, MARGIN],
    [MARGIN, MARGIN + CARD_HEIGHT + MARGIN],
    [MARGIN + CARD_WIDTH + MARGIN, MARGIN + CARD_HEIGHT + MARGIN],
  ];

  positions.forEach(([x, y]) => {
    drawCard(x, y);
  });

  return doc;
};

// GET /student/exam-card/download (download current student's exam card as PDF)
export const downloadMyExamCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute("SELECT id FROM students WHERE user_id = ? LIMIT 1", [userId]);
    if (!rows.length) return res.status(404).json({ error: "Student not found" });

    const card = await buildExamCardForStudentId({ studentId: rows[0].id });

    if (card.finance.clearance_status !== "Cleared") {
      return res.status(403).json({
        error: "Exam card download blocked: clearance required",
        code: "NOT_CLEARED",
        finance: card.finance,
      });
    }

    const pdf = generateExamCardPDF(card);
    const filename = `exam_card_${card.student.reg_no}_${new Date().getTime()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    pdf.pipe(res);
    pdf.end();
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to download exam card", code: err.code });
  }
};

// GET /registrar/exam-cards/:studentId/download (download specific student's exam card as PDF)
export const downloadStudentExamCard = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: "studentId is required" });

    const term = req.query.term ?? req.query.semester;
    const card = await buildExamCardForStudentId({ studentId, termOverride: term });

    const pdf = generateExamCardPDF(card);
    const filename = `exam_card_${card.student.reg_no}_${new Date().getTime()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    pdf.pipe(res);
    pdf.end();
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to download exam card", code: err.code });
  }
};

