import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import AccountantLayout from "./AccountantLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const Collections = () => {
  const [courses, setCourses] = useState([]);
  const [feeInputs, setFeeInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState(null);
  const [error, setError] = useState("");
  const [feeTypes, setFeeTypes] = useState([]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await makeRequest.get("/accountant/collections");
      console.log("Courses data:", res.data);
      setCourses(res.data || []);
    } catch (err) {
      console.error("Failed to load collections:", err);
      setError("Failed to load collections summary.");
    } finally {
      setLoading(false);
    }
  };

  const loadFeeTypes = async () => {
    try {
      const res = await makeRequest.get("/accountant/fee-types");
      setFeeTypes(res.data || []);
    } catch (err) {
      console.error("Failed to load fee types:", err);
    }
  };

  useEffect(() => {
    loadCollections();
    loadFeeTypes();
  }, []);

  // Determine course level configuration based on course_type
  const getCourseLevelConfig = (course) => {
    if (!course || !course.course_name) return { type: "none", count: 0, label: "", field: "module" };
    
    const courseType = course.course_type?.toLowerCase() || "";
    const courseName = course.course_name.toLowerCase();
    
    // stage_based courses - use Stages
    if (courseType === "stage_based") {
      if (courseName.includes("certificate") || courseName.includes("secretarial")) {
        return { type: "stage", count: 3, label: "Stage", field: "module" };
      }
      return { type: "stage", count: 3, label: "Stage", field: "module" };
    }
    
    // grade_based courses - use Grades
    if (courseType === "grade_based") {
      return { type: "grade", count: 4, label: "Grade", field: "module" };
    }
    
    // level_based courses - use Levels
    if (courseType === "level_based") {
      return { type: "level", count: 3, label: "Level", field: "module" };
    }
    
    // modular courses - use Modules
    if (courseType === "modular") {
      if (courseName.includes("craft")) {
        return { type: "modular", count: 2, label: "Module", field: "module" };
      }
      if (courseName.includes("diploma")) {
        return { type: "modular", count: 3, label: "Module", field: "module" };
      }
      return { type: "modular", count: 3, label: "Module", field: "module" };
    }
    
    // non_modular courses - NO levels
    if (courseType === "non_modular") {
      return { type: "none", count: 0, label: "", field: "module" };
    }
    
    return { type: "none", count: 0, label: "", field: "module" };
  };

  const isFeeAlreadySet = (course, term, fee_type_id, levelValue, excludeId = null) => {
    return course.fees_per_term?.some(
      (f) => f.term === term && 
             f.fee_type_id === fee_type_id && 
             f.module === levelValue &&
             (excludeId ? f.id !== excludeId : true)
    ) || false;
  };

  const getAvailableFeeTypes = (course, term, levelValue, currentFeeTypeId = null) => {
    if (!course?.fees_per_term || !term) return feeTypes;
    
    if (levelValue !== undefined && levelValue !== null) {
      const usedFeeTypeIds = course.fees_per_term
        .filter(f => f.term === term && f.module === levelValue)
        .map(f => f.fee_type_id);
      
      const filteredUsedIds = currentFeeTypeId 
        ? usedFeeTypeIds.filter(id => id !== currentFeeTypeId)
        : usedFeeTypeIds;
      
      return feeTypes.filter(ft => !filteredUsedIds.includes(ft.id));
    }
    
    const usedFeeTypeIds = course.fees_per_term
      .filter(f => f.term === term)
      .map(f => f.fee_type_id);
    
    const filteredUsedIds = currentFeeTypeId 
      ? usedFeeTypeIds.filter(id => id !== currentFeeTypeId)
      : usedFeeTypeIds;
    
    return feeTypes.filter(ft => !filteredUsedIds.includes(ft.id));
  };

  const handleSaveFee = async (courseId) => {
    const inputData = feeInputs[courseId];
    if (!inputData?.amount || !inputData?.term || !inputData?.fee_type_id) return;

    const course = courses.find((c) => c.course_id === courseId);
    const levelConfig = getCourseLevelConfig(course);
    
    if (levelConfig.count > 0 && (!inputData.level || inputData.level === "")) {
      alert(`${levelConfig.label} is required for ${course.course_name}. Please select ${levelConfig.label} (1-${levelConfig.count}).`);
      return;
    }

    const levelValue = levelConfig.count > 0 ? Number(inputData.level) : null;

    if (course && isFeeAlreadySet(course, inputData.term, inputData.fee_type_id, levelValue, inputData.id)) {
      const levelText = levelConfig.count > 0 ? ` + ${levelConfig.label}` : "";
      alert(`This fee combination (${levelConfig.label}${levelText} + Term + Fee Type) already exists.`);
      return;
    }

    const saveKey = `${courseId}-${inputData.fee_type_id}-${inputData.term}-${levelValue}`;

    try {
      setSavingCourseId(saveKey);

      await makeRequest.post("/accountant/course-fees", {
        id: inputData.id || undefined,
        course_id: courseId,
        fee_type_id: inputData.fee_type_id,
        term: inputData.term,
        module: levelValue,
        amount: Number(inputData.amount),
      });

      setFeeInputs((prev) => {
        const updated = { ...prev };
        delete updated[courseId];
        return updated;
      });

      await loadCollections();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) alert(err.response.data.error);
    } finally {
      setSavingCourseId(null);
    }
  };

  const downloadFullPDF = () => {
    if (!courses.length) return;
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Collections Summary", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Fee expectations, receipts, and outstanding balances by course.", pageWidth / 2, 60, { align: "center" });
    
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    const currentDate = new Date().toLocaleString();
    doc.text(`Generated on: ${currentDate}`, pageWidth - 40, 25, { align: "right" });

    const tableColumn = [
      "Course", 
      "Code", 
      "Level", 
      "Term", 
      "Fee Type", 
      "Amount (KSh)", 
      "Students", 
      "Expected (KSh)", 
      "Collected (KSh)", 
      "Outstanding (KSh)", 
      "Rate (%)"
    ];

    const tableRows = courses.flatMap((course) => {
      const levelConfig = getCourseLevelConfig(course);
      const fees = course.fees_per_term?.length ? course.fees_per_term : [{ term: "-", module: null, amount: 0, fee_type_name: "-" }];
      
      return fees.map((fee) => {
        let levelDisplay = "-";
        if (levelConfig.count > 0 && fee.module) {
          levelDisplay = `${levelConfig.label} ${fee.module}`;
        }
        
        return [
          course.course_name || "-",
          course.course_code || "-",
          levelDisplay,
          fee.term || "-",
          fee.fee_type_name || "-",
          fee.amount > 0 ? fee.amount.toLocaleString() : "0",
          course.total_students ?? 0,
          (course.total_expected ?? 0).toLocaleString(),
          (course.total_collected ?? 0).toLocaleString(),
          (course.total_outstanding ?? 0).toLocaleString(),
          course.collection_rate ?? 0,
        ];
      });
    });

    const totals = courses.reduce((acc, course) => {
      acc.students += Number(course.total_students || 0);
      acc.expected += Number(course.total_expected || 0);
      acc.collected += Number(course.total_collected || 0);
      acc.outstanding += Number(course.total_outstanding || 0);
      acc.rates.push(Number(course.collection_rate || 0));
      return acc;
    }, { students: 0, expected: 0, collected: 0, outstanding: 0, rates: [] });

    const avgRate = totals.rates.length > 0
      ? (totals.rates.reduce((a, b) => a + b, 0) / totals.rates.length).toFixed(2)
      : 0;

    tableRows.push([
      "TOTAL", 
      "-", 
      "-", 
      "-", 
      "-", 
      "-", 
      totals.students, 
      totals.expected.toLocaleString(), 
      totals.collected.toLocaleString(), 
      totals.outstanding.toLocaleString(), 
      avgRate
    ]);

    autoTable(doc, {
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: { 
        fillColor: [0, 150, 136], 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        halign: 'right'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 50 },
        3: { halign: 'center', cellWidth: 40 },
        4: { halign: 'left', cellWidth: 'auto' },
        5: { halign: 'right', cellWidth: 70 },
        6: { halign: 'center', cellWidth: 50 },
        7: { halign: 'right', cellWidth: 80 },
        8: { halign: 'right', cellWidth: 80 },
        9: { halign: 'right', cellWidth: 80 },
        10: { halign: 'center', cellWidth: 50 }
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20, top: 80, bottom: 30 },
      theme: "grid",
      didDrawPage: (data) => {
        const pageNumber = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${pageNumber} of ${doc.internal.getNumberOfPages()}`,
          pageWidth - 40,
          pageHeight - 15,
          { align: "right" }
        );
      },
    });

    doc.save(`collections_summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <AccountantLayout title="Collections" subtitle="Compare fee expectations, receipts, and outstanding balances by course.">
      <div className="mb-4 flex justify-end">
        <button
          onClick={downloadFullPDF}
          disabled={!courses.length || loading}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF Report
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading collections summary...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No courses available for collections reporting.</div>
        ) : (
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b">
                <th className="pb-3 font-semibold">Course</th>
                <th className="pb-3 font-semibold">Current Fee Per Student</th>
                <th className="pb-3 font-semibold">Set / Edit Fee</th>
                <th className="pb-3 font-semibold">Students</th>
                <th className="pb-3 font-semibold">Expected</th>
                <th className="pb-3 font-semibold">Collected</th>
                <th className="pb-3 font-semibold">Outstanding</th>
                <th className="pb-3 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const formKey = course.course_id;
                const formData = feeInputs[formKey];
                const levelConfig = getCourseLevelConfig(course);
                const hasLevels = levelConfig.count > 0;
                
                const availableFeeTypes = getAvailableFeeTypes(
                  course, 
                  formData?.term, 
                  hasLevels ? (formData?.level ? Number(formData.level) : null) : null,
                  formData?.id
                );
                
                return (
                  <tr key={course.course_id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{course.course_name}</p>
                      <p className="text-sm text-slate-500">{course.course_code}</p>
                      <p className="text-xs mt-1">
                        {course.course_type === "modular" && (
                          <span className="text-green-600">📚 Modular ({levelConfig.label}s 1-{levelConfig.count})</span>
                        )}
                        {course.course_type === "stage_based" && (
                          <span className="text-purple-600">🎭 Stage-Based ({levelConfig.label}s 1-{levelConfig.count})</span>
                        )}
                        {course.course_type === "grade_based" && (
                          <span className="text-orange-600">📊 Grade-Based ({levelConfig.label}s 1-{levelConfig.count})</span>
                        )}
                        {course.course_type === "level_based" && (
                          <span className="text-indigo-600">📈 Level-Based ({levelConfig.label}s 1-{levelConfig.count})</span>
                        )}
                        {course.course_type === "non_modular" && (
                          <span className="text-blue-600">📋 Non-Modular (No levels)</span>
                        )}
                      </p>
                    </td>

                    {/* Current Fee Per Student - Display in order: Level → Term → Fee Type → Amount */}
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        {course.fees_per_term?.length > 0 ? (
                          course.fees_per_term.map((fee) => (
                            <div key={fee.id} className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-slate-900">
                                {hasLevels && fee.module ? `${levelConfig.label} ${fee.module} - ` : ""}
                                Term {fee.term} - {fee.fee_type_name}: {formatCurrency(fee.amount)}
                              </span>
                              <button
                                onClick={() => {
                                  setFeeInputs((prev) => ({
                                    ...prev,
                                    [formKey]: {
                                      id: fee.id,
                                      amount: String(fee.amount),
                                      term: fee.term,
                                      fee_type_id: fee.fee_type_id,
                                      fee_type_name: fee.fee_type_name,
                                      level: fee.module ? String(fee.module) : (hasLevels ? "" : null),
                                    },
                                  }));
                                }}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Edit
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400">No fees set</span>
                        )}
                      </div>
                    </td>

                    {/* Set / Edit Fee Form - ORDER: Level → Term → Fee Type → Amount */}
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. LEVEL DROPDOWN */}
                          {hasLevels && (
                            <select
                              value={formData?.level || ""}
                              onChange={(e) => {
                                const newLevel = e.target.value;
                                setFeeInputs((prev) => ({
                                  ...prev,
                                  [formKey]: { 
                                    ...prev[formKey], 
                                    level: newLevel,
                                    term: "",
                                    fee_type_id: "",
                                  },
                                }));
                              }}
                              className="rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-teal-600"
                              required
                            >
                              <option value="" disabled>Select {levelConfig.label}</option>
                              {Array.from({ length: levelConfig.count }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {levelConfig.label} {i + 1}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* 2. TERM DROPDOWN */}
                          <select
                            value={formData?.term || ""}
                            onChange={(e) => {
                              const newTerm = Number(e.target.value);
                              setFeeInputs((prev) => ({
                                ...prev,
                                [formKey]: { 
                                  ...prev[formKey], 
                                  term: newTerm,
                                  fee_type_id: "",
                                },
                              }));
                            }}
                            className="rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-teal-600"
                            disabled={hasLevels && !formData?.level}
                          >
                            <option value="" disabled>
                              {hasLevels && !formData?.level ? `Select ${levelConfig.label} First` : "Select Term"}
                            </option>
                            <option value={1}>Term 1</option>
                            <option value={2}>Term 2</option>
                            <option value={3}>Term 3</option>
                          </select>

                          {/* 3. FEE TYPE DROPDOWN */}
                          <select
                            value={formData?.fee_type_id || ""}
                            onChange={(e) =>
                              setFeeInputs((prev) => ({
                                ...prev,
                                [formKey]: { ...prev[formKey], fee_type_id: Number(e.target.value) },
                              }))
                            }
                            className="rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-teal-600"
                            disabled={!formData?.term}
                          >
                            <option value="" disabled>
                              {!formData?.term ? "Select Term First" : "Select Fee Type"}
                            </option>
                            {availableFeeTypes.map((ft) => (
                              <option key={ft.id} value={ft.id}>
                                {ft.name}
                              </option>
                            ))}
                          </select>

                          {/* 4. AMOUNT INPUT */}
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter fee"
                            value={formData?.amount || ""}
                            onChange={(e) =>
                              setFeeInputs((prev) => ({
                                ...prev,
                                [formKey]: { ...prev[formKey], amount: e.target.value },
                              }))
                            }
                            disabled={!formData?.term || !formData?.fee_type_id}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
                          />

                          {/* 5. SAVE BUTTON */}
                          <button
                            onClick={() => handleSaveFee(course.course_id)}
                            disabled={
                              !formData?.term ||
                              !formData?.fee_type_id ||
                              !formData?.amount ||
                              (hasLevels && !formData?.level) ||
                              savingCourseId === `${course.course_id}-${formData?.fee_type_id}-${formData?.term}-${formData?.level}`
                            }
                            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                          >
                            {savingCourseId === `${course.course_id}-${formData?.fee_type_id}-${formData?.term}-${formData?.level}`
                              ? "Saving..."
                              : formData?.id
                              ? "Update"
                              : "Save New"}
                          </button>
                        </div>

                        {formData?.id && (
                          <p className="text-xs text-blue-600 mt-1">✏️ Editing existing fee - changes will update this record</p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 text-slate-700">{course.total_students}</td>
                    <td className="py-4 font-semibold text-slate-900">{formatCurrency(course.total_expected)}</td>
                    <td className="py-4 font-semibold text-emerald-600">{formatCurrency(course.total_collected)}</td>
                    <td className="py-4 font-semibold text-rose-600">{formatCurrency(course.total_outstanding)}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold">
                        {course.collection_rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </AccountantLayout>
  );
};

export default Collections;