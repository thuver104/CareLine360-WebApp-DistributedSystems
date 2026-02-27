const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const EmergencyCase = require("../models/EmergencyCase");
const Appointment = require("../models/Appointment");


const listPendingDoctors = async () => {
  const doctors = await User.find({ role: "doctor", status: "PENDING", isActive: true }).select(
    "-passwordHash -refreshTokenHash"
  );
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
        as: "patientProfile"
      }
    },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "userId",
        as: "doctorProfile"
      }
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
                else: null
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        displayName: {
          $ifNull: ["$profile.fullName", { $ifNull: ["$fullName", "No Name"] }]
        }
      }
    },
    {
      $project: {
        passwordHash: 0,
        refreshTokenHash: 0,
        patientProfile: 0,
        doctorProfile: 0
      }
    }
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { displayName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } }
        ]
      }
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const countPipeline = [...pipeline, { $count: "total" }];
  const totalResults = await User.aggregate(countPipeline);
  const total = totalResults.length > 0 ? totalResults[0].total : 0;

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const users = await User.aggregate(pipeline);

  const mappedUsers = users.map(u => ({
    ...u,
    name: u.displayName === "No Name" ? (u.fullName || "No Name") : u.displayName,
    avatarUrl: u.profile?.avatarUrl || u.avatarUrl || ""
  }));

  return {
    status: 200,
    data: {
      users: mappedUsers,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  };
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  user.status = newStatus;
  await user.save();

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
  const resolvedEmergencies = await EmergencyCase.countDocuments({ status: "RESOLVED" });

  const avgResponseTimeResult = await EmergencyCase.aggregate([
    { $match: { status: "RESOLVED", responseTime: { $exists: true } } },
    { $group: { _id: null, avgTime: { $avg: "$responseTime" } } },
  ]);

  const avgResponseTime = avgResponseTimeResult.length > 0 ? Math.round(avgResponseTimeResult[0].avgTime) : 0;

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
    }
  };
};

const updateUserStatus = async ({ userId, status }) => {
  const allowed = ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"];
  if (!allowed.includes(status)) return { status: 400, data: { message: "Invalid status" } };

  const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select(
    "-passwordHash -refreshTokenHash"
  );
  if (!user) return { status: 404, data: { message: "User not found" } };

  return { status: 200, data: { message: "Status updated", user } };
};

const createUser = async (userData) => {
  const { email, phone, password, role, fullName } = userData;
  if (!email && !phone) return { status: 400, data: { message: "Email or phone required" } };

  const existing = await User.findOne(email ? { email: email.toLowerCase() } : { phone });
  if (existing) return { status: 409, data: { message: "User already exists" } };

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
      user: { id: user._id, role: user.role, email: user.email, phone: user.phone, status: user.status, fullName: user.fullName },
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
    { new: true }
  )
    .populate("patient", "fullName email phone")
    .populate("doctor", "fullName email phone specialty");

  if (!appt) return { status: 404, data: { message: "Appointment not found" } };

  return { status: 200, data: appt };
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
  createMeetingLink
};

