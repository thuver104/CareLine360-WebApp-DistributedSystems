import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/axios";
import { motion } from "framer-motion";
import PatientNavbar from "./components/PatientNavbar";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  // ✅ same as dashboard: load patient info from /patients/me
  const [me, setMe] = useState(null);

  const fileRef = useRef(null);

  const navItems = useMemo(
    () => [
      { label: "Overview", href: "/patient/dashboard" },
      { label: "Appointments", href: "/appointments" },
      { label: "Documents", href: "/patient/documents" },
      { label: "Medical History", href: "/patient/medical-history" },
      { label: "AI Chat", href: "/patient/messages" },
      { label: "Directory", href: "/patient/directory" },
    ],
    [],
  );

  const activePath =
    typeof window !== "undefined" ? window.location.pathname : "";

  const categories = [
    { value: "lab_report", label: "Lab Report" },
    { value: "prescription", label: "Prescription" },
    { value: "scan", label: "Scan" },
    { value: "discharge", label: "Discharge Summary" },
    { value: "other", label: "Other" },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.clear();
    window.location.href = "/login";
  };

  const msgClass =
    msgType === "success"
      ? "bg-green-50 text-green-800 ring-1 ring-green-100"
      : msgType === "error"
        ? "bg-red-50 text-red-800 ring-1 ring-red-100"
        : "bg-blue-50 text-blue-800 ring-1 ring-blue-100";

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents", {
        params: { category: filterCategory, q: search },
      });
      setDocs(res.data?.documents || []);
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const loadMe = async () => {
    try {
      const res = await api.get("/patients/me");
      setMe(res.data || null);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadDocs();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory]);

  const upload = async () => {
    if (!file) {
      setMsgType("error");
      setMsg("Please choose a file");
      return;
    }

    try {
      setMsg("");
      setMsgType("");

      const fd = new FormData();
      fd.append("document", file);
      fd.append("title", title);
      fd.append("category", category);

      await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsgType("success");
      setMsg("✅ Document uploaded");

      setFile(null);
      setTitle("");
      setCategory("other");
      if (fileRef.current) fileRef.current.value = "";

      await loadDocs();
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Upload failed");
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      setMsgType("success");
      setMsg("✅ Document deleted");
      await loadDocs();
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Delete failed");
    }
  };

  const removePermanent = async (id) => {
    try {
      await api.delete(`/documents/${id}/permanent`);
      setMsgType("success");
      setMsg("✅ Document deleted permanently");
      await loadDocs();
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Permanent delete failed");
    }
  };

  const handleOpen = (doc) => {
    const url = doc.viewUrl || doc.fileUrl;

    // Images
    if (doc.mimeType?.startsWith("image/")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // PDF
    if (doc.mimeType === "application/pdf") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // Word documents → use Google viewer
    const isWord =
      doc.mimeType === "application/msword" ||
      doc.mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (isWord) {
      const gview = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
      window.open(gview, "_blank", "noopener,noreferrer");
      return;
    }

    // fallback download
    window.open(url, "_blank");
  };

  const Spinner = ({ size = 28 }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className="rounded-full border-3 border-teal-100 border-t-[#178d95] animate-spin"
        style={{ width: size, height: size }}
        aria-label="Loading"
      />

      <div className="text-sm text-gray-500 animate-pulse">Loading data...</div>
    </div>
  );

  // ✅ supports different backend field names (in case it’s not avatarUrl)
  // const avatar = me?.avatarUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      {/* ✅ NAV BAR (copied style from dashboard) */}
      <PatientNavbar/>

      {/* PAGE CONTENT */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload and manage your medical documents.
            </p>
          </div>
          <a
            href="/patient/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-[#178d95] text-sm font-medium text-white hover:bg-[#126b73] active:scale-[0.98] transition shadow-sm hover:shadow-md hover:-translate-y-1 duration-300"
          >
            ← Back
          </a>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${msgClass}`}>{msg}</div>
        )}

        {/* Upload */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm mb-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Category
              </label>
              <select
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#178d95] focus:border-[#178d95] shadow-sm hover:border-teal-300 hover:bg-teal-50 transition"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Title{" "}
                <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#178d95] focus:border-[#178d95] shadow-sm hover:border-teal-300 hover:bg-teal-50 transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blood Test - Feb"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                File
              </label>
              <label className="flex items-center h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition shadow-sm overflow-hidden">
                <span className="truncate">
                  {file ? file.name : "Choose file…"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                />
              </label>
              <p className="text-xs text-gray-400">
                Max 10MB • PDF/Image/DOC/DOCX
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={upload}
              className="px-6 py-2.5 rounded-xl bg-[#178d95] text-white text-sm font-semibold hover:bg-[#126b73] active:scale-[0.98] transition shadow-sm hover:shadow-md hover:-translate-y-1 duration-300"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* filter and search */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm px-5 py-4 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Filter
            </span>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 w-40 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#178d95] focus:border-[#178d95] shadow-sm hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or filename…"
              className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#178d95] focus:border-[#178d95] shadow-sm hover:border-teal-300 hover:bg-teal-50 transition"
            />

            {/* Clear */}
            <button
              onClick={() => {
                setSearch("");
                setFilterCategory("all");
              }}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-teal-50 hover:border-teal-300 active:scale-[0.98] transition shadow-sm whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">
              My Documents
            </div>
            <button
              onClick={loadDocs}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-teal-50 hover:border-teal-300 active:scale-[0.98] transition shadow-sm whitespace-nowrap"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <Spinner size={38} />
          ) : docs.length === 0 ? (
            <div className="text-sm text-gray-500">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((d) => (
                <div
                  key={d._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl ring-1 ring-gray-100 hover:ring-gray-200 transition"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {d.title || d.fileName || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {d.category} •{" "}
                      {d.fileSize
                        ? `${(d.fileSize / 1024).toFixed(1)} KB`
                        : "—"}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpen(d)}
                      className="px-3 py-2 rounded-xl bg-[#178d95] text-white text-sm hover:bg-[#126b73] transition"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => remove(d._id)}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition"
                    >
                      Delete (Hide)
                    </button>

                    <button
                      onClick={() => removePermanent(d._id)}
                      className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm hover:opacity-80 transition"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
