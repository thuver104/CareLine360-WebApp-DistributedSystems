import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/axios";
import { motion } from "framer-motion";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

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
      { label: "Documents", href: "/patient/documents" },
      { label: "Medical History", href: "/patient/medical-history" },
      { label: "AI Chat", href: "/patient/messages" },
    ],
    []
  );

  const activePath = typeof window !== "undefined" ? window.location.pathname : "";

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
      const res = await api.get("/documents");
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
    loadDocs();
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ✅ supports different backend field names (in case it’s not avatarUrl)
  // const avatar = me?.avatarUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white bg-[url('/')] bg-cover bg-center p-6">
      {/* ✅ NAV BAR (copied style from dashboard) */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="w-9 h-9 rounded-full bg-gray-600/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-black" />
            </div>
            <span className="font-semibold text-gray-900">CareLine360</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            {navItems.map((item) => {
              const isActive = activePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    "relative py-1 transition-colors " +
                    (isActive ? "text-gray-900 font-medium" : "hover:text-gray-900")
                  }
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-2 h-[2px] bg-gray-900 rounded-full"
                    />
                  )}
                </a>
              );
            })}
          </div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button className="w-9 h-9 rounded-full bg-white shadow-xl grid place-items-center transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <span className="text-lg">🔔</span>
            </button>

            <a
              href="/patient/profile"
              className="w-10 h-10 rounded-full overflow-hidden shadow-xl transition-transform hover:scale-[1.05] active:scale-[0.98] border border-gray-200"
              title="Profile"
            >
              {me?.avatarUrl ? (
                <img
                  src={me.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // if URL broken, fallback to icon (no crash)
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">
                  👤
                </div>
              )}
            </a>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-black text-white text-sm shadow-xl hover:opacity-95 transition active:scale-[0.98]"
            >
              Logout
            </button>
          </motion.div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t bg-white/60">
          <div className="max-w-6xl mx-auto px-5 py-2 flex gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    "whitespace-nowrap px-3 py-2 rounded-full text-sm border transition " +
                    (isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 active:scale-[0.98]")
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

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
            className="px-4 py-2 rounded-xl bg-white ring-1 ring-gray-200 text-sm hover:bg-gray-50 transition"
          >
            Back
          </a>
        </div>

        {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msgClass}`}>{msg}</div>}

        {/* Upload */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm text-gray-600">Category</label>
              <select
                className="w-full rounded-xl px-3 py-2 ring-1 ring-gray-200 bg-white"
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

            <div className="md:col-span-1">
              <label className="text-sm text-gray-600">Title (optional)</label>
              <input
                className="w-full rounded-xl px-3 py-2 ring-1 ring-gray-200 bg-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blood Test - Feb"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-sm text-gray-600">File</label>
              <input
                ref={fileRef}
                type="file"
                className="w-full"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              />
              <div className="text-xs text-gray-500 mt-1">
                Max 10MB • PDF/Image/DOC/DOCX
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={upload}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:opacity-95 transition"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">My Documents</div>
            <button
              onClick={loadDocs}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-gray-500">No documents uploaded yet.</div>
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
                      {d.category} • {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "—"}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={d.viewUrl || d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm hover:opacity-95 transition"
                    >
                      Open
                    </a>

                    <button
                      onClick={() => remove(d._id)}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition"
                    >
                      Delete (Hide)
                    </button>

                    <button
                      onClick={() => removePermanent(d._id)}
                      className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm hover:opacity-95 transition"
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
