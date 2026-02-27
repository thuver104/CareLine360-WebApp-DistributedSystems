const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const EmergencyCase = require("../models/EmergencyCase");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const Appointment = require("../models/Appointment");

/**
 * Notify a user via email if available, otherwise via SMS.
 * Returns { method: 'email'|'sms'|'none', success: boolean }
 */
const notifyUser = async (user, { subject, html, smsText }) => {
  if (user.email) {
    try {
      await sendEmail({ to: user.email, subject, html });
      return { method: "email", success: true };
    } catch (err) {
      console.error("Email notification failed:", err.message);
      // Fall through to SMS if email fails and phone exists
      if (user.phone) {
        const result = await sendSMS({ to: user.phone, message: smsText });
        return { method: "sms", success: result.success };
      }
      return { method: "email", success: false };
    }
  } else if (user.phone) {
    const result = await sendSMS({ to: user.phone, message: smsText });
    return { method: "sms", success: result.success };
  }
  return { method: "none", success: false };
};

const listPendingDoctors = async () => {
  const doctors = await User.find({
    role: "doctor",
    status: "PENDING",
    isActive: true,
  }).select("-passwordHash -refreshTokenHash");
  return { status: 200, data: doctors };
};

const getAllUsers = async (page = 1, limit = 10, search = "", role = "all") => {
  const skip = (page - 1) * limit;

  const query = {};
  if (role !== "all") {
    query.role = role;
  }

  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "userId",
        as: "patientProfile",
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $addFields: {
        profile: {
          $cond: {
            if: { $eq: ["$role", "patient"] },
            then: { $arrayElemAt: ["$patientProfile", 0] },
            else: {
              $cond: {
                if: { $eq: ["$role", "doctor"] },
                then: { $arrayElemAt: ["$doctorProfile", 0] },
                else: null,
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        displayName: {
          $ifNull: ["$profile.fullName", { $ifNull: ["$fullName", "No Name"] }],
        },
      },
    },
    {
      $project: {
        passwordHash: 0,
        refreshTokenHash: 0,
        patientProfile: 0,
        doctorProfile: 0,
      },
    },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { displayName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const countPipeline = [...pipeline, { $count: "total" }];
  const totalResults = await User.aggregate(countPipeline);
  const total = totalResults.length > 0 ? totalResults[0].total : 0;

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const users = await User.aggregate(pipeline);

  const mappedUsers = users.map((u) => ({
    ...u,
    name: u.displayName === "No Name" ? u.fullName || "No Name" : u.displayName,
    avatarUrl: u.profile?.avatarUrl || u.avatarUrl || "",
  }));

  return {
    status: 200,
    data: {
      users: mappedUsers,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    },
  };
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  user.status = newStatus;
  await user.save();

  // Notify user about status change
  try {
    const statusLabel = newStatus === "ACTIVE" ? "activated" : "suspended";
    await notifyUser(user, {
      subject: `Account ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} - CareLine360`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h2 style="color:#fff;margin:0">CareLine360</h2>
          </div>
          <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <p>Dear <strong>${user.fullName || "User"}</strong>,</p>
            <p>Your CareLine360 account has been <strong style="color:${newStatus === "ACTIVE" ? "#059669" : "#dc2626"}">${statusLabel}</strong>.</p>
            ${newStatus === "ACTIVE" ? "<p>You can now log in and access all features.</p>" : "<p>If you believe this is a mistake, please contact our support team.</p>"}
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
            <p style="font-size:12px;color:#94a3b8">This is an automated notification from CareLine360.</p>
          </div>
        </div>
      `,
      smsText: `CareLine360: Your account has been ${statusLabel}. ${newStatus === "ACTIVE" ? "You can now log in." : "Contact support if you need help."}`,
    });
  } catch (err) {
    console.error("Status change notification error:", err.message);
  }

  return { status: 200, data: user };
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) return { status: 404, data: { message: "User not found" } };
  return { status: 200, data: { message: "User deleted successfully" } };
};

const getStats = async () => {
  const totalUsers = await User.countDocuments();
  const totalPatients = await User.countDocuments({ role: "patient" });
  const totalDoctors = await User.countDocuments({ role: "doctor" });
  const totalResponders = await User.countDocuments({ role: "responder" });

  const totalEmergencies = await EmergencyCase.countDocuments();
  const resolvedEmergencies = await EmergencyCase.countDocuments({
    status: "RESOLVED",
  });

  const avgResponseTimeResult = await EmergencyCase.aggregate([
    { $match: { status: "RESOLVED", responseTime: { $exists: true } } },
    { $group: { _id: null, avgTime: { $avg: "$responseTime" } } },
  ]);

  const avgResponseTime =
    avgResponseTimeResult.length > 0
      ? Math.round(avgResponseTimeResult[0].avgTime)
      : 0;

  const statusBreakdown = await EmergencyCase.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const emergencyStatusBreakdown = {
    PENDING: 0,
    DISPATCHED: 0,
    ARRIVED: 0,
    RESOLVED: 0,
  };

  statusBreakdown.forEach((item) => {
    if (emergencyStatusBreakdown.hasOwnProperty(item._id)) {
      emergencyStatusBreakdown[item._id] = item.count;
    }
  });

  // Monthly emergency history for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAgg = await EmergencyCase.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Build full 6-month range (including months with 0 cases)
  const monthlyHistory = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    const found = monthlyAgg.find(
      (m) => m._id.year === year && m._id.month === month,
    );
    monthlyHistory.push({
      name: monthNames[month - 1],
      count: found ? found.count : 0,
    });
  }

  return {
    status: 200,
    data: {
      totalUsers,
      totalPatients,
      totalDoctors,
      totalResponders,
      totalEmergencies,
      resolvedEmergencies,
      avgResponseTime,
      emergencyStatusBreakdown,
      monthlyHistory,
    },
  };
};

const updateUserStatus = async ({ userId, status }) => {
  const allowed = ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"];
  if (!allowed.includes(status))
    return { status: 400, data: { message: "Invalid status" } };

  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true },
  ).select("-passwordHash -refreshTokenHash");
  if (!user) return { status: 404, data: { message: "User not found" } };

  // Notify user about status change
  try {
    const statusMessages = {
      ACTIVE: {
        label: "activated",
        color: "#059669",
        msg: "You can now log in and access all features.",
      },
      SUSPENDED: {
        label: "suspended",
        color: "#dc2626",
        msg: "If you believe this is a mistake, please contact our support team.",
      },
      REJECTED: {
        label: "rejected",
        color: "#dc2626",
        msg: "Your application has been reviewed and was not approved. Contact support for details.",
      },
      PENDING: {
        label: "set to pending review",
        color: "#d97706",
        msg: "Your account is under review. We will notify you once it is processed.",
      },
    };
    const sm = statusMessages[status] || {
      label: status.toLowerCase(),
      color: "#64748b",
      msg: "",
    };

    await notifyUser(user, {
      subject: `Account ${sm.label.charAt(0).toUpperCase() + sm.label.slice(1)} - CareLine360`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h2 style="color:#fff;margin:0">CareLine360</h2>
          </div>
          <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <p>Dear <strong>${user.fullName || "User"}</strong>,</p>
            <p>Your CareLine360 account has been <strong style="color:${sm.color}">${sm.label}</strong>.</p>
            <p>${sm.msg}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
            <p style="font-size:12px;color:#94a3b8">This is an automated notification from CareLine360.</p>
          </div>
        </div>
      `,
      smsText: `CareLine360: Your account has been ${sm.label}. ${sm.msg}`,
    });
  } catch (err) {
    console.error("Status change notification error:", err.message);
  }

  return { status: 200, data: { message: "Status updated", user } };
};

const createUser = async (userData) => {
  const { email, phone, password, role, fullName } = userData;
  if (!email && !phone)
    return { status: 400, data: { message: "Email or phone required" } };

  const existing = await User.findOne(
    email ? { email: email.toLowerCase() } : { phone },
  );
  if (existing)
    return { status: 409, data: { message: "User already exists" } };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    role: role || "patient",
    status: "ACTIVE",
    fullName,
    email: email ? email.toLowerCase() : undefined,
    phone: phone || undefined,
    passwordHash,
  });

  return {
    status: 201,
    data: {
      message: "User created successfully",
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        status: user.status,
        fullName: user.fullName,
      },
    },
  };
};

const getAppointments = async () => {
  const appointments = await Appointment.find({})
    .populate("patient", "fullName email phone")
    .populate("doctor", "fullName email phone specialty")
    .sort({ createdAt: -1 });
  return { status: 200, data: appointments };
};

const createMeetingLink = async (appointmentId) => {
  const roomName = `CareLine360-${appointmentId}`;
  const meetingUrl = `https://meet.jit.si/${roomName}`;

  const appt = await Appointment.findByIdAndUpdate(
    appointmentId,
    { meetingUrl },
    { new: true },
  )
    .populate("patient", "fullName email phone")
    .populate("doctor", "fullName email phone specialty");

  if (!appt) return { status: 404, data: { message: "Appointment not found" } };

  // Notify patient & doctor about the meeting link
  const dateStr = new Date(appt.date).toLocaleDateString("en-US", {
    dateStyle: "long",
  });
  const meetingHtml = (name, role) => `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h2 style="color:#fff;margin:0">CareLine360</h2>
      </div>
      <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
        <p>Dear <strong>${name}</strong>,</p>
        <p>A meeting link has been generated for your upcoming appointment:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Date</td><td style="padding:8px;font-weight:bold">${dateStr}</td></tr>
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Time</td><td style="padding:8px;font-weight:bold">${appt.time}</td></tr>
          <tr><td style="padding:8px;color:#64748b;font-size:13px">${role === "patient" ? "Doctor" : "Patient"}</td><td style="padding:8px;font-weight:bold">${role === "patient" ? appt.doctor?.fullName : appt.patient?.fullName}</td></tr>
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Type</td><td style="padding:8px;font-weight:bold">${appt.consultationType}</td></tr>
        </table>
        <div style="text-align:center;margin:20px 0">
          <a href="${meetingUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Join Meeting</a>
        </div>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">Or copy this link: ${meetingUrl}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
        <p style="font-size:12px;color:#94a3b8">This is an automated notification from CareLine360.</p>
      </div>
    </div>
  `;
  const meetingSms = (name) =>
    `CareLine360: Hi ${name}, your appointment meeting link for ${dateStr} at ${appt.time} is ready. Join here: ${meetingUrl}`;

  // Notify patient
  try {
    if (appt.patient) {
      await notifyUser(
        {
          email: appt.patient.email,
          phone: appt.patient.phone,
          fullName: appt.patient.fullName,
        },
        {
          subject: "Meeting Link for Your Appointment - CareLine360",
          html: meetingHtml(appt.patient.fullName || "Patient", "patient"),
          smsText: meetingSms(appt.patient.fullName || "Patient"),
        },
      );
    }
  } catch (err) {
    console.error("Patient meeting notification error:", err.message);
  }

  // Notify doctor
  try {
    if (appt.doctor) {
      await notifyUser(
        {
          email: appt.doctor.email,
          phone: appt.doctor.phone,
          fullName: appt.doctor.fullName,
        },
        {
          subject: "Meeting Link for Patient Appointment - CareLine360",
          html: meetingHtml(appt.doctor.fullName || "Doctor", "doctor"),
          smsText: meetingSms(appt.doctor.fullName || "Doctor"),
        },
      );
    }
  } catch (err) {
    console.error("Doctor meeting notification error:", err.message);
  }

  return { status: 200, data: appt };
};

const updateUser = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) return { status: 404, data: { message: "User not found" } };

  // Update allowed fields on User model
  if (updates.fullName !== undefined) user.fullName = updates.fullName;
  if (updates.email !== undefined) user.email = updates.email.toLowerCase();
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.status !== undefined) user.status = updates.status;

  await user.save();

  // Also update name on linked profile if exists
  if (updates.fullName !== undefined) {
    if (user.role === "patient") {
      await Patient.findOneAndUpdate(
        { userId: user._id },
        { fullName: updates.fullName },
      );
    } else if (user.role === "doctor") {
      await Doctor.findOneAndUpdate(
        { userId: user._id },
        { fullName: updates.fullName },
      );
    }
  }

  return {
    status: 200,
    data: {
      message: "User updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    },
  };
};

const generateRandomPassword = (length = 12) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "@#$!%*?&";
  // Guarantee at least one from each category
  let password =
    upper[crypto.randomInt(upper.length)] +
    lower[crypto.randomInt(lower.length)] +
    digits[crypto.randomInt(digits.length)] +
    special[crypto.randomInt(special.length)];
  const all = upper + lower + digits + special;
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }
  // Shuffle
  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
};

const resetUserPassword = async (userId, customPassword) => {
  const user = await User.findById(userId);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const newPassword = customPassword || generateRandomPassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  let notificationMethod = "none";

  if (user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset — CareLine360",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:16px">
            <h2 style="color:#0f172a;margin-bottom:8px">Password Reset</h2>
            <p style="color:#64748b">Dear <strong>${user.fullName || "User"}</strong>,</p>
            <p style="color:#64748b">Your password has been reset by a CareLine360 administrator.</p>
            <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
              <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;font-weight:700">New Password</p>
              <p style="color:#0d9488;font-size:24px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace">${newPassword}</p>
            </div>
            <p style="color:#ef4444;font-size:13px;font-weight:600">Please change your password immediately after logging in.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:11px">This is an automated message from CareLine360. Do not reply.</p>
          </div>
        `,
      });
      notificationMethod = "email";
    } catch (err) {
      console.error("Failed to send password reset email:", err.message);
      notificationMethod = "email_failed";
    }
  } else if (user.phone) {
    // No SMS service — return password so admin can share manually
    notificationMethod = "manual_phone";
  }

  return {
    status: 200,
    data: {
      message: "Password reset successfully",
      newPassword,
      notificationMethod,
      userEmail: user.email || null,
      userPhone: user.phone || null,
    },
  };
};

// ─── Report Generation ──────────────────────────────────────
const generateReport = async ({ category, fromDate, toDate }) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);
  const dateFilter = { $gte: from, $lte: to };
  const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24));

  switch (category) {
    case "appointments": {
      const appointments = await Appointment.find({ date: dateFilter })
        .populate("patient", "fullName email")
        .populate("doctor", "fullName email")
        .lean();

      const total = appointments.length;
      const byStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
      const byType = {};
      const dailyMap = {};

      appointments.forEach((a) => {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
        byType[a.consultationType] = (byType[a.consultationType] || 0) + 1;
        const day = new Date(a.date).toISOString().slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      });

      const completionRate =
        total > 0 ? ((byStatus.completed / total) * 100).toFixed(1) : "0.0";
      const cancellationRate =
        total > 0 ? ((byStatus.cancelled / total) * 100).toFixed(1) : "0.0";

      const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      return {
        status: 200,
        data: {
          category: "appointments",
          period: { from: fromDate, to: toDate, days },
          summary: {
            totalAppointments: total,
            statusBreakdown: byStatus,
            consultationTypeBreakdown: byType,
            completionRate: `${completionRate}%`,
            cancellationRate: `${cancellationRate}%`,
          },
          dailyTrend,
          records: appointments.map((a) => ({
            id: a._id,
            date: a.date,
            time: a.time,
            patient: a.patient?.fullName || "N/A",
            doctor: a.doctor?.fullName || "N/A",
            type: a.consultationType,
            status: a.status,
            priority: a.priority,
          })),
        },
      };
    }

    case "emergencies": {
      const emergencies = await EmergencyCase.find({ createdAt: dateFilter })
        .populate("patient", "fullName email")
        .lean();

      const total = emergencies.length;
      const byStatus = { PENDING: 0, DISPATCHED: 0, ARRIVED: 0, RESOLVED: 0 };
      const responseTimes = [];

      emergencies.forEach((e) => {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
        if (e.responseTime) responseTimes.push(e.responseTime);
      });

      const avgResponse = responseTimes.length
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          )
        : 0;

      const resolved = byStatus.RESOLVED;
      const resolutionRate =
        total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";

      return {
        status: 200,
        data: {
          category: "emergencies",
          period: { from: fromDate, to: toDate, days },
          summary: {
            totalEmergencies: total,
            statusBreakdown: byStatus,
            avgResponseTimeMinutes: avgResponse,
            resolutionRate: `${resolutionRate}%`,
          },
          records: emergencies.map((e) => ({
            id: e._id,
            patient: e.patient?.fullName || "N/A",
            description: e.description,
            status: e.status,
            responseTime: e.responseTime || null,
            triggeredAt: e.triggeredAt,
            resolvedAt: e.resolvedAt || null,
          })),
        },
      };
    }

    case "patients": {
      const patients = await Patient.find({ createdAt: dateFilter }).lean();
      const genderDist = {};
      const bloodDist = {};
      const districtDist = {};
      const conditions = {};

      patients.forEach((p) => {
        if (p.gender) genderDist[p.gender] = (genderDist[p.gender] || 0) + 1;
        if (p.bloodGroup)
          bloodDist[p.bloodGroup] = (bloodDist[p.bloodGroup] || 0) + 1;
        const dist = p.address?.district;
        if (dist) districtDist[dist] = (districtDist[dist] || 0) + 1;
        (p.chronicConditions || []).forEach((c) => {
          conditions[c] = (conditions[c] || 0) + 1;
        });
      });

      return {
        status: 200,
        data: {
          category: "patients",
          period: { from: fromDate, to: toDate, days },
          summary: {
            totalPatients: patients.length,
            genderDistribution: genderDist,
            bloodGroupDistribution: bloodDist,
            districtDistribution: districtDist,
            topChronicConditions: Object.entries(conditions)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([name, count]) => ({ name, count })),
          },
        },
      };
    }

    case "doctors": {
      const doctors = await Doctor.find({ createdAt: dateFilter }).lean();
      const specDist = {};
      let totalRating = 0;
      let ratedCount = 0;
      let totalFee = 0;

      doctors.forEach((d) => {
        if (d.specialization)
          specDist[d.specialization] = (specDist[d.specialization] || 0) + 1;
        if (d.rating > 0) {
          totalRating += d.rating;
          ratedCount++;
        }
        totalFee += d.consultationFee || 0;
      });

      return {
        status: 200,
        data: {
          category: "doctors",
          period: { from: fromDate, to: toDate, days },
          summary: {
            totalDoctors: doctors.length,
            specializationDistribution: specDist,
            avgRating: ratedCount
              ? (totalRating / ratedCount).toFixed(1)
              : "0.0",
            avgConsultationFee: doctors.length
              ? Math.round(totalFee / doctors.length)
              : 0,
          },
        },
      };
    }

    case "trends": {
      // Monthly trends for the past year or custom range
      const monthlyEmergencies = await EmergencyCase.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const monthlyAppointments = await Appointment.aggregate([
        { $match: { date: dateFilter } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const monthlyUsers = await User.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const fmt = (arr) =>
        arr.map((m) => ({
          month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
          count: m.count,
        }));

      return {
        status: 200,
        data: {
          category: "trends",
          period: { from: fromDate, to: toDate, days },
          emergencyTrend: fmt(monthlyEmergencies),
          appointmentTrend: fmt(monthlyAppointments),
          userGrowthTrend: fmt(monthlyUsers),
        },
      };
    }

    default:
      return { status: 400, data: { message: "Invalid report category" } };
  }
};

module.exports = {
  listPendingDoctors,
  updateUserStatus,
  createUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments,
  createMeetingLink,
  updateUser,
  resetUserPassword,
  generateReport,
};
