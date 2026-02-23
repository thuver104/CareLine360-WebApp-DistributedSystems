import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import PatientNavbar from "./PatientNavbar";

/**
 * Try to get name/email from whatever you saved at login.
 * Supports common keys: "user", "auth", "me", "profile"
 */
function getLoginIdentity() {
  const keys = ["user", "auth", "me", "profile"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);

      const email = obj?.email || obj?.user?.email || obj?.data?.email;
      const name =
        obj?.name ||
        obj?.fullName ||
        obj?.user?.name ||
        obj?.user?.fullName ||
        obj?.data?.name ||
        obj?.data?.fullName;

      if (email || name) return { name: name || "", email: email || "" };
    } catch {}
  }
  return { name: "", email: "" };
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" | "error" | ""
  const [errors, setErrors] = useState({});

  // ✅ Avatar (frontend-only)
  const [avatar, setAvatar] = useState(() => localStorage.getItem("patientAvatar") || "");
  const [avatarFile, setAvatarFile] = useState(null);

  // identity from login (localStorage)
  const [identity, setIdentity] = useState(() => getLoginIdentity());

  // profile form data (patient fields)
  const [form, setForm] = useState({
    fullName: "",
    email: "",

    dob: "",
    gender: "",
    nic: "",

    address: { district: "", city: "", line1: "" },
    emergencyContact: { name: "", phone: "", relationship: "" },

    bloodGroup: "",
    allergies: "",
    chronicConditions: "",
    heightCm: "",
    weightKg: "",
  });

  // ✅ Avatar picker
  const onPickAvatar = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // preview instantly
  setAvatar(URL.createObjectURL(file));

  try {
    const fd = new FormData();
    fd.append("avatar", file);

    const res = await api.patch("/patients/me/avatar", fd);

    setAvatar(res.data.avatarUrl); // final Cloudinary URL
    setMsgType("success");
    setMsg("✅ Profile photo updated");
  } catch (err) {
    setMsgType("error");
    setMsg(err.response?.data?.message || "Avatar upload failed");
  }
};


  const removeAvatar = () => {
    setAvatar("");
    setAvatarFile(null);
    localStorage.removeItem("patientAvatar");
  };

  // load profile
  useEffect(() => {
    const run = async () => {
      try {
        const login = getLoginIdentity();
        setIdentity(login);

        setForm((prev) => ({
          ...prev,
          fullName: login.name || prev.fullName,
          email: login.email || prev.email,
        }));

        const res = await api.get("/patients/me");
        const p = res.data;
        setAvatar(p.avatarUrl || "");

        setForm({
          fullName: p.fullName || login.name || "",
          email: p.email || login.email || "",

          dob: p.dob ? new Date(p.dob).toISOString().slice(0, 10) : "",
          gender: p.gender || "",
          nic: p.nic || "",

          address: {
            district: p.address?.district || "",
            city: p.address?.city || "",
            line1: p.address?.line1 || "",
          },

          emergencyContact: {
            name: p.emergencyContact?.name || "",
            phone: p.emergencyContact?.phone || "",
            relationship: p.emergencyContact?.relationship || "",
          },

          bloodGroup: p.bloodGroup || "",
          allergies: (p.allergies || []).join(", "),
          chronicConditions: (p.chronicConditions || []).join(", "),
          heightCm: p.heightCm ?? "",
          weightKg: p.weightKg ?? "",
        });
      } catch (e) {
        setMsgType("error");
        setMsg(e.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const profilePreview = useMemo(() => {
    const addr = [form.address?.line1, form.address?.city, form.address?.district]
      .filter(Boolean)
      .join(", ");

    return {
      name: form.fullName || identity.name || "Patient",
      email: form.email || identity.email || "—",
      dob: form.dob || "—",
      gender: form.gender || "—",
      nic: form.nic || "—",
      address: addr || "—",
      emergency: form.emergencyContact?.name
        ? `${form.emergencyContact.name} (${form.emergencyContact.relationship || "—"}) • ${form.emergencyContact.phone || "—"}`
        : "—",
      bloodGroup: form.bloodGroup || "—",
      height: form.heightCm !== "" ? `${form.heightCm} cm` : "—",
      weight: form.weightKg !== "" ? `${form.weightKg} kg` : "—",
      allergies: form.allergies?.trim() ? form.allergies : "—",
      conditions: form.chronicConditions?.trim() ? form.chronicConditions : "—",
    };
  }, [form, identity]);

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const updateNested = (path, value) => {
    setForm((prev) => {
      const copy = structuredClone(prev);
      const keys = path.split(".");
      let cur = copy;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return copy;
    });
    clearError(path);
  };

  const inputClass = (key) => {
    const base =
      "w-full rounded-xl px-3 py-2 outline-none transition bg-white " +
      "focus:ring-2 focus:ring-blue-200";
    return errors[key]
      ? base + " ring-1 ring-red-300 focus:ring-red-200"
      : base + " ring-1 ring-gray-200";
  };

  const validate = () => {
    const e = {};

    if (!form.fullName?.trim() || form.fullName.trim().length < 3) {
      e.fullName = "Name must be at least 3 characters";
    }

    if (form.dob) {
      const dobDate = new Date(form.dob);
      if (Number.isNaN(dobDate.getTime())) e.dob = "Invalid date";
      else if (dobDate > new Date()) e.dob = "DOB cannot be in the future";
    }

    if (form.gender && !["male", "female", "other"].includes(form.gender)) {
      e.gender = "Invalid gender";
    }

    if (form.nic) {
      const nic = form.nic.trim();
      const ok = /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
      if (!ok) e.nic = "NIC invalid (123456789V or 200012345678)";
    }

    if (form.emergencyContact.phone) {
      const p = form.emergencyContact.phone.replace(/\s+/g, "");
      const phoneOk = /^(?:\+94|0)?\d{9}$/.test(p);
      if (!phoneOk) e["emergencyContact.phone"] = "Phone number invalid";
    }

    if (form.bloodGroup) {
      const bgOk = /^(A|B|AB|O)[+-]$/i.test(form.bloodGroup.trim());
      if (!bgOk) e.bloodGroup = "Blood group must be like A+, O-, AB+";
    }

    if (form.heightCm !== "") {
      const h = Number(form.heightCm);
      if (Number.isNaN(h) || h < 30 || h > 250) e.heightCm = "Height must be 30–250 cm";
    }
    if (form.weightKg !== "") {
      const w = Number(form.weightKg);
      if (Number.isNaN(w) || w < 2 || w > 300) e.weightKg = "Weight must be 2–300 kg";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (!validate()) {
      setMsgType("error");
      setMsg("❌ Please fix the highlighted fields.");
      return;
    }

    try {
      const payload = {
        fullName: form.fullName || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        nic: form.nic || undefined,

        address: form.address,
        emergencyContact: form.emergencyContact,

        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies
          ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        chronicConditions: form.chronicConditions
          ? form.chronicConditions.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        heightCm: form.heightCm === "" ? undefined : Number(form.heightCm),
        weightKg: form.weightKg === "" ? undefined : Number(form.weightKg),
      };

      await api.patch("/patients/me", payload);

      setMsgType("success");
      setMsg("✅ Profile updated successfully.");
      setErrors({});
      setEditMode(false);
    } catch (e2) {
      setMsgType("error");
      setMsg(e2.response?.data?.message || "Update failed");
    }
  };

  const msgClass =
    msgType === "success"
      ? "bg-green-50 text-green-800 ring-1 ring-green-100"
      : msgType === "error"
      ? "bg-red-50 text-red-800 ring-1 ring-red-100"
      : "bg-blue-50 text-blue-800 ring-1 ring-blue-100";

  const ErrorText = ({ k }) =>
    errors[k] ? <p className="text-xs text-red-600 mt-1">{errors[k]}</p> : null;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white bg-[url('/')] bg-cover bg-center p-6">
      <PatientNavbar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              View your details. Click <b>Edit Profile</b> to update.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/patient/dashboard"
              className="px-4 py-2 rounded-xl bg-white ring-1 ring-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Back
            </a>

            {!editMode ? (
              <button
                onClick={() => {
                  setMsg("");
                  setMsgType("");
                  setEditMode(true);
                }}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-95 transition"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setMsg("");
                  setMsgType("");
                  setErrors({});
                  setEditMode(false);
                }}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm hover:opacity-95 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msgClass}`}>{msg}</div>}

        {/* ✅ Avatar card */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm mb-5">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center">
              {avatar ? (
                <img src={avatar || form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-500">Profile Photo</div>
              <div className="text-base font-semibold text-gray-900 mt-1">
                {form.fullName || "Patient"}
              </div>
              <div className="text-sm text-gray-600">{form.email || "—"}</div>

              {editMode && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer hover:opacity-95 transition">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPickAvatar}
                    />
                  </label>

                  {avatar && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200 transition"
                      onClick={removeAvatar}
                    >
                      Remove
                    </button>
                  )}

                  <div className="text-xs text-gray-500">JPG/PNG/WebP • Max 2MB</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VIEW MODE */}
        {!editMode && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">Full Name</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.name}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">Email</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.email}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">DOB / Gender</div>
              <div className="mt-1 text-base font-semibold text-gray-900">
                {profilePreview.dob} • {profilePreview.gender}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">NIC</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.nic}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm md:col-span-2">
              <div className="text-xs text-gray-500">Address</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.address}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm md:col-span-2">
              <div className="text-xs text-gray-500">Emergency Contact</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.emergency}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">Blood Group</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.bloodGroup}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm">
              <div className="text-xs text-gray-500">Height / Weight</div>
              <div className="mt-1 text-base font-semibold text-gray-900">
                {profilePreview.height} • {profilePreview.weight}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm md:col-span-2">
              <div className="text-xs text-gray-500">Allergies</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.allergies}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-100 shadow-sm md:col-span-2">
              <div className="text-xs text-gray-500">Chronic Conditions</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{profilePreview.conditions}</div>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <form onSubmit={onSave} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <input
                  className={inputClass("fullName")}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
                <ErrorText k="fullName" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email (readonly)</label>
                <input
                  className="w-full rounded-xl px-3 py-2 bg-gray-100 ring-1 ring-gray-200"
                  value={form.email}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">DOB</label>
                <input
                  type="date"
                  className={inputClass("dob")}
                  value={form.dob}
                  onChange={(e) => setField("dob", e.target.value)}
                />
                <ErrorText k="dob" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <select
                  className={inputClass("gender")}
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ErrorText k="gender" />
              </div>

              <div>
                <label className="text-sm text-gray-600">NIC</label>
                <input
                  className={inputClass("nic")}
                  value={form.nic}
                  onChange={(e) => setField("nic", e.target.value)}
                />
                <ErrorText k="nic" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">District</label>
                <input
                  className={inputClass("address.district")}
                  value={form.address.district}
                  onChange={(e) => updateNested("address.district", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">City</label>
                <input
                  className={inputClass("address.city")}
                  value={form.address.city}
                  onChange={(e) => updateNested("address.city", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Address line</label>
                <input
                  className={inputClass("address.line1")}
                  value={form.address.line1}
                  onChange={(e) => updateNested("address.line1", e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Emergency Name</label>
                <input
                  className={inputClass("emergencyContact.name")}
                  value={form.emergencyContact.name}
                  onChange={(e) => updateNested("emergencyContact.name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Emergency Phone</label>
                <input
                  className={inputClass("emergencyContact.phone")}
                  value={form.emergencyContact.phone}
                  onChange={(e) => updateNested("emergencyContact.phone", e.target.value)}
                />
                <ErrorText k="emergencyContact.phone" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Relationship</label>
                <input
                  className={inputClass("emergencyContact.relationship")}
                  value={form.emergencyContact.relationship}
                  onChange={(e) => updateNested("emergencyContact.relationship", e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Blood Group</label>
                <input
                  className={inputClass("bloodGroup")}
                  value={form.bloodGroup}
                  onChange={(e) => setField("bloodGroup", e.target.value)}
                />
                <ErrorText k="bloodGroup" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Height (cm)</label>
                <input
                  className={inputClass("heightCm")}
                  value={form.heightCm}
                  onChange={(e) => setField("heightCm", e.target.value)}
                />
                <ErrorText k="heightCm" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Weight (kg)</label>
                <input
                  className={inputClass("weightKg")}
                  value={form.weightKg}
                  onChange={(e) => setField("weightKg", e.target.value)}
                />
                <ErrorText k="weightKg" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Allergies (comma separated)</label>
                <input
                  className={inputClass("allergies")}
                  value={form.allergies}
                  onChange={(e) => setField("allergies", e.target.value)}
                  placeholder="Peanuts, Dust..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Chronic Conditions (comma separated)</label>
                <input
                  className={inputClass("chronicConditions")}
                  value={form.chronicConditions}
                  onChange={(e) => setField("chronicConditions", e.target.value)}
                  placeholder="Diabetes, Asthma..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:opacity-95 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setMsg("");
                  setMsgType("");
                  setErrors({});
                  setEditMode(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
