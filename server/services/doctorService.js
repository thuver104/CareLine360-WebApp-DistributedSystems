const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const Rating = require("../models/Rating");
const Patient = require("../models/Patient");
const Counter = require("../models/Counter");
const { uploadBase64Image, deleteCloudinaryFile } = require("./uploadService");

// ─── helpers ────────────────────────────────────────────────────────────────

const getNextDoctorId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "doctor" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `DOC-${String(counter.seq).padStart(6, "0")}`;
};

// ─── Profile ─────────────────────────────────────────────────────────────────

const createDoctorProfile = async ({
  userId,
  fullName,
  specialization,
  qualifications,
  experience,
  bio,
  licenseNumber,
  consultationFee,
  phone,
}) => {
  const existing = await Doctor.findOne({ userId });
  if (existing)
    return { status: 409, data: { message: "Doctor profile already exists" } };

  const user = await User.findById(userId);
  if (!user || user.role !== "doctor")
    return { status: 403, data: { message: "Not a doctor account" } };
  if (user.status !== "ACTIVE")
    return { status: 403, data: { message: "Account not approved yet" } };

  const doctorId = await getNextDoctorId();

  const doctor = await Doctor.create({
    userId,
    doctorId,
    fullName: fullName || "",
    specialization: specialization || "",
    qualifications: qualifications || [],
    experience: experience || 0,
    bio: bio || "",
    licenseNumber: licenseNumber || "",
    consultationFee: consultationFee || 0,
    phone: phone || "",
  });

  return { status: 201, data: { message: "Doctor profile created", doctor } };
};

const getDoctorProfile = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor)
    return {
      status: 404,
      data: {
        message: "Doctor profile not found. Please complete your profile.",
      },
    };
  return { status: 200, data: { doctor } };
};

// Hard-delete: permanently removes the Doctor profile and the User account.
// Medical records, appointments, and prescriptions are intentionally preserved for compliance.
const deactivateDoctorAccount = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor)
    return { status: 404, data: { message: "Doctor profile not found" } };

  // Permanently delete the doctor profile document
  await Doctor.findByIdAndDelete(doctor._id);

  // Permanently delete the user account
  await User.findByIdAndDelete(userId);

  return { status: 200, data: { message: "Account permanently deleted" } };
};

const updateDoctorProfile = async ({ userId, updates }) => {
  const allowed = [
    "fullName",
    "specialization",
    "qualifications",
    "experience",
    "bio",
    "licenseNumber",
    "consultationFee",
    "phone",
  ];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const doctor = await Doctor.findOneAndUpdate(
    { userId, isDeleted: false },
    { $set: sanitized },
    { new: true },
  );
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };
  return { status: 200, data: { message: "Profile updated", doctor } };
};

/**
 * Upload avatar from base64 string.
 * @param {string} userId
 * @param {string} base64Image - data URI string
 */
const updateAvatarBase64 = async ({ userId, base64Image }) => {
  if (!base64Image)
    return { status: 400, data: { message: "No image data provided" } };

  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  // Delete old avatar from Cloudinary if exists
  if (doctor.avatarPublicId) {
    await deleteCloudinaryFile(doctor.avatarPublicId, "image");
  }

  let uploaded;
  try {
    uploaded = await uploadBase64Image(base64Image, {
      folder: "careline360/avatars",
      maxSizeMB: 2,
      transformation: [
        { width: 512, height: 512, crop: "fill", quality: "auto:good" },
      ],
    });
  } catch (err) {
    return { status: 400, data: { message: err.message } };
  }

  doctor.avatarUrl = uploaded.url;
  doctor.avatarPublicId = uploaded.publicId;
  await doctor.save();

  return {
    status: 200,
    data: { message: "Avatar updated", avatarUrl: doctor.avatarUrl },
  };
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

const getDashboardStats = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor)
    return { status: 404, data: { message: "Doctor profile not found" } };

  const [
    totalAppointments,
    pendingAppointments,
    completedAppointments,
    todayAppointments,
    totalPatients,
    totalRecords,
  ] = await Promise.all([
    Appointment.countDocuments({ doctor: userId }),
    Appointment.countDocuments({ doctor: userId, status: "pending" }),
    Appointment.countDocuments({ doctor: userId, status: "completed" }),
    Appointment.countDocuments({
      doctor: userId,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Appointment.distinct("patient", { doctor: userId }),
    MedicalRecord.countDocuments({ doctorId: doctor._id, isDeleted: false }),
  ]);

  return {
    status: 200,
    data: {
      doctor: {
        id: doctor._id,
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        avatarUrl: doctor.avatarUrl,
        rating: doctor.rating,
        consultationFee: doctor.consultationFee,
      },
      stats: {
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        todayAppointments,
        totalPatients: totalPatients.length,
        totalRecords,
      },
    },
  };
};

// ─── Availability ────────────────────────────────────────────────────────────

const getAvailability = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false }).select(
    "availabilitySlots",
  );
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };
  return { status: 200, data: { slots: doctor.availabilitySlots } };
};

const addAvailabilitySlots = async ({ userId, slots }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const newSlots = slots.map((s) => ({
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    isBooked: false,
  }));

  doctor.availabilitySlots.push(...newSlots);
  await doctor.save();

  return {
    status: 201,
    data: { message: "Slots added", slots: doctor.availabilitySlots },
  };
};

const deleteAvailabilitySlot = async ({ userId, slotId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const slot = doctor.availabilitySlots.id(slotId);
  if (!slot) return { status: 404, data: { message: "Slot not found" } };
  if (slot.isBooked)
    return { status: 400, data: { message: "Cannot delete a booked slot" } };

  slot.deleteOne();
  await doctor.save();
  return {
    status: 200,
    data: { message: "Slot deleted", slots: doctor.availabilitySlots },
  };
};

const updateAvailabilitySlot = async ({
  userId,
  slotId,
  startTime,
  endTime,
}) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const slot = doctor.availabilitySlots.id(slotId);
  if (!slot) return { status: 404, data: { message: "Slot not found" } };
  if (slot.isBooked)
    return { status: 400, data: { message: "Cannot edit a booked slot" } };
  if (!startTime || !endTime)
    return {
      status: 400,
      data: { message: "startTime and endTime are required" },
    };
  if (startTime >= endTime)
    return {
      status: 400,
      data: { message: "End time must be after start time" },
    };

  slot.startTime = startTime;
  slot.endTime = endTime;
  await doctor.save();

  return {
    status: 200,
    data: { message: "Slot updated", slots: doctor.availabilitySlots },
  };
};

// ─── Appointments ─────────────────────────────────────────────────────────────

const getMyAppointments = async ({
  userId,
  status,
  date,
  dateFrom,
  dateTo,
  search,
  page = 1,
  limit = 10,
}) => {
  const query = { doctor: userId };
  if (status) query.status = status;

  // Range filter (dateFrom / dateTo) takes priority over legacy single date
  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom)
      query.date.$gte = new Date(new Date(dateFrom).setHours(0, 0, 0, 0));
    if (dateTo)
      query.date.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  } else if (date) {
    const d = new Date(date);
    query.date = {
      $gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let appointments = await Appointment.find(query)
    .populate({ path: "patient", select: "email phone" })
    .sort({ date: 1, time: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const patientUserIds = appointments
    .map((a) => a.patient?._id)
    .filter(Boolean);
  const patientProfiles = await Patient.find({
    userId: { $in: patientUserIds },
  })
    .select("userId fullName patientId avatarUrl")
    .lean();
  const profileMap = {};
  patientProfiles.forEach((p) => {
    profileMap[p.userId.toString()] = p;
  });

  appointments = appointments.map((a) => ({
    ...a,
    patientProfile: profileMap[a.patient?._id?.toString()] || null,
  }));

  if (search) {
    const q = search.toLowerCase();
    appointments = appointments.filter((a) =>
      a.patientProfile?.fullName?.toLowerCase().includes(q),
    );
  }

  const total = await Appointment.countDocuments(query);

  return {
    status: 200,
    data: {
      appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  };
};

const updateAppointmentStatus = async ({
  userId,
  appointmentId,
  status,
  notes,
}) => {
  const validStatuses = ["confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(status))
    return { status: 400, data: { message: "Invalid status" } };

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: userId,
  });
  if (!appointment)
    return { status: 404, data: { message: "Appointment not found" } };

  appointment.status = status;
  if (notes) appointment.notes = notes;
  await appointment.save();

  return {
    status: 200,
    data: { message: "Appointment status updated", appointment },
  };
};

const deleteAppointment = async ({ userId, appointmentId }) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: userId,
  });
  if (!appointment)
    return { status: 404, data: { message: "Appointment not found" } };

  await Appointment.findByIdAndDelete(appointmentId);
  return { status: 200, data: { message: "Appointment deleted successfully" } };
};

// ─── My Patients ──────────────────────────────────────────────────────────────

const getMyPatients = async ({ userId, search, page = 1, limit = 6 }) => {
  const mongoose = require("mongoose");
  const doctorObjId = new mongoose.Types.ObjectId(userId);

  // ── Step 1: Aggregate appointment stats per unique booker ────────────────
  // Starting from Appointments guarantees every user who ever booked appears,
  // even if they have no Patient profile document.
  const allStats = await Appointment.aggregate([
    { $match: { doctor: doctorObjId } },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$patient", // patient User._id
        appointmentCount: { $sum: 1 },
        lastVisit: { $max: "$date" },
        lastAppointmentId: { $first: "$_id" },
      },
    },
  ]);

  const patientUserIds = allStats.map((s) => s._id);

  // ── Step 2: Enrich with User records (email, phone) ──────────────────────
  const users = await User.find({ _id: { $in: patientUserIds } })
    .select("email phone")
    .lean();
  const userMap = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = u;
  });

  // ── Step 3: Enrich with Patient profile (fullName, patientId, avatarUrl) ─
  const profiles = await Patient.find({
    userId: { $in: patientUserIds },
    isDeleted: false,
  })
    .select("userId fullName patientId avatarUrl")
    .lean();
  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[(p.userId?._id || p.userId).toString()] = p;
  });

  // ── Step 4: Merge into unified list ──────────────────────────────────────
  let merged = allStats.map((s) => {
    const uid = s._id.toString();
    const profile = profileMap[uid] || {};
    const user = userMap[uid] || {};
    return {
      // Patient document _id — null if no profile (Records/Rx will be disabled)
      _id: profile._id || null,
      // Keep userId as a sub-object so existing frontend code works unchanged
      userId: {
        _id: s._id,
        email: user.email || "",
        phone: user.phone || "",
      },
      fullName: profile.fullName || user.email || "Unknown Patient",
      patientId: profile.patientId || null,
      avatarUrl: profile.avatarUrl || null,
      appointmentCount: s.appointmentCount,
      lastVisit: s.lastVisit || null,
      lastAppointmentId: s.lastAppointmentId || null,
    };
  });

  // ── Step 5: Search filter (handles users with or without profiles) ────────
  if (search) {
    const rx = new RegExp(search, "i");
    merged = merged.filter(
      (p) =>
        rx.test(p.fullName) ||
        rx.test(p.patientId || "") ||
        rx.test(p.userId?.email || ""),
    );
  }

  // Sort: most recent booker first
  merged.sort((a, b) => {
    if (!a.lastVisit) return 1;
    if (!b.lastVisit) return -1;
    return new Date(b.lastVisit) - new Date(a.lastVisit);
  });

  // ── Step 6: Paginate in-memory ────────────────────────────────────────────
  const total = merged.length;
  const skip = (Number(page) - 1) * Number(limit);
  const paginated = merged.slice(skip, skip + Number(limit));

  return {
    status: 200,
    data: {
      patients: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    },
  };
};

const getPatientDetail = async ({ userId, patientDbId }) => {
  const patient = await Patient.findById(patientDbId)
    .populate("userId", "email phone isVerified")
    .lean();
  if (!patient) return { status: 404, data: { message: "Patient not found" } };

  const hasAppointment = await Appointment.exists({
    doctor: userId,
    patient: patient.userId,
  });
  if (!hasAppointment)
    return {
      status: 403,
      data: { message: "No appointment with this patient" },
    };

  const appointments = await Appointment.find({
    doctor: userId,
    patient: patient.userId,
  })
    .sort({ date: -1 })
    .lean();
  const records = await MedicalRecord.find({
    patientId: patientDbId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  return { status: 200, data: { patient, appointments, records } };
};

// ─── Medical Records ──────────────────────────────────────────────────────────

const createMedicalRecord = async ({ userId, data }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor)
    return { status: 404, data: { message: "Doctor profile not found" } };

  const {
    patientId,
    appointmentId,
    chiefComplaint,
    diagnosis,
    notes,
    vitals,
    prescriptions,
  } = data;

  const patient = await Patient.findById(patientId);
  if (!patient) return { status: 404, data: { message: "Patient not found" } };

  const record = await MedicalRecord.create({
    doctorId: doctor._id,
    patientId,
    appointmentId: appointmentId || null,
    chiefComplaint: chiefComplaint || "",
    diagnosis: diagnosis || "",
    notes: notes || "",
    vitals: vitals || {},
    prescriptions: prescriptions || [],
  });

  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, { status: "completed" });
  }

  return { status: 201, data: { message: "Medical record created", record } };
};

const getMedicalRecordsByPatient = async ({
  userId,
  patientId,
  page = 1,
  limit = 10,
}) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await MedicalRecord.countDocuments({
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  });
  const records = await MedicalRecord.find({
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    status: 200,
    data: {
      records,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  };
};

const updateMedicalRecord = async ({ userId, recordId, updates }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const allowed = [
    "chiefComplaint",
    "diagnosis",
    "notes",
    "vitals",
    "prescriptions",
  ];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const record = await MedicalRecord.findOneAndUpdate(
    { _id: recordId, doctorId: doctor._id, isDeleted: false },
    { $set: sanitized },
    { new: true },
  );
  if (!record) return { status: 404, data: { message: "Record not found" } };
  return { status: 200, data: { message: "Record updated", record } };
};

// ─── Prescriptions ────────────────────────────────────────────────────────────

const savePrescription = async ({ userId, data }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const { medicalRecordId, patientId, medicines, notes, fileUrl, publicId } =
    data;

  const prescription = await Prescription.create({
    medicalRecordId: medicalRecordId || null,
    doctorId: doctor._id,
    patientId,
    medicines: medicines || [],
    notes: notes || "",
    fileUrl: fileUrl || "",
    publicId: publicId || "",
    sentToPatient: !!fileUrl,
    sentAt: fileUrl ? new Date() : null,
  });

  return { status: 201, data: { message: "Prescription saved", prescription } };
};

const getMyPrescriptions = async ({
  userId,
  patientId,
  page = 1,
  limit = 10,
}) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const query = { doctorId: doctor._id };
  if (patientId) query.patientId = patientId;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Prescription.countDocuments(query);
  const prescriptions = await Prescription.find(query)
    .populate({ path: "patientId", select: "fullName patientId avatarUrl" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    status: 200,
    data: {
      prescriptions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  };
};

// ─── Ratings ──────────────────────────────────────────────────────────────────

const getMyRatings = async ({ userId, page = 1, limit = 10 }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Rating.countDocuments({ doctorId: doctor._id });
  const ratings = await Rating.find({ doctorId: doctor._id })
    .populate({ path: "patientId", select: "fullName avatarUrl" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    status: 200,
    data: {
      averageRating: doctor.rating,
      totalRatings: doctor.totalRatings,
      ratings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  };
};

// ─── Public Doctor List ───────────────────────────────────────────────────────

const getPublicDoctors = async ({
  specialization,
  search,
  page = 1,
  limit = 10,
}) => {
  const activeUsers = await User.find({
    role: "doctor",
    status: "ACTIVE",
    isActive: true,
  })
    .select("_id")
    .lean();
  const activeUserIds = activeUsers.map((u) => u._id);

  const query = { isDeleted: false, userId: { $in: activeUserIds } };
  if (specialization)
    query.specialization = { $regex: specialization, $options: "i" };
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { specialization: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Doctor.countDocuments(query);
  const doctors = await Doctor.find(query)
    .select(
      "fullName specialization experience bio rating totalRatings consultationFee avatarUrl doctorId",
    )
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    status: 200,
    data: {
      doctors,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  };
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getDoctorAnalytics = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  if (!doctor) return { status: 404, data: { message: "Doctor not found" } };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Build last-6-months labels + ranges for monthly trend chart
  const monthlyRanges = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });

  // All countDocuments queries — Mongoose auto-casts userId string → ObjectId
  const [
    totalAppointments,
    pendingAppointments,
    completedAppointments,
    cancelledAppointments,
    confirmedAppointments,
    totalPatientsArr,
    thisMonthAppointments,
    lastMonthAppointments,
    ...monthlyCountsRaw
  ] = await Promise.all([
    Appointment.countDocuments({ doctor: userId }),
    Appointment.countDocuments({ doctor: userId, status: "pending" }),
    Appointment.countDocuments({ doctor: userId, status: "completed" }),
    Appointment.countDocuments({ doctor: userId, status: "cancelled" }),
    Appointment.countDocuments({ doctor: userId, status: "confirmed" }),
    Appointment.distinct("patient", { doctor: userId }),
    Appointment.countDocuments({
      doctor: userId,
      createdAt: { $gte: startOfMonth },
    }),
    Appointment.countDocuments({
      doctor: userId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
    ...monthlyRanges.map((r) =>
      Appointment.countDocuments({
        doctor: userId,
        createdAt: { $gte: r.start, $lte: r.end },
      }),
    ),
  ]);

  // Build appointmentsByStatus from the reliable countDocuments results
  const appointmentsByStatus = [
    { _id: "pending", count: pendingAppointments },
    { _id: "confirmed", count: confirmedAppointments },
    { _id: "completed", count: completedAppointments },
    { _id: "cancelled", count: cancelledAppointments },
  ].filter((s) => s.count > 0);

  const monthlyTrend = monthlyRanges.map((r, i) => ({
    month: r.label,
    count: monthlyCountsRaw[i] || 0,
  }));

  const completionRate =
    totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

  return {
    status: 200,
    data: {
      stats: {
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        confirmedAppointments,
        totalPatients: totalPatientsArr.length,
        completionRate,
      },
      doctor: {
        rating: doctor.rating,
        totalRatings: doctor.totalRatings,
      },
      thisMonthAppointments,
      lastMonthAppointments,
      appointmentsByStatus,
      monthlyTrend,
    },
  };
};

module.exports = {
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
  updateAvatarBase64,
  getDashboardStats,
  getAvailability,
  addAvailabilitySlots,
  deleteAvailabilitySlot,
  updateAvailabilitySlot,
  getMyAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getMyPatients,
  getPatientDetail,
  createMedicalRecord,
  getMedicalRecordsByPatient,
  updateMedicalRecord,
  savePrescription,
  getMyPrescriptions,
  getMyRatings,
  getPublicDoctors,
  getDoctorAnalytics,
  deactivateDoctorAccount,
};
