
import express from "express";
import { PORT } from "./config/env.js";
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from "./routes/auth.routes.js";
import coursesRouter from "./routes/registrar/routes.courses.js";
import unitsRouter from "./routes/registrar/routes.units.js";
import studentsRouter from "./routes/registrar/routes.students.js";
import { initDatabase } from "./database/init.js";

const app = express()
app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Credentials", true)
    next()
})
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
})); 
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())

// Initialize database (creates required tables + default admin user)
initDatabase();

// Routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/registrar/courses', coursesRouter)
app.use('/api/v1/registrar/units', unitsRouter)
app.use('/api/v1/registrar/students', studentsRouter)

app.listen(PORT, async ()=>{
    console.log(`Listening on port http://localhost/${PORT}`)
})