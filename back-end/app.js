
import express from "express";
import { PORT } from "./config/env.js";
import cookieParser from 'cookie-parser'
import cors from 'cors'
import coursesRouter from "./routes/registrar/routes.courses.js";
import unitsRouter from "./routes/registrar/routes.units.js";
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
// Routes

app.use('/api/v1/registrar/courses', coursesRouter)
app.use('/api/v1/registrar/units', unitsRouter)

app.listen(PORT, async ()=>{
    console.log(`Listening on port http://localhost/${PORT}`)
})