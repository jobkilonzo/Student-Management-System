import { getCourseFeeSummary } from "./accountant.helpers.js";

import db from "../../database/mysql_database.js";
export const getCollections = async (_req, res) => {
  try {
    const courseSummary = await getCourseFeeSummary();
    res.json(courseSummary);
  } catch (err) {
    console.error("Get Collections Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


