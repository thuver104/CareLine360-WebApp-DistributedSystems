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

  // Send email notification to doctor when status changes from PENDING to ACTIVE (verification)
  if (user.role === "doctor" && status === "ACTIVE" && user.email) {
    try {
      const verificationEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c5aa0; margin: 0;">🏥 CareLine360</h1>
              <h2 style="color: #28a745; margin: 10px 0;">🎉 Account Verified!</h2>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear Dr. ${user.fullName || 'Doctor'},</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #155724; margin-top: 0;">✅ Congratulations!</h3>
              <p style="font-size: 16px; color: #155724; line-height: 1.6; margin: 0;">Your doctor account has been successfully <strong>verified and activated</strong> by our admin team.</p>
            </div>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">You can now access all doctor features on the CareLine360 platform, including:</p>
            
            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <ul style="color: #2c5aa0; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">📅 <strong>Manage Appointments</strong> - View and handle patient consultations</li>
                <li style="margin: 8px 0;">🎥 <strong>Video Consultations</strong> - Conduct remote appointments</li>
                <li style="margin: 8px 0;">📝 <strong>Patient Records</strong> - Access and update medical records</li>
                <li style="margin: 8px 0;">📊 <strong>Dashboard Access</strong> - Full doctor portal functionality</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login to Your Account</a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Next Steps:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404; font-size: 14px;">
                <li>Complete your doctor profile with specialization and bio</li>
                <li>Set your availability schedule</li>
                <li>Review platform guidelines and policies</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-top: 20px;">If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="font-size: 14px; color: #6c757d; margin: 0;">Welcome to the CareLine360 family!<br><strong>CareLine360 Admin Team</strong></p>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `🎉 Your CareLine360 Doctor Account is Now Active!`,
        html: verificationEmailHtml
      });

    } catch (emailError) {
      console.error('Failed to send doctor verification email:', emailError);
      // Don't fail the main operation if email fails
    }
  }

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

