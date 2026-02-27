import { useEffect, useMemo, useState } from "react";
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

function safeStr(v) {
  return (v ?? "").toString().trim();
}
function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

function InfoRow({ label, value, link }) {
  const v = safeStr(value);
  if (!v) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-gray-900 underline underline-offset-4"
        >
          {v}
        </a>
      ) : (
        <div className="text-sm text-gray-900 text-right">{v}</div>
      )}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs px-3 py-2 rounded-full bg-gray-50 border border-gray-200">
      {children}
    </span>
  );
}

const Spinner = ({ size = 38, text = "Loading data..." }) => (
  <div className="flex flex-col items-center justify-center py-12 min-h-[60vh] gap-4">
    <div
      className="rounded-full border-4 border-gray-200 border-t-black animate-spin"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
    <div className="text-sm text-gray-500 animate-pulse">{text}</div>
  </div>
);

export default function Directory() {
  const [tab, setTab] = useState("hospitals"); // hospitals | doctors
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [err, setErr] = useState("");

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [q, setQ] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const [hRes, dRes] = await Promise.all([
          api.get("/patients/hospital"),
          api.get("/patients/doctor"),
        ]);

        const hList = normalizeList(hRes.data).sort((a, b) =>
          (a?.name || "").localeCompare(b?.name || ""),
        );
        const dList = normalizeList(dRes.data).sort((a, b) =>
          (a?.fullName || "").localeCompare(b?.fullName || ""),
        );

        setHospitals(hList);
        setDoctors(dList);

        setSelectedHospital(hList[0] || null);
        setSelectedDoctor(dList[0] || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load directory data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const openHospital = async (h) => {
    setSelectedHospital(h);
    setDetailLoading(true);
    setErr("");
    try {
      const id = h?._id || h?.id;
      const res = await api.get(`/patients/hospital/${id}`);
      setSelectedHospital(res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load hospital details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openDoctor = async (d) => {
    setSelectedDoctor(d);
    setDetailLoading(true);
    setErr("");
    try {
      const id = d?._id || d?.id;
      const res = await api.get(`/patients/doctor/${id}`);
      setSelectedDoctor(res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load doctor details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ✅ Hospital schema fields: name, address, contact, lat, lng
  const filteredHospitals = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return hospitals;
    return hospitals.filter((h) => {
      const hay = [h?.name, h?.address, h?.contact]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [hospitals, q]);

  const filteredDoctors = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return doctors;
    return doctors.filter((d) => {
      const hay = [
        d?.fullName,
        d?.specialization,
        d?.phone,
        d?.bio,
        (d?.qualifications || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [doctors, q]);

  const list = tab === "hospitals" ? filteredHospitals : filteredDoctors;
  const active = tab === "hospitals" ? selectedHospital : selectedDoctor;

  const title =
    tab === "hospitals"
      ? active?.name || "Hospital"
      : active?.fullName || "Doctor";
  const subtitle =
    tab === "hospitals"
      ? safeStr(active?.address)
        ? "Tap to view details"
        : ""
      : active?.specialization || "";

  // Hospital model has no avatarUrl, so always show emoji for hospitals
  const imageUrl = tab === "doctors" ? active?.avatarUrl || "" : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <PatientNavbar />

      <div className="max-w-7xl mx-auto mt-6">
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 shadow"
            >
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              Directory
            </h1>
            <p className="text-gray-600 mt-1">
              Hospitals and Doctors (click to view details)
            </p>
          </div>
          <a
            href="/patient/dashboard"
            className="px-4 py-2 rounded-full bg-black text-white text-sm shadow hover:opacity-95"
          >
            Back
          </a>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid lg:grid-cols-12 gap-5">
            {/* LEFT */}
            <motion.div
              className="lg:col-span-5 bg-white rounded-3xl shadow-sm p-5"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setTab("hospitals")}
                  className={
                    "flex-1 px-4 py-2 rounded-full text-sm border transition " +
                    (tab === "hospitals"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
                  }
                >
                  Hospitals
                </button>
                <button
                  onClick={() => setTab("doctors")}
                  className={
                    "flex-1 px-4 py-2 rounded-full text-sm border transition " +
                    (tab === "doctors"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
                  }
                >
                  Doctors
                </button>
              </div>

              <div className="mt-4">
                <input
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition"
                  placeholder={
                    tab === "hospitals"
                      ? "Search hospitals…"
                      : "Search doctors…"
                  }
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                {list.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                    No results.
                  </div>
                ) : tab === "hospitals" ? (
                  list.map((h) => {
                    const isActive =
                      String(selectedHospital?._id || "") ===
                      String(h?._id || "");
                    return (
                      <button
                        key={h?._id}
                        onClick={() => openHospital(h)}
                        className={
                          "w-full text-left p-4 rounded-3xl border transition " +
                          (isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-100 hover:shadow-sm bg-white")
                        }
                      >
                        <div className="text-sm font-semibold">
                          {h?.name || "Hospital"}
                        </div>
                        <div
                          className={
                            "text-xs mt-1 " +
                            (isActive ? "text-white/70" : "text-gray-500")
                          }
                        >
                          {h?.address ? h.address : "—"}
                        </div>
                        {h?.contact ? (
                          <div
                            className={
                              "text-xs mt-2 " +
                              (isActive ? "text-white/70" : "text-gray-600")
                            }
                          >
                            📞 {h.contact}
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  list.map((d) => {
                    const isActive =
                      String(selectedDoctor?._id || "") ===
                      String(d?._id || "");
                    return (
                      <button
                        key={d?._id}
                        onClick={() => openDoctor(d)}
                        className={
                          "w-full text-left p-4 rounded-3xl border transition " +
                          (isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-100 hover:shadow-sm bg-white")
                        }
                      >
                        <div className="text-sm font-semibold">
                          {d?.fullName || "Doctor"}
                        </div>
                        <div
                          className={
                            "text-xs mt-1 " +
                            (isActive ? "text-white/70" : "text-gray-500")
                          }
                        >
                          {d?.specialization || "—"}
                        </div>
                        {d?.phone ? (
                          <div
                            className={
                              "text-xs mt-2 " +
                              (isActive ? "text-white/70" : "text-gray-600")
                            }
                          >
                            📞 {d.phone}
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* RIGHT */}
            <motion.div
              className="lg:col-span-7 bg-white rounded-3xl shadow-sm p-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              {!active ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                  Select an item to view details.
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {tab === "hospitals" ? "🏥" : "👨‍⚕️"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {title}
                        </div>
                        {subtitle ? (
                          <div className="text-sm text-gray-600 mt-1">
                            {subtitle}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {detailLoading ? (
                      <div className="text-xs text-gray-500 mt-2">Loading…</div>
                    ) : (
                      <div
                        className={
                          "text-xs px-3 py-1 rounded-full border " +
                          (tab === "hospitals"
                            ? "bg-gray-50 border-gray-200 text-gray-700"
                            : "bg-blue-50 border-blue-100 text-blue-700")
                        }
                      >
                        {tab === "hospitals" ? "Hospital" : "Doctor"}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t pt-4">
                    {tab === "hospitals" ? (
                      <>
                        <InfoRow label="Name" value={active?.name} />
                        <InfoRow label="Address" value={active?.address} />
                        <InfoRow label="Contact" value={active?.contact} />
                        <InfoRow
                          label="Latitude"
                          value={active?.lat != null ? String(active.lat) : ""}
                        />
                        <InfoRow
                          label="Longitude"
                          value={active?.lng != null ? String(active.lng) : ""}
                        />

                        {/* Optional: show Google Maps link */}
                        {active?.lat != null && active?.lng != null ? (
                          <div className="mt-4">
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={`https://www.google.com/maps?q=${active.lat},${active.lng}`}
                              className="inline-flex px-4 py-2 rounded-2xl bg-black text-white text-sm hover:opacity-95"
                            >
                              Open in Maps
                            </a>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <InfoRow label="Doctor ID" value={active?.doctorId} />
                        <InfoRow label="Phone" value={active?.phone} />
                        <InfoRow
                          label="Specialization"
                          value={active?.specialization}
                        />
                        <InfoRow
                          label="Experience"
                          value={
                            active?.experience
                              ? `${active.experience} years`
                              : ""
                          }
                        />
                        <InfoRow
                          label="Consultation Fee"
                          value={
                            active?.consultationFee
                              ? `Rs. ${active.consultationFee}`
                              : ""
                          }
                        />
                        <InfoRow
                          label="Rating"
                          value={
                            active?.totalRatings
                              ? `${active.rating} (${active.totalRatings} reviews)`
                              : active?.rating
                                ? `${active.rating}`
                                : ""
                          }
                        />
                        <InfoRow
                          label="License No"
                          value={active?.licenseNumber}
                        />

                        {safeStr(active?.bio) ? (
                          <div className="mt-4 p-4 rounded-3xl bg-gray-50 border border-gray-100">
                            <div className="text-sm font-semibold text-gray-900">
                              Bio
                            </div>
                            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                              {active.bio}
                            </div>
                          </div>
                        ) : null}

                        {(active?.qualifications || []).length ? (
                          <div className="mt-4">
                            <div className="text-sm font-semibold text-gray-900">
                              Qualifications
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {active.qualifications.map((qq, idx) => (
                                <Tag key={idx}>{qq}</Tag>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {(active?.availabilitySlots || []).length ? (
                          <div className="mt-4">
                            <div className="text-sm font-semibold text-gray-900">
                              Availability
                            </div>
                            <div className="mt-2 grid sm:grid-cols-2 gap-2">
                              {active.availabilitySlots.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-gray-50 border border-gray-100"
                                >
                                  <div className="text-sm font-semibold text-gray-900">
                                    {s.day || "Day"}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {s.startTime || "—"} - {s.endTime || "—"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-6">
                          <a
                            href={`/appointments/book?doctorId=${active?._id}`}
                            className="inline-flex px-4 py-2 rounded-2xl bg-black text-white text-sm hover:opacity-95"
                          >
                            Book Appointment
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
