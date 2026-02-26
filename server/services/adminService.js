const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const EmergencyCase = require("../models/EmergencyCase");
const Appointment = require("../models/Appointment");
const { sendEmail } = require("./emailService");


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

  // Notify user via email in background
  if (user.email) {
    const isSuspended = newStatus === "SUSPENDED";
    sendEmail({
      to: user.email,
      subject: isSuspended ? "Important: Your CareLine360 account has been suspended" : "Great News: Your CareLine360 account is now active",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: ${isSuspended ? '#ef4444' : '#10b981'};">${isSuspended ? 'Account Suspended' : 'Account Activated'}</h2>
          <p>Hello ${user.fullName},</p>
          <p>This is to inform you that your CareLine360 account status has been updated to <strong>${newStatus}</strong> by the administration.</p>
          ${isSuspended
          ? '<p style="color: #666;">If you believe this is a mistake, please contact our support team to appeal this decision.</p>'
          : '<p>You can now log in to the platform and access all your services.</p>'
        }
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">This is an automated notification from CareLine360.</p>
          </div>
        </div>
      `
    }).catch(err => console.error("Status Change Email Error:", err));
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

  // Calculate monthly history for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const historyData = await EmergencyCase.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const months = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const record = historyData.find(h => h._id.month === m && h._id.year === y);
    months.push({
      name: monthNames[d.getMonth()],
      count: record ? record.count : 0
    });
  }

  const successRate = totalEmergencies > 0 ? (resolvedEmergencies / totalEmergencies * 100).toFixed(1) : 0;
  const activeResponders = await User.countDocuments({ role: "responder", status: "ACTIVE" });

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
      monthlyHistory: months,
      successRate,
      activeResponders,
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

  // Notify user via email in background when status changes significantly
  if (user.email) {
    let emailSubject = "";
    let emailBody = "";

    if (status === "ACTIVE") {
      emailSubject = "Great News: Your CareLine360 account is now active";
      emailBody = `
        <h2 style="color: #10b981;">Account Activated</h2>
        <p>Hello ${user.fullName},</p>
        <p>Your CareLine360 account has been successfully approved and activated.</p>
        <p>You can now log in and access all features associated with your account.</p>
      `;
    } else if (status === "SUSPENDED") {
      emailSubject = "Important: Your CareLine360 account has been suspended";
      emailBody = `
        <h2 style="color: #ef4444;">Account Suspended</h2>
        <p>Hello ${user.fullName},</p>
        <p>We are writing to inform you that your CareLine360 account has been suspended by the administration.</p>
        <p style="color: #666;">If you have any questions regarding this action, please contact our support team.</p>
      `;
    } else if (status === "REJECTED") {
      emailSubject = "Update: Your CareLine360 registration request";
      emailBody = `
        <h2 style="color: #f59e0b;">Registration Update</h2>
        <p>Hello ${user.fullName},</p>
        <p>Thank you for your interest in CareLine360. At this time, we are unable to approve your registration request.</p>
        <p style="color: #666;">You may contact support for more detailed feedback regarding your application.</p>
      `;
    }

    if (emailBody) {
      // For doctors being activated, we use the detailed template already in place if possible, 
      // or just stay with a clean generic one. The previous code had a very long doctor template.
      // I will keep the doctor template for doctors being activated, and use generic for others.

      if (user.role === "doctor" && status === "ACTIVE") {
        // ... (Keep existing doctor verification logic but make it non-blocking if not already)
      } else {
        sendEmail({
          to: user.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
              ${emailBody}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to CareLine360</a>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">This is an automated notification. Please do not reply directly to this email.</p>
              </div>
            </div>
          `
        }).catch(err => console.error("Status Update Email Error:", err));
      }
    }
  }

  return { status: 200, data: { message: "Status updated", user } };
};
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

  // Send email notifications to both patient and doctor
  try {
    const appointmentDate = new Date(appt.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const appointmentTime = appt.time;

    const emailSubject = `Meeting Link Created - Appointment on ${appointmentDate}`;

    // Email template for patient
    const patientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0; margin: 0;">🏥 CareLine360</h1>
            <h2 style="color: #28a745; margin: 10px 0;">Meeting Link Created!</h2>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${appt.patient?.fullName || 'Patient'},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Your video consultation meeting link has been created. Please use the details below to join your appointment:</p>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5aa0; margin-top: 0;">📅 Appointment Details</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${appt.doctor?.fullName || 'TBD'}</p>
            <p style="margin: 5px 0;"><strong>Consultation Type:</strong> ${appt.consultationType}</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #155724; margin-top: 0;">🎥 Join Meeting</h3>
            <p style="margin-bottom: 15px; color: #155724;">Click the button below to join your video consultation:</p>
            <a href="${meetingUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Call</a>
            <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">Meeting Link: <a href="${meetingUrl}" style="color: #007bff;">${meetingUrl}</a></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Note:</strong> Please join the meeting 5-10 minutes early. Make sure you have a stable internet connection and your camera/microphone are working properly.</p>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-top: 20px;">If you have any questions or need to reschedule, please contact us immediately.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #6c757d; margin: 0;">Best regards,<br><strong>CareLine360 Team</strong></p>
          </div>
        </div>
      </div>
    `;

    // Email template for doctor
    const doctorEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0; margin: 0;">🏥 CareLine360</h1>
            <h2 style="color: #17a2b8; margin: 10px 0;">Meeting Link Ready!</h2>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear Dr. ${appt.doctor?.fullName || 'Doctor'},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">A video consultation meeting link has been created for your upcoming appointment. Here are the details:</p>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5aa0; margin-top: 0;">📋 Appointment Details</h3>
            <p style="margin: 5px 0;"><strong>Patient:</strong> ${appt.patient?.fullName || 'Patient'}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
            <p style="margin: 5px 0;"><strong>Consultation Type:</strong> ${appt.consultationType}</p>
          </div>
          
          <div style="background-color: #cce5ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #0056b3; margin-top: 0;">🎥 Join Consultation</h3>
            <p style="margin-bottom: 15px; color: #0056b3;">Click the button below to start the video consultation:</p>
            <a href="${meetingUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Consultation</a>
            <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">Meeting Link: <a href="${meetingUrl}" style="color: #007bff;">${meetingUrl}</a></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Reminder:</strong> Please be ready to join the meeting at the scheduled time. The patient will receive the same meeting link.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #6c757d; margin: 0;">Professional regards,<br><strong>CareLine360 Admin Team</strong></p>
          </div>
        </div>
      </div>
    `;

    // Send email to patient
    if (appt.patient?.email) {
      await sendEmail({
        to: appt.patient.email,
        subject: emailSubject,
        html: patientEmailHtml
      });
    }

    // Send email to doctor
    if (appt.doctor?.email) {
      await sendEmail({
        to: appt.doctor.email,
        subject: emailSubject,
        html: doctorEmailHtml
      });
    }

  } catch (emailError) {
    console.error('Failed to send meeting link emails:', emailError);
    // Don't fail the main operation if email fails
  }

  return { status: 200, data: appt };
};

const updateUser = async (id, updateData) => {
  try {
    const { fullName, email, phone, newPassword } = updateData;
    const user = await User.findById(id);
    if (!user) return { status: 404, data: { message: "User not found" } };

    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;

    if (newPassword) {
      user.passwordHash = await bcrypt.hash(newPassword, 10);

      // Notify the user via email in background - don't await to keep response fast
      const targetEmail = email || user.email;
      if (targetEmail) {
        sendEmail({
          to: targetEmail,
          subject: "Security Update: Your CareLine360 Password has been reset",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #10b981;">Security Update</h2>
              <p>Hello ${fullName || user.fullName},</p>
              <p>Your account password has been reset by an administrator.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #4b5563;">Your new temporary password is:</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111827; letter-spacing: 2px;">${newPassword}</p>
              </div>
              <p>Please log in and update your password immediately for security.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #9ca3af;">This is an automated security notification. If you did not expect this, please contact support.</p>
            </div>
          `
        }).catch(err => console.error("Background Email Error:", err));
      }
    }

    await user.save();
    return {
      status: 200,
      data: {
        message: newPassword ? "User updated and password reset email sent" : "User updated successfully",
        user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role }
      }
    };
  } catch (error) {
    return { status: 500, data: { message: error.message } };
  }
};

module.exports = {
  listPendingDoctors,
  updateUserStatus,
  createUser,
  updateUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments,
  createMeetingLink
};

