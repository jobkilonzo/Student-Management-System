import express from "express";
import { PORT } from "./config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRouter from "./routes/auth.routes.js";
import coursesRouter from "./routes/registrar/routes.courses.js";
import unitsRouter from "./routes/registrar/routes.units.js";
import studentsRouter from "./routes/registrar/routes.students.js";
import unitAssignment from "./routes/registrar/routes.unitAssignment.js";
import tutorRoutes from "./routes/tutor/route.unit.js";
import markRoutes from "./routes/tutor/route.marks.js"; 
import attendanceRoutes from "./routes/tutor/route.attendance.js"; 
import generateTranscriptRouter from "./routes/registrar/route.generateTranscript.js"; 
import notificationsRouter from "./routes/registrar/routes.notifications.js";
import studentRouter from "./routes/student/routes.student.js"; 
import accountantRouter from "./routes/accountant/routes.accountant.js";
import { initDatabase } from "./database/init.js";

const app = express();

// CORS + Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize database
initDatabase();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Listen for client connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes (after io is initialized)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/registrar/courses', coursesRouter);
app.use('/api/v1/registrar/units', unitsRouter);
app.use('/api/v1/registrar/transcript', generateTranscriptRouter);
app.use('/api/v1/registrar/students', studentsRouter);
app.use('/api/v1/registrar/notifications', notificationsRouter(io)); // ✅ io is ready
app.use('/api/v1/registrar/unit-assignments', unitAssignment);
app.use('/api/v1/tutor', tutorRoutes);
app.use('/api/v1/marks', markRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/student', studentRouter);
app.use('/api/v1/accountant', accountantRouter);

// Start server
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
