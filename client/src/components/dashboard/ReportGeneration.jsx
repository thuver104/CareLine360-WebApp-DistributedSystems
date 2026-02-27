import { useState, useRef, useCallback } from "react";
import {
  FileDown,
  Loader2,
  FileText,
  Calendar,
  Users,
  AlertTriangle,
  Activity,
  Stethoscope,
  TrendingUp,
  CheckSquare,
  Sparkles,
  Table,
  FileSpreadsheet,
  ClipboardList,
  Shield,
  Zap,
} from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/* ──────────────────────────────────────────────────────────── */
/*  CATEGORY DEFINITIONS                                       */
/* ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    key: "appointments",
    label: "Appointments",
    desc: "Meeting scheduled analytics, consultation types, and completion telemetry",
    icon: ClipboardList,
    tags: ["8+ METRICS", "YESTERDAY/DATA"],
    includes: [
      "Total appointments scheduled",
      "Consultation type breakdown (Video/In-person)",
      "Completion & Cancellation rates",
      "Daily booking trends & analytics",
    ],
  },
  {
    key: "emergencies",
    label: "Emergencies",
    desc: "District-wise emergency cases, resolution times, and responder performance",
    icon: AlertTriangle,
    tags: ["ALL DISTRICTS", "REAL-TIME RESPONSE"],
    includes: [
      "Total emergency cases by status",
      "Average response time metrics",
      "Resolution rate analysis",
      "District distribution breakdown",
    ],
  },
  {
    key: "patients",
    label: "Patients",
    desc: "Comprehensive patient demographics and historical medical telemetry",
    icon: Users,
    tags: ["15+ DATA POINTS", "4 SECTIONS"],
    includes: [
      "Gender & blood group distribution",
      "District-wise patient mapping",
      "Chronic condition analytics",
      "Patient registration trends",
    ],
  },
  {
    key: "doctors",
    label: "Doctors",
    desc: "Doctor performance, specialization metrics and consult analytics",
    icon: Stethoscope,
    tags: ["10+ METRICS", "FULL PROFILE"],
    includes: [
      "Specialization distribution",
      "Average consultation fees",
      "Rating & performance analytics",
      "Doctor registration trends",
    ],
  },
  {
    key: "trends",
    label: "Future Trends",
    desc: "Predictive analytics for future case volumes and growth margins",
    icon: TrendingUp,
    tags: ["AI PROJECTION", "DYNAMIC ACCURACY"],
    includes: [
      "Monthly emergency trend analysis",
      "Appointment growth projections",
      "User registration velocity",
      "System growth indicators",
    ],
  },
];

const FORMATS = [
  {
    key: "pdf",
    label: "PDF Document",
    sub: "FORMATTED REPORT WITH CHARTS",
    icon: FileText,
  },
  {
    key: "excel",
    label: "Excel Spreadsheet",
    sub: "MULTI-SHEET WORKBOOK WITH DATA",
    icon: FileSpreadsheet,
  },
  {
    key: "csv",
    label: "CSV Data",
    sub: "RAW DATA FOR ANALYSIS",
    icon: Table,
  },
];

const PRESETS = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 70 Days", days: 70 },
  { label: "Last 6 Months", days: 180 },
  { label: "Last Year", days: 365 },
];

/* ── date helpers ── */
const fmtDate = (d) => d.toISOString().slice(0, 10);
const today = () => fmtDate(new Date());
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDate(d);
};

/* ──────────────────────────────────────────────────────────── */
/*  COMPONENT                                                   */
/* ──────────────────────────────────────────────────────────── */
const ReportGeneration = () => {
  const [category, setCategory] = useState("appointments");
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(today());
  const [format, setFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);
  const reportRef = useRef(null);

  const selectedCat = CATEGORIES.find((c) => c.key === category);

  const applyPreset = (days) => {
    setFromDate(daysAgo(days));
    setToDate(today());
  };

  /* ── Generate report from API ── */
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await api.post("/admin/reports/generate", {
        category,
        fromDate,
        toDate,
      });
      setReportData(res.data.data);
      setReportMeta({
        category: selectedCat.label,
        format: format.toUpperCase(),
        telemetryDelta: `${fromDate}  -  ${toDate}`,
      });
      toast.success("Report generated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }, [category, fromDate, toDate, format, selectedCat]);

  /* ── Patch oklch → rgb so html2canvas can parse all colors ── */
  /* ── Export PDF ── */
  const exportPdf = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const oklchRe = /oklch\([^)]*\)/gi;

      // Convert an oklch() string → rgb() via the canvas pixel trick
      const resolveColor = (raw) => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const ctx = c.getContext("2d");
        ctx.fillStyle = raw;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return a < 255
          ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
          : `rgb(${r},${g},${b})`;
      };

      const patchVal = (v) =>
        v && oklchRe.test(v) ? v.replace(oklchRe, (m) => resolveColor(m)) : v;

      const sourceEl = reportRef.current;

      const canvas = await html2canvas(sourceEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: sourceEl.scrollWidth,
        onclone: (clonedDoc, clonedEl) => {
          // 1) Remove ALL stylesheets so html2canvas never parses oklch
          clonedDoc
            .querySelectorAll('link[rel="stylesheet"], style')
            .forEach((el) => el.remove());

          // 2) Inline every computed style (with oklch→rgb) on each element
          const inlineAll = (srcEl, clnEl) => {
            const cs = getComputedStyle(srcEl);
            for (let i = 0; i < cs.length; i++) {
              const prop = cs[i];
              clnEl.style.setProperty(
                prop,
                patchVal(cs.getPropertyValue(prop)),
              );
            }
            for (let i = 0; i < srcEl.children.length; i++) {
              if (clnEl.children[i])
                inlineAll(srcEl.children[i], clnEl.children[i]);
            }
          };
          inlineAll(sourceEl, clonedEl);
        },
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      const margin = 10;

      // Teal header
      pdf.setFillColor(13, 148, 136);
      pdf.rect(0, 0, pw, 28, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`CareLine360 - ${selectedCat.label} Report`, margin, 12);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 20);
      pdf.text(`Period: ${fromDate} to ${toDate}`, margin, 25);

      const yOff = 32;
      const firstPageH = ph - yOff - 5;
      const subsequentH = ph - 2 * margin;

      if (imgH <= firstPageH) {
        pdf.addImage(imgData, "PNG", margin, yOff, imgW, imgH);
      } else {
        // Slice the canvas into page-sized chunks
        const srcW = canvas.width;
        const srcH = canvas.height;
        const pxPerMm = srcW / imgW;

        let srcYOffset = 0;
        let pageNum = 0;

        while (srcYOffset < srcH) {
          if (pageNum > 0) pdf.addPage();
          const availH = pageNum === 0 ? firstPageH : subsequentH;
          const sliceSrcH = Math.min(
            Math.round(availH * pxPerMm),
            srcH - srcYOffset,
          );
          const sliceMmH = sliceSrcH / pxPerMm;

          // Create a temporary canvas for this slice
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = srcW;
          sliceCanvas.height = sliceSrcH;
          const ctx = sliceCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            srcYOffset,
            srcW,
            sliceSrcH,
            0,
            0,
            srcW,
            sliceSrcH,
          );

          const sliceImg = sliceCanvas.toDataURL("image/png");
          const posY = pageNum === 0 ? yOff : margin;
          pdf.addImage(sliceImg, "PNG", margin, posY, imgW, sliceMmH);

          srcYOffset += sliceSrcH;
          pageNum++;
        }
      }

      pdf.save(`CareLine360_${selectedCat.label}_${fromDate}_${toDate}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  /* ── Export CSV ── */
  const exportCsv = () => {
    if (!reportData) return;
    const rows = [];
    const d = reportData;

    if (d.records) {
      const keys = Object.keys(d.records[0] || {});
      rows.push(keys.join(","));
      d.records.forEach((r) =>
        rows.push(keys.map((k) => `"${r[k] ?? ""}"`).join(",")),
      );
    } else if (d.summary) {
      Object.entries(d.summary).forEach(([k, v]) => {
        if (typeof v === "object" && !Array.isArray(v)) {
          rows.push(`\n${k}`);
          Object.entries(v).forEach(([sk, sv]) => rows.push(`${sk},${sv}`));
        } else if (Array.isArray(v)) {
          rows.push(`\n${k}`);
          v.forEach((item) =>
            rows.push(
              typeof item === "object" ? Object.values(item).join(",") : item,
            ),
          );
        } else {
          rows.push(`${k},${v}`);
        }
      });
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CareLine360_${selectedCat.label}_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  /* ── Compositing = generate + export ── */
  const handleComposite = async () => {
    if (!reportData) {
      // Generate first, then wait for next tick so DOM renders the preview
      setGenerating(true);
      try {
        const res = await api.post("/admin/reports/generate", {
          category,
          fromDate,
          toDate,
        });
        const data = res.data.data;
        setReportData(data);
        setReportMeta({
          category: selectedCat.label,
          format: format.toUpperCase(),
          telemetryDelta: `${fromDate}  -  ${toDate}`,
        });
        toast.success("Report generated successfully");
        // Wait for React to render the preview DOM
        await new Promise((r) => setTimeout(r, 500));
        setGenerating(false);
        // Now export
        if (format === "pdf") await exportPdf();
        else exportCsv();
      } catch (err) {
        console.error(err);
        toast.error("Failed to generate report");
        setGenerating(false);
      }
      return;
    }
    if (format === "pdf") await exportPdf();
    else exportCsv();
  };

  const daysDiff = () => {
    const ms = new Date(toDate) - new Date(fromDate);
    return Math.max(1, Math.ceil(ms / 86400000));
  };

  /* ──────────────── RENDER ──────────────── */
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-8 py-6 border-b border-[var(--border)] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <Shield size={20} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.15em]">
            Report Generation Center
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-0.5">
            Generate detailed analytics reports for patients or doctors
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* ── SELECT REPORT CATEGORY ── */}
        <div>
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-4">
            Select Report Category
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setCategory(cat.key);
                    setReportData(null);
                    setReportMeta(null);
                  }}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/5 shadow-md shadow-teal-500/10"
                        : "border-[var(--border)] hover:border-teal-300 bg-[var(--bg-surface)]"
                    }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-teal-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {cat.label}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black bg-teal-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Targeted
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {cat.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        {cat.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-bold text-[var(--text-secondary)] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3-COLUMN: Includes + Date Range + Intelligence ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COL 1 — Report Includes + Export Format */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3">
                Report Includes
              </p>
              <div className="space-y-2.5">
                {selectedCat.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckSquare
                      size={15}
                      className="text-teal-500 mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3">
                Export Format
              </p>
              <div className="space-y-2">
                {FORMATS.map((f) => {
                  const isActive = format === f.key;
                  const FIcon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
                        ${
                          isActive
                            ? "border-teal-500 bg-teal-500/5"
                            : "border-[var(--border)] hover:border-teal-300"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-teal-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <FIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold ${isActive ? "text-teal-700 dark:text-teal-400" : "text-[var(--text-primary)]"}`}
                        >
                          {f.label}
                        </p>
                        <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                          {f.sub}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COL 2 — Date Range + Presets + Telemetry */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3">
                Date Range
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.days}
                    onClick={() => applyPreset(p.days)}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-teal-500 hover:text-teal-600 hover:bg-teal-500/5 transition-all uppercase tracking-wider"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-2">
                Selected Period Telemetry
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Calendar size={14} className="text-teal-500" />
                <span>{fromDate}</span>
                <span className="text-[var(--text-secondary)]">|</span>
                <span>{toDate}</span>
              </div>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mt-1.5">
                {daysDiff()} days of analytics
              </p>
            </div>
          </div>

          {/* COL 3 — Generate Intelligence */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3">
                Generate Intelligence
              </p>

              {reportMeta ? (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <selectedCat.icon size={16} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {reportMeta.category}
                      </p>
                      <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">
                        PDF Compilation
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    {[
                      {
                        l: "Category",
                        v: reportMeta.category.toUpperCase(),
                      },
                      { l: "Format", v: reportMeta.format },
                      {
                        l: "Telemetry Delta",
                        v: reportMeta.telemetryDelta,
                      },
                    ].map((row) => (
                      <div
                        key={row.l}
                        className="flex justify-between items-center"
                      >
                        <span className="text-[var(--text-secondary)] font-medium">
                          {row.l}
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {row.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center h-44">
                  <Sparkles
                    size={24}
                    className="text-slate-300 dark:text-slate-600 mb-2"
                  />
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    No report generated yet
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Select a category and click compositing
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleComposite}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-60 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
            >
              {generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {generating
                ? "Processing..."
                : `Compositing ${selectedCat.label}`}
            </button>

            <div className="flex items-start gap-2 text-[10px] text-[var(--text-secondary)]">
              <Activity size={12} className="shrink-0 mt-0.5 text-teal-500" />
              <p>
                Reports are generated in real-time from live database records.
                Large date ranges may take a few seconds to composite.
              </p>
            </div>

            <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5">
              <Sparkles size={10} className="text-teal-500" />
              <span className="uppercase tracking-wider font-bold">
                Full Data Registry Inclusion
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── REPORT PREVIEW (rendered after generation — used by PDF export) ── */}
      {reportData && (
        <div className="p-8 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em]">
              Report Preview
            </p>
            {format === "pdf" && (
              <button
                onClick={exportPdf}
                disabled={generating}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                {generating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileDown size={14} />
                )}
                Download PDF
              </button>
            )}
            {(format === "csv" || format === "excel") && (
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <FileDown size={14} />
                Download {format.toUpperCase()}
              </button>
            )}
          </div>

          <div
            ref={reportRef}
            className="bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden"
          >
            {/* Teal gradient header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-800 px-8 py-6 text-white">
              <h2 className="text-xl font-black tracking-tight">
                CareLine360 — {selectedCat.label} Report
              </h2>
              <div className="flex items-center gap-4 mt-2 text-teal-100 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date().toLocaleDateString("en-US", {
                    dateStyle: "full",
                  })}
                </span>
                <span>•</span>
                <span>
                  Period: {fromDate} → {toDate}
                </span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* ── APPOINTMENTS ── */}
              {reportData.category === "appointments" && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        l: "Total Appointments",
                        v: reportData.summary?.totalAppointments,
                      },
                      {
                        l: "Completion Rate",
                        v: reportData.summary?.completionRate,
                      },
                      {
                        l: "Cancellation Rate",
                        v: reportData.summary?.cancellationRate,
                      },
                      { l: "Period Days", v: reportData.period?.days },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center"
                      >
                        <p className="text-2xl font-black">{s.v}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {s.l}
                        </p>
                      </div>
                    ))}
                  </div>
                  {reportData.summary?.statusBreakdown && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Status Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(reportData.summary.statusBreakdown).map(
                          ([status, count]) => (
                            <div
                              key={status}
                              className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                            >
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {status}
                              </p>
                              <p className="text-xl font-black">{count}</p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {reportData.summary?.consultationTypeBreakdown && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Consultation Types
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(
                          reportData.summary.consultationTypeBreakdown,
                        ).map(([type, count]) => (
                          <div
                            key={type}
                            className="p-4 bg-teal-50 rounded-xl border border-teal-100"
                          >
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">
                              {type}
                            </p>
                            <p className="text-xl font-black text-teal-700">
                              {count}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reportData.records?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Appointment Records ({reportData.records.length})
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {[
                                "Date",
                                "Time",
                                "Patient",
                                "Doctor",
                                "Type",
                                "Status",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportData.records.slice(0, 50).map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5">
                                  {new Date(r.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2.5">{r.time}</td>
                                <td className="px-4 py-2.5 font-medium">
                                  {r.patient}
                                </td>
                                <td className="px-4 py-2.5 font-medium">
                                  {r.doctor}
                                </td>
                                <td className="px-4 py-2.5">{r.type}</td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      r.status === "completed"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : r.status === "cancelled"
                                          ? "bg-red-100 text-red-700"
                                          : r.status === "confirmed"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── EMERGENCIES ── */}
              {reportData.category === "emergencies" && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        l: "Total Emergencies",
                        v: reportData.summary?.totalEmergencies,
                      },
                      {
                        l: "Avg Response Time",
                        v: `${reportData.summary?.avgResponseTimeMinutes} min`,
                      },
                      {
                        l: "Resolution Rate",
                        v: reportData.summary?.resolutionRate,
                      },
                      { l: "Period Days", v: reportData.period?.days },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center"
                      >
                        <p className="text-2xl font-black">{s.v}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {s.l}
                        </p>
                      </div>
                    ))}
                  </div>
                  {reportData.summary?.statusBreakdown && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Emergency Status Distribution
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(reportData.summary.statusBreakdown).map(
                          ([status, count]) => {
                            const colors = {
                              PENDING:
                                "bg-amber-50 border-amber-100 text-amber-700",
                              DISPATCHED:
                                "bg-blue-50 border-blue-100 text-blue-700",
                              ARRIVED:
                                "bg-violet-50 border-violet-100 text-violet-700",
                              RESOLVED:
                                "bg-emerald-50 border-emerald-100 text-emerald-700",
                            };
                            return (
                              <div
                                key={status}
                                className={`p-4 rounded-xl border ${colors[status] || "bg-slate-50 border-slate-100 text-slate-700"}`}
                              >
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">
                                  {status}
                                </p>
                                <p className="text-xl font-black">{count}</p>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── PATIENTS ── */}
              {reportData.category === "patients" && (
                <>
                  <div className="p-5 bg-teal-50 rounded-xl border border-teal-100 text-center">
                    <p className="text-3xl font-black text-teal-700">
                      {reportData.summary?.totalPatients}
                    </p>
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
                      Total Patients
                    </p>
                  </div>
                  {reportData.summary?.genderDistribution && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Gender Distribution
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(
                          reportData.summary.genderDistribution,
                        ).map(([g, c]) => (
                          <div
                            key={g}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center"
                          >
                            <p className="text-xl font-black">{c}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                              {g}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reportData.summary?.bloodGroupDistribution && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Blood Group Distribution
                      </h4>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(
                          reportData.summary.bloodGroupDistribution,
                        ).map(([bg, c]) => (
                          <div
                            key={bg}
                            className="p-3 bg-red-50 rounded-xl border border-red-100 text-center"
                          >
                            <p className="text-lg font-black text-red-700">
                              {c}
                            </p>
                            <p className="text-[10px] font-bold text-red-500 uppercase">
                              {bg}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reportData.summary?.topChronicConditions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Top Chronic Conditions
                      </h4>
                      <div className="space-y-2">
                        {reportData.summary.topChronicConditions.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <span className="text-xs font-medium">
                              {c.name}
                            </span>
                            <span className="text-xs font-black">
                              {c.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── DOCTORS ── */}
              {reportData.category === "doctors" && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        l: "Total Doctors",
                        v: reportData.summary?.totalDoctors,
                      },
                      {
                        l: "Avg Rating",
                        v: `${reportData.summary?.avgRating} / 5`,
                      },
                      {
                        l: "Avg Consultation Fee",
                        v: `Rs. ${reportData.summary?.avgConsultationFee}`,
                      },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center"
                      >
                        <p className="text-2xl font-black">{s.v}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {s.l}
                        </p>
                      </div>
                    ))}
                  </div>
                  {reportData.summary?.specializationDistribution && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Specialization Distribution
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(
                          reportData.summary.specializationDistribution,
                        ).map(([spec, count]) => (
                          <div
                            key={spec}
                            className="p-4 bg-violet-50 rounded-xl border border-violet-100"
                          >
                            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">
                              {spec}
                            </p>
                            <p className="text-xl font-black text-violet-700">
                              {count}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── TRENDS ── */}
              {reportData.category === "trends" && (
                <>
                  {[
                    {
                      key: "emergencyTrend",
                      title: "Emergency Trend",
                    },
                    {
                      key: "appointmentTrend",
                      title: "Appointment Trend",
                    },
                    {
                      key: "userGrowthTrend",
                      title: "User Growth Trend",
                    },
                  ].map(
                    (trend) =>
                      reportData[trend.key]?.length > 0 && (
                        <div key={trend.key}>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            {trend.title}
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">
                                    Month
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">
                                    Count
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {reportData[trend.key].map((m, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 font-medium">
                                      {m.month}
                                    </td>
                                    <td className="px-4 py-2.5 font-black">
                                      {m.count}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ),
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-medium">
                CareLine360 Automated Report • {new Date().toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Confidential — For Internal Use Only
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGeneration;
