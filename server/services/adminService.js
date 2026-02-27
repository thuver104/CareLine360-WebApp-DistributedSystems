const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const EmergencyCase = require("../models/EmergencyCase");
const Appointment = require("../models/Appointment");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");

const sendStatusUpdateEmail = (user, newStatus) => {
  const email = user.email;
  const phone = user.phone;

  let emailSubject = "";
  let emailBody = "";
  let smsMessage = "";
  const isSuspended = newStatus === "SUSPENDED";
  const isActive = newStatus === "ACTIVE";
  const isRejected = newStatus === "REJECTED";

  if (isActive) {
    emailSubject = "Great News: Your CareLine360 account is now active";
    smsMessage = `Hello ${user.fullName}, Great News! Your CareLine360 account is now active. You can now login to the platform.`;
    if (user.role === "doctor") {
      // Detailed Doctor Activation Email
      if (email) {
        sendEmail({
          to: email,
          subject: `🎉 Your CareLine360 Doctor Account is Now Active!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2c5aa0; margin: 0;">🏥 CareLine360</h1>
                  <h2 style="color: #28a745; margin: 10px 0;">🎉 Account Verified!</h2>
                </div>
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear Dr. ${user.fullName || 'Doctor'},</p>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h3 style="color: #155724; margin-top: 0;">✅ Congratulations!</h3>
                  <p style="font-size: 16px; color: #155724; line-height: 1.6; margin: 0;">Your doctor account has been successfully <strong>verified and activated</strong>.</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login Now</a>
                </div>
              </div>
            </div>
          `
        }).catch(err => console.error("Doctor Activation Email Error:", err));
      } else if (phone) {
        sendSMS({ contact: phone, message: smsMessage });
      }
      return;
    }
    emailBody = `
      <h2 style="color: #10b981;">Account Activated</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your CareLine360 account has been successfully approved and activated.</p>
    `;
  } else if (isSuspended) {
    emailSubject = "Important: Your CareLine360 account has been suspended";
    smsMessage = `Hello ${user.fullName}, Important: Your CareLine360 account has been suspended by administration. Contact support for details.`;
    emailBody = `
      <h2 style="color: #ef4444;">Account Suspended</h2>
      <p>Hello ${user.fullName},</p>
      <p>We are writing to inform you that your CareLine360 account has been suspended by the administration.</p>
    `;
  } else if (isRejected) {
    emailSubject = "Update: Your CareLine360 registration request";
    smsMessage = `Hello ${user.fullName}, Updates regarding your CareLine360 registration: At this time we are unable to approve your request.`;
    emailBody = `
      <h2 style="color: #f59e0b;">Registration Update</h2>
      <p>Hello ${user.fullName}, At this time, we are unable to approve your registration request.</p>
    `;
  }

  if (email && emailBody) {
    sendEmail({
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          ${emailBody}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to CareLine360</a>
          </div>
        </div>
      `
    }).catch(err => console.error("Status Update Email Error:", err));
  } else if (!email && phone && smsMessage) {
    sendSMS({ contact: phone, message: smsMessage });
  }
};


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
  sendStatusUpdateEmail(user, newStatus);

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
  sendStatusUpdateEmail(user, status);

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

    // Send notifications to both patient and doctor in background
    const notifyUser = (user, type) => {
      const meetingMessage = `Your meeting is Confirm by Admin of CareLine 360. Link: ${meetingUrl}`;

      if (user.email) {
        const emailHtml = type === 'patient' ? patientEmailHtml : doctorEmailHtml;
        sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailHtml
        }).catch(err => console.error(`${type} Meeting Email Error:`, err));
      } else if (user.phone) {
        sendSMS({ contact: user.phone, message: meetingMessage });
      }
    };

    notifyUser(appt.patient, 'patient');
    notifyUser(appt.doctor, 'doctor');

    return { status: 200, data: appt };
  } catch (error) {
    console.error('Meeting Link Notification Error:', error);
    return { status: 500, data: { message: error.message } };
  }
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

