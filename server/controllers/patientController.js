const Patient = require("../models/Patient");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Document = require("../models/Document");
const { calcPatientProfileStrength } = require("../services/profileStrength");
const { generateReport } = require("../services/reportService");

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const patient = await Patient.findOne({ userId ,  $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],});
    if (!patient) return res.status(404).json({ message: "Profile not found" });

    const user = await User.findById(userId).select("email isVerified role");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Document count (for now no doc module => 0)
    const docsCount = 0;

    const profileStrength = calcPatientProfileStrength({ patient, docsCount });

    // optional: store latest score in DB
    if (patient.profileStrength !== profileStrength.score) {
      patient.profileStrength = profileStrength.score;
      await patient.save();
    }

    return res.json({
      fullName: patient.fullName,
      patientId: patient.patientId,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,

      avatarUrl: patient.avatarUrl,

      dob: patient.dob,
      gender: patient.gender,
      address: patient.address,
      nic: patient.nic,
      emergencyContact: patient.emergencyContact,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,

      profileStrength, // ✅ includes score + breakdown + missing
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ---------------- VALIDATION ----------------
    const {
      dob,
      gender,
      nic,
      address,
      emergencyContact,
      heightCm,
      weightKg,
      bloodGroup,
      allergies,
      chronicConditions,
      fullName,
    } = req.body;

    // fullName basic check (optional)
    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 3) {
        return res.status(400).json({ message: "Full name must be at least 3 characters" });
      }
    }

    // DOB validation
    if (dob !== undefined && dob !== null && dob !== "") {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }
      if (d > new Date()) {
        return res.status(400).json({ message: "DOB cannot be in the future" });
      }
    }

    // Gender validation
    if (gender !== undefined) {
      const allowed = ["male", "female", "other", ""];
      if (!allowed.includes(gender)) {
        return res.status(400).json({ message: "Invalid gender value" });
      }
    }

    // NIC validation (Sri Lanka: 9 digits + V/X or 12 digits)
    if (nic !== undefined && nic !== null && nic !== "") {
      const nicStr = String(nic).trim();
      const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (!nicRegex.test(nicStr)) {
        return res.status(400).json({ message: "Invalid NIC format (123456789V or 200012345678)" });
      }
    }

    // Address validation (if provided)
    if (address !== undefined) {
      if (typeof address !== "object" || Array.isArray(address)) {
        return res.status(400).json({ message: "Address must be an object" });
      }
      if (address.city !== undefined && String(address.city).trim().length === 0) {
        return res.status(400).json({ message: "City cannot be empty" });
      }
      if (address.district !== undefined && String(address.district).trim().length === 0) {
        return res.status(400).json({ message: "District cannot be empty" });
      }
      if (address.line1 !== undefined && String(address.line1).trim().length === 0) {
        return res.status(400).json({ message: "Address line cannot be empty" });
      }
    }

    // Emergency contact validation (if provided)
    if (emergencyContact !== undefined) {
      if (typeof emergencyContact !== "object" || Array.isArray(emergencyContact)) {
        return res.status(400).json({ message: "Emergency contact must be an object" });
      }

      if (emergencyContact.phone !== undefined && emergencyContact.phone !== null && emergencyContact.phone !== "") {
        const p = String(emergencyContact.phone).replace(/\s+/g, "");
        // basic Sri Lanka-ish pattern: allow +94 / 0 / plain 9–10 digits
        const phoneRegex = /^(?:\+94|0)?\d{9}$/;
        if (!phoneRegex.test(p)) {
          return res.status(400).json({ message: "Invalid emergency phone number" });
        }
      }
    }

    // Blood group validation
    if (bloodGroup !== undefined && bloodGroup !== null && bloodGroup !== "") {
      const bg = String(bloodGroup).trim();
      const bgRegex = /^(A|B|AB|O)[+-]$/i;
      if (!bgRegex.test(bg)) {
        return res.status(400).json({ message: "Invalid blood group (A+, O-, AB+)" });
      }
    }

    // Arrays validation
    if (allergies !== undefined && !Array.isArray(allergies)) {
      return res.status(400).json({ message: "Allergies must be an array" });
    }
    if (chronicConditions !== undefined && !Array.isArray(chronicConditions)) {
      return res.status(400).json({ message: "Chronic conditions must be an array" });
    }

    // Height/Weight validation
    if (heightCm !== undefined) {
      const h = Number(heightCm);
      if (Number.isNaN(h) || h < 30 || h > 250) {
        return res.status(400).json({ message: "Height must be between 30 and 250 cm" });
      }
    }
    if (weightKg !== undefined) {
      const w = Number(weightKg);
      if (Number.isNaN(w) || w < 2 || w > 300) {
        return res.status(400).json({ message: "Weight must be between 2 and 300 kg" });
      }
    }
    // ---------------- END VALIDATION ----------------

    const update = {};

    // Basic fields
    if (req.body.fullName !== undefined) update.fullName = req.body.fullName;
    if (req.body.dob !== undefined) update.dob = req.body.dob;
    if (req.body.gender !== undefined) update.gender = req.body.gender;
    if (req.body.nic !== undefined) update.nic = req.body.nic;

    // Nested address
    if (req.body.address) {
      update["address.district"] = req.body.address.district;
      update["address.city"] = req.body.address.city;
      update["address.line1"] = req.body.address.line1;
    }

    // Nested emergency contact
    if (req.body.emergencyContact) {
      update["emergencyContact.name"] = req.body.emergencyContact.name;
      update["emergencyContact.phone"] = req.body.emergencyContact.phone;
      update["emergencyContact.relationship"] = req.body.emergencyContact.relationship;
    }

    // Medical
    if (req.body.bloodGroup !== undefined) update.bloodGroup = req.body.bloodGroup;
    if (req.body.allergies !== undefined) update.allergies = req.body.allergies;
    if (req.body.chronicConditions !== undefined) update.chronicConditions = req.body.chronicConditions;
    if (req.body.heightCm !== undefined) update.heightCm = req.body.heightCm;
    if (req.body.weightKg !== undefined) update.weightKg = req.body.weightKg;

    const patient = await Patient.findOneAndUpdate(
      {
        userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ message: "Profile not found" });

    return res.json({ message: "Profile updated successfully", patient });
  } catch (e) {
    if (e?.name === "ValidationError") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    console.log("AVATAR upload hit ✅");
    console.log("req.file =", req.file); // ✅ add this

    const userId = req.user.userId;

    if (!req.file?.path) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // multer-storage-cloudinary gives secure URL in req.file.path
    const avatarUrl = req.file.path;
    console.log("avatarUrl =", avatarUrl); // ✅ add this

    const patient = await Patient.findOneAndUpdate(
      { userId , $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }], },
      { $set: { avatarUrl }  },
      { returnDocument: "after", runValidators: true }
    );

    if (!patient) return res.status(404).json({ message: "Profile not found" });

    return res.json({ message: "Avatar updated", avatarUrl });
  } catch (e) {
    console.error("UPLOAD AVATAR ERROR ❌", e);
    return res.status(500).json({ message: "Server error" });
  }
};

const getPatientStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get patient profile
    const patient = await Patient.findOne({ 
      userId, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Get appointment statistics
    const appointments = await Appointment.find({ patient: userId });
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const upcomingAppointments = appointments.filter(apt => {
      return apt.status === 'confirmed' && new Date(apt.date) > new Date();
    }).length;

    // Get document count
    const totalDocuments = await Document.countDocuments({ userId });

    // Get recent activity (last 5 appointments)
    const recentActivity = appointments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(apt => ({
        title: `Appointment with Dr. ${apt.doctor?.fullName || 'TBD'}`,
        description: `${apt.consultationType} consultation - ${apt.status}`,
        date: new Date(apt.date).toLocaleDateString()
      }));

    const profileStrength = calcPatientProfileStrength({ 
      patient, 
      docsCount: totalDocuments 
    });

    const stats = {
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      totalDocuments,
      profileStrength: profileStrength.score,
      recentActivity
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get patient stats error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};

const generatePatientReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format, dateRange } = req.body;
    
    if (!format || !dateRange) {
      return res.status(400).json({ 
        success: false, 
        message: 'Format and date range are required' 
      });
    }

    // Get patient data for the report
    const patient = await Patient.findOne({ 
      userId, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).populate('userId');
    
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);

    // Get appointments in date range
    const appointments = await Appointment.find({
      patient: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('doctor', 'fullName specialty');

    // Get documents in date range
    const documents = await Document.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Prepare report data
    const reportData = {
      patient: {
        ...patient.toObject(),
        user: patient.userId
      },
      appointments,
      documents,
      summary: {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        totalDocuments: documents.length,
        profileStrength: calcPatientProfileStrength({ patient, docsCount: documents.length }).score
      }
    };

    // Generate the report using the existing report service
    const reportBuffer = await generatePatientHealthReport({
      reportData,
      format,
      dateRange
    });

    // Set appropriate headers for file download
    let filename = `my_health_report_${dateRange.from}_to_${dateRange.to}`;
    let contentType = 'application/octet-stream';

    switch (format) {
      case 'pdf':
        filename += '.pdf';
        contentType = 'application/pdf';
        break;
      case 'excel':
        filename += '.xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        filename += '.csv';
        contentType = 'text/csv';
        break;
      default:
        filename += '.txt';
        contentType = 'text/plain';
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(reportBuffer);

  } catch (error) {
    console.error('Patient report generation error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper function for patient-specific report generation
const generatePatientHealthReport = async ({ reportData, format, dateRange }) => {
  const PDFDocument = require('pdfkit');
  const ExcelJS = require('exceljs');

  switch (format) {
    case 'pdf':
      return await generatePatientPDFReport(reportData, dateRange);
    case 'excel':
      return await generatePatientExcelReport(reportData, dateRange);
    case 'csv':
      return await generatePatientCSVReport(reportData, dateRange);
    default:
      throw new Error('Unsupported report format');
  }
};

const generatePatientPDFReport = async (data, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold')
         .fillColor('#2563eb')
         .text('My Health Report', 50, 50);

      doc.fontSize(14).font('Helvetica')
         .fillColor('#6b7280')
         .text(`Patient: ${data.patient.fullName}`, 50, 85)
         .text(`Period: ${dateRange.from} to ${dateRange.to}`, 50, 105)
         .text(`Generated: ${new Date().toLocaleString()}`, 50, 125);

      let yPosition = 160;

      // Patient Summary
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
         .text('Health Summary', 50, yPosition);
      
      yPosition += 30;
      
      doc.fontSize(12).font('Helvetica').fillColor('#374151')
         .text(`Total Appointments: ${data.summary.totalAppointments}`, 70, yPosition)
         .text(`Completed Appointments: ${data.summary.completedAppointments}`, 70, yPosition + 20)
         .text(`Health Documents: ${data.summary.totalDocuments}`, 70, yPosition + 40)
         .text(`Profile Completion: ${data.summary.profileStrength}%`, 70, yPosition + 60);

      yPosition += 100;

      // Appointment Details
      if (data.appointments.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
           .text('Appointment History', 50, yPosition);
        
        yPosition += 25;

        data.appointments.slice(0, 10).forEach((appointment, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(10).font('Helvetica')
             .fillColor('#374151')
             .text(`${index + 1}. ${new Date(appointment.date).toLocaleDateString()}`, 70, yPosition)
             .text(`Doctor: ${appointment.doctor?.fullName || 'TBD'}`, 90, yPosition + 15)
             .text(`Type: ${appointment.consultationType}`, 90, yPosition + 30)
             .text(`Status: ${appointment.status}`, 90, yPosition + 45);

          yPosition += 70;
        });
      }

      // Footer
      doc.fontSize(10).fillColor('#9ca3af')
         .text('Generated by CareLine360 Patient Portal', 50, doc.page.height - 50);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generatePatientExcelReport = async (data, dateRange) => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'CareLine360';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Health Summary');
  summarySheet.addRow(['My Health Report - CareLine360']);
  summarySheet.addRow([`Patient: ${data.patient.fullName}`]);
  summarySheet.addRow([`Period: ${dateRange.from} to ${dateRange.to}`]);
  summarySheet.addRow([]);
  
  summarySheet.addRow(['Metric', 'Value']);
  summarySheet.addRow(['Total Appointments', data.summary.totalAppointments]);
  summarySheet.addRow(['Completed Appointments', data.summary.completedAppointments]);
  summarySheet.addRow(['Health Documents', data.summary.totalDocuments]);
  summarySheet.addRow(['Profile Completion', `${data.summary.profileStrength}%`]);

  // Appointments Sheet
  const appointmentsSheet = workbook.addWorksheet('Appointments');
  appointmentsSheet.addRow(['Date', 'Time', 'Doctor', 'Specialty', 'Type', 'Status']);
  
  data.appointments.forEach(appointment => {
    appointmentsSheet.addRow([
      appointment.date ? appointment.date.toISOString().split('T')[0] : 'N/A',
      appointment.time || 'N/A',
      appointment.doctor?.fullName || 'TBD',
      appointment.doctor?.specialty || 'N/A',
      appointment.consultationType || 'N/A',
      appointment.status
    ]);
  });

  // Style headers
  [summarySheet, appointmentsSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(column => {
      column.width = 20;
    });
  });

  return await workbook.xlsx.writeBuffer();
};

const generatePatientCSVReport = async (data, dateRange) => {
  let csv = `My Health Report - CareLine360\n`;
  csv += `Patient: ${data.patient.fullName}\n`;
  csv += `Period: ${dateRange.from} to ${dateRange.to}\n\n`;
  
  csv += `Health Summary\n`;
  csv += `Total Appointments,${data.summary.totalAppointments}\n`;
  csv += `Completed Appointments,${data.summary.completedAppointments}\n`;
  csv += `Health Documents,${data.summary.totalDocuments}\n`;
  csv += `Profile Completion,${data.summary.profileStrength}%\n\n`;
  
  csv += `Appointment History\n`;
  csv += `Date,Time,Doctor,Specialty,Type,Status\n`;
  
  data.appointments.forEach(appointment => {
    csv += `"${appointment.date ? appointment.date.toISOString().split('T')[0] : 'N/A'}","${appointment.time || 'N/A'}","${appointment.doctor?.fullName || 'TBD'}","${appointment.doctor?.specialty || 'N/A'}","${appointment.consultationType || 'N/A'}","${appointment.status}"\n`;
  });

  return Buffer.from(csv, 'utf-8');
};


module.exports = { 
  getMyProfile, 
  updateMyProfile, 
  uploadAvatar, 
  getPatientStats, 
  generatePatientReport 
};
