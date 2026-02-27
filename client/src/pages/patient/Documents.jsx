import { useEffect, useRef, useState } from "react";
import { api } from "../../api/axios";
import { motion } from "framer-motion";

export default function Documents() {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile]         = useState(null);
  const [title, setTitle]       = useState("");
  const [category, setCategory] = useState("other");

  const [msg, setMsg]         = useState("");
  const [msgType, setMsgType] = useState("");

  const fileRef = useRef(null);

  const categories = [
    { value: "lab_report",   label: "Lab Report" },
    { value: "prescription", label: "Prescription" },
    { value: "scan",         label: "Scan" },
    { value: "discharge",    label: "Discharge Summary" },
    { value: "other",        label: "Other" },
  ];

  const msgClass =
    msgType === "success"
      ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-1 ring-green-100 dark:ring-green-900/30"
      : msgType === "error"
      ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 ring-1 ring-red-100 dark:ring-red-900/30"
      : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/30";

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

  useEffect(() => {
    loadDocs();
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

  const inputCls = "w-full rounded-xl px-3 py-2 mt-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700 transition";

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload and manage your medical documents.
          </p>
        </div>
        <a
          href="/patient/dashboard"
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        >
          ← Back
        </a>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msgClass}`}>{msg}</div>}

      {/* Upload */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Upload New Document</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Category</label>
            <select
              className={inputCls}
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

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Title (optional)</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Blood Test - Feb"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">File</label>
            <input
              ref={fileRef}
              type="file"
              className="w-full mt-1 text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 dark:file:bg-teal-900/30 file:text-teal-700 dark:file:text-teal-400 hover:file:bg-teal-100 dark:hover:file:bg-teal-900/50 transition"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            />
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max 10MB • PDF/Image/DOC/DOCX
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={upload}
            className="px-5 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-700 text-white text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">My Documents</div>
          <button
            onClick={loadDocs}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900/50 transition bg-gray-50/50 dark:bg-slate-800/50"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {d.title || d.fileName || "Untitled"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {d.category} • {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "—"}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <a
                    href={d.viewUrl || d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-teal-600 dark:bg-teal-700 text-white text-sm hover:bg-teal-700 dark:hover:bg-teal-600 transition"
                  >
                    Open
                  </a>

                  <button
                    onClick={() => remove(d._id)}
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    Delete (Hide)
                  </button>

                  <button
                    onClick={() => removePermanent(d._id)}
                    className="px-3 py-2 rounded-xl bg-red-600 dark:bg-red-700 text-white text-sm hover:bg-red-700 dark:hover:bg-red-600 transition"
                  >
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
