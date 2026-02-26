import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { api } from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import PatientNavbar from "./components/PatientNavbar";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
function fmtTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function badgeForVisitType(type) {
  const t = (type || "").toLowerCase();
  if (t === "emergency") return "bg-red-50 text-red-700 border-red-100";
  if (t === "follow-up") return "bg-yellow-50 text-yellow-800 border-yellow-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function normalizeList(data) {
  // supports: [] OR {data: []} OR {records: []}
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export default function PatientMedicalHistory() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [me, setMe] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [selected, setSelected] = useState(null);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("medical-history.pdf");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const buildPdfBlob = () => {
    if (!selected) return null;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    const line = (text, size = 11, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);

      const lines = pdf.splitTextToSize(String(text || ""), pageWidth - margin * 2);
      lines.forEach((l) => {
        if (y > 285) {
          pdf.addPage();
          y = 16;
        }
        pdf.text(l, margin, y);
        y += 6;
      });
      y += 2;
    };

    // Title
    line("CareLine360 - Medical History", 16, true);
    line(`Generated: ${new Date().toLocaleString()}`, 10, false);
    y += 4;

    // Visit Info
    line("Visit Details", 13, true);
    line(`Visit Date: ${selected.visitDate ? new Date(selected.visitDate).toLocaleDateString() : "-"}`);
    line(`Visit Type: ${selected.visitType || "-"}`);
    line(`Chief Complaint: ${selected.chiefComplaint || "-"}`);
    line(`Diagnosis: ${selected.diagnosis || "-"}`);

    if (selected.icdCode) line(`ICD Code: ${selected.icdCode}`);
    if (selected.notes) line(`Notes: ${selected.notes}`);
    if (selected.treatmentPlan) line(`Treatment Plan: ${selected.treatmentPlan}`);

    if (selected.symptoms?.length) {
      line("Symptoms", 13, true);
      line(selected.symptoms.join(", "));
    }

    if (selected.secondaryDiagnosis?.length) {
      line("Secondary Diagnosis", 13, true);
      line(selected.secondaryDiagnosis.join(", "));
    }

    if (selected.vitals) {
      const v = selected.vitals;
      line("Vitals", 13, true);
      line(`Blood Pressure: ${v.bloodPressure || "-"}`);
      line(`Heart Rate: ${v.heartRate ?? "-"}`);
      line(`Temperature: ${v.temperature ?? "-"}`);
      line(`Weight: ${v.weight ?? "-"}`);
      line(`Height: ${v.height ?? "-"}`);
      line(`Oxygen Sat: ${v.oxygenSat ?? "-"}`);
    }

    if (selected.attachments?.length) {
      line("Attachments", 13, true);
      selected.attachments.forEach((a, idx) => line(`${idx + 1}. ${a}`, 10));
    }

    // ✅ Return blob for preview
    return pdf.output("blob");
  };

  const openPdfPreview = async () => {
    if (!selected) return;

    setPdfLoading(true);

    // cleanup old URL
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);

    const blob = buildPdfBlob();
    if (!blob) {
      setPdfLoading(false);
      return;
    }

    const date = selected.visitDate
      ? new Date(selected.visitDate).toISOString().slice(0, 10)
      : "record";

    const fileName = `medical-history-${date}.pdf`;

    const url = URL.createObjectURL(blob);
    setPdfFileName(fileName);
    setPdfUrl(url);
    setPdfOpen(true);
    setPdfLoading(false);
  };

  const downloadFromPreview = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const [meRes, recRes, preRes] = await Promise.all([
          api.get("/patients/me"),
          api.get("/patients/me/medical-record"),
          api.get("/patients/me/prescription"),
        ]);

        const recList = normalizeList(recRes.data).sort(
          (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
        );
        const preList = normalizeList(preRes.data);

        setMe(meRes.data);
        setRecords(recList);
        setPrescriptions(preList);
        setSelected(recList[0] || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load medical history");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Map prescriptions by medicalRecordId for fast lookup
  const presByRecordId = useMemo(() => {
    const map = new Map();
    for (const p of prescriptions) {
      const key = typeof p.medicalRecordId === "object" ? p.medicalRecordId?._id : p.medicalRecordId;
      if (key) map.set(String(key), p);
    }
    return map;
  }, [prescriptions]);

  const types = useMemo(() => {
    const set = new Set(records.map((r) => (r.visitType || "consultation").toLowerCase()));
    return ["all", ...Array.from(set)];
  }, [records]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return records.filter((r) => {
      const t = (r.visitType || "consultation").toLowerCase();
      if (typeFilter !== "all" && t !== typeFilter) return false;
      if (!qq) return true;

      const hay = [
        r.visitType,
        r.chiefComplaint,
        r.diagnosis,
        ...(r.symptoms || []),
        ...(r.secondaryDiagnosis || []),
        r.icdCode,
        r.notes,
        r.treatmentPlan,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [records, q, typeFilter]);

  const selectedPrescription = useMemo(() => {
    if (!selected?._id) return null;
    return presByRecordId.get(String(selected._id)) || null;
  }, [selected, presByRecordId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-16 rounded-3xl bg-white shadow-sm" />
          <div className="mt-6 grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 h-[560px] rounded-3xl bg-white shadow-sm" />
            <div className="lg:col-span-7 h-[560px] rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <PatientNavbar />
      <div className="max-w-7xl mx-auto mt-6">
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100"
            >
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Medical History</h1>
            <p className="text-gray-600 mt-1">
              {me?.fullName ? `Patient: ${me.fullName}` : "Your visits, diagnosis, and prescriptions"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openPdfPreview}
              disabled={!selected || pdfLoading}
              className="px-4 py-2 rounded-full bg-black text-white text-sm shadow hover:opacity-95 disabled:opacity-50"
            >
              {pdfLoading ? "Preparing..." : "Preview PDF"}
            </button>

            <a
              href="/patient/dashboard"
              className="px-4 py-2 rounded-full bg-black text-white text-sm shadow hover:opacity-95"
            >
              Back
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-5">
          {/* LEFT: list */}
          <motion.div
            className="lg:col-span-5 bg-white rounded-3xl shadow-sm p-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-200">
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Search diagnosis, symptoms, notes..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm outline-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All types" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
              {filtered.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                  No records found.
                </div>
              ) : (
                filtered.map((r) => {
                  const isActive = selected?._id === r._id;
                  const hasPrescription = presByRecordId.has(String(r._id));

                  return (
                    <button
                      key={r._id}
                      onClick={() => setSelected(r)}
                      className={
                        "w-full text-left p-4 rounded-3xl border transition " +
                        (isActive
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-100 hover:shadow-sm bg-white")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">
                            {r.diagnosis || r.chiefComplaint || "Visit"}
                          </div>
                          <div className={"text-xs mt-1 " + (isActive ? "text-white/70" : "text-gray-500")}>
                            {fmtDate(r.visitDate)} {fmtTime(r.visitDate)}
                          </div>

                          {hasPrescription && (
                            <div className={"text-xs mt-2 " + (isActive ? "text-white/70" : "text-gray-600")}>
                              💊 Prescription available
                            </div>
                          )}
                        </div>

                        <span
                          className={
                            "text-xs px-3 py-1 rounded-full border " +
                            (isActive ? "bg-white/10 text-white border-white/20" : badgeForVisitType(r.visitType))
                          }
                        >
                          {r.visitType || "consultation"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* RIGHT: details */}
          <motion.div
            className="lg:col-span-7 bg-white rounded-3xl shadow-sm p-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="max-h-[520px] overflow-auto pr-1">
            {!selected ? (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                Select a record to view details.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Visit Date</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {fmtDate(selected.visitDate)}{" "}
                      <span className="text-base font-normal text-gray-500">{fmtTime(selected.visitDate)}</span>
                    </div>
                  </div>
                  <span className={"text-xs px-3 py-1 rounded-full border " + badgeForVisitType(selected.visitType)}>
                    {selected.visitType}
                  </span>
                </div>

                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  <Box label="Chief Complaint" value={selected.chiefComplaint} />
                  <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-500">Diagnosis</div>
                    <div className="text-sm text-gray-900 mt-1">{selected.diagnosis || "—"}</div>
                    {selected.icdCode ? (
                      <div className="text-xs text-gray-500 mt-2">ICD: {selected.icdCode}</div>
                    ) : null}
                  </div>

                  <Box label="Symptoms" value={(selected.symptoms || []).length ? selected.symptoms.join(", ") : "—"} />
                  <Box
                    label="Secondary Diagnosis"
                    value={(selected.secondaryDiagnosis || []).length ? selected.secondaryDiagnosis.join(", ") : "—"}
                  />
                </div>

                <div className="mt-4 p-4 rounded-3xl border border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">Notes</div>
                  <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">{selected.notes || "—"}</div>

                  <div className="mt-4 text-sm font-semibold text-gray-900">Treatment Plan</div>
                  <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">{selected.treatmentPlan || "—"}</div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <Mini label="Follow-up Date" value={fmtDate(selected.followUpDate)} />
                    <Mini label="Appointment" value={selected.appointmentId ? "Linked" : "—"} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-900">Vitals</div>
                  <div className="mt-2 grid sm:grid-cols-3 gap-3">
                    <Vital label="BP" value={selected?.vitals?.bloodPressure} />
                    <Vital label="HR" value={selected?.vitals?.heartRate} unit="bpm" />
                    <Vital label="Temp" value={selected?.vitals?.temperature} unit="°C" />
                    <Vital label="Weight" value={selected?.vitals?.weight} unit="kg" />
                    <Vital label="Height" value={selected?.vitals?.height} unit="cm" />
                    <Vital label="O₂ Sat" value={selected?.vitals?.oxygenSat} unit="%" />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-gray-900">Attachments</div>
                  <div className="mt-2">
                    {(selected.attachments || []).length ? (
                      <div className="flex flex-wrap gap-2">
                        {selected.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100"
                          >
                            📎 Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">—</div>
                    )}
                  </div>
                </div>

                {/* Prescription (matched by medicalRecordId) */}
                <div className="mt-6 p-4 rounded-3xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">Prescription</div>

                    {selectedPrescription?.fileUrl ? (
                      <a
                        href={selectedPrescription.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-2 rounded-full bg-black text-white hover:opacity-95"
                      >
                        View PDF
                      </a>
                    ) : null}
                  </div>

                  {!selectedPrescription ? (
                    <div className="text-sm text-gray-600 mt-2">No prescription for this visit.</div>
                  ) : (
                    <>
                      {selectedPrescription.notes ? (
                        <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                          {selectedPrescription.notes}
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2">
                        {(selectedPrescription.medicines || []).length === 0 ? (
                          <div className="text-sm text-gray-600">No medicines listed.</div>
                        ) : (
                          selectedPrescription.medicines.map((m, idx) => (
                            <div key={idx} className="p-3 rounded-2xl bg-white border border-gray-100">
                              <div className="text-sm font-semibold text-gray-900">
                                {m.medicine || "Medicine"}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {m.dosage ? `Dosage: ${m.dosage}` : ""}
                                {m.frequency ? ` • Frequency: ${m.frequency}` : ""}
                                {m.duration ? ` • Duration: ${m.duration}` : ""}
                              </div>
                              {m.instructions ? (
                                <div className="text-xs text-gray-600 mt-2">{m.instructions}</div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            </div>
          </motion.div>
        </div>
      </div>

      {pdfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-sm">PDF Preview</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadFromPreview}
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-95"
                >
                  Download
                </button>

                <button
                  onClick={() => setPdfOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="h-[75vh] bg-gray-100">
              {pdfUrl ? (
                <iframe title="PDF Preview" src={pdfUrl} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  No preview available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 mt-1">{value || "—"}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 mt-1">{value || "—"}</div>
    </div>
  );
}

function Vital({ label, value, unit }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="p-3 rounded-2xl bg-white border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900 mt-1">
        {empty ? "—" : value}
        {empty ? "" : unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}