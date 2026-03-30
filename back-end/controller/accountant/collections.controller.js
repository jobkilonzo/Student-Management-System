import { getCourseFeeSummary } from "./accountant.helpers.js";

export const getCollections = async (_req, res) => {
  try {
    const courseSummary = await getCourseFeeSummary();
    res.json(courseSummary);
  } catch (err) {
    console.error("Get Collections Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
