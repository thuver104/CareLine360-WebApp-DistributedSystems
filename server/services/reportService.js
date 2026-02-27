const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const EmergencyCase = require('../models/EmergencyCase');

const generateReport = async ({ reportType, format, dateRange, userId, userRole }) => {
  try {
    // Get data based on report type
    const reportData = await getReportData(reportType, dateRange);

    // Generate report based on format
    switch (format) {
      case 'pdf':
        return await generatePDFReport(reportType, reportData, dateRange);
      case 'excel':
        return await generateExcelReport(reportType, reportData, dateRange);
      case 'csv':
        return await generateCSVReport(reportType, reportData, dateRange);
      default:
        throw new Error('Unsupported report format');
    }
  } catch (error) {
    console.error('Report generation error:', error);
    throw error;
  }
};

const getReportData = async (reportType, dateRange) => {
  const startDate = new Date(dateRange.from);
  const endDate = new Date(dateRange.to);
  endDate.setHours(23, 59, 59, 999);

  switch (reportType) {
    case 'patients':
      return await getPatientsReportData(startDate, endDate);
    case 'doctors':
      return await getDoctorsReportData(startDate, endDate);
    case 'appointments':
      return await getAppointmentsReportData(startDate, endDate);
    case 'emergencies':
      return await getEmergenciesReportData(startDate, endDate);
    case 'projections':
      return await getProjectionsReportData(startDate, endDate);
    default:
      throw new Error('Unsupported report type');
  }
};

const getPatientsReportData = async (startDate, endDate) => {
  // Get patient user accounts
  const patientUsers = await User.find({
    role: 'patient',
    createdAt: { $gte: startDate, $lte: endDate }
  }).lean();

  // Get patient profiles (contains fullName, dob, gender, etc.)
  const patientProfiles = await Patient.find({}).lean();

  // Build a map of userId -> profile for quick lookup
  const profileMap = {};
  patientProfiles.forEach(p => {
    if (p.userId) {
      profileMap[p.userId.toString()] = p;
    }
  });

  // Enrich patient users with profile data
  const patients = patientUsers.map(u => ({
    ...u,
    profile: profileMap[u._id.toString()] || null,
    displayName: profileMap[u._id.toString()]?.fullName || u.fullName || u.email || 'N/A'
  }));

  const appointments = await Appointment.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('patient', 'fullName email role').populate('doctor', 'fullName email').lean();

  const emergencies = await EmergencyCase.find({
    triggeredAt: { $gte: startDate, $lte: endDate }
  }).populate('patient', 'fullName email').lean();

  return {
    patients,
    patientProfiles,
    appointments,
    emergencies,
    summary: {
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      totalEmergencies: emergencies.length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      resolvedEmergencies: emergencies.filter(em => em.status === 'RESOLVED').length
    }
  };
};

const getDoctorsReportData = async (startDate, endDate) => {
  // Get all doctor user accounts (no invalid populate)
  const doctors = await User.find({
    role: 'doctor',
    createdAt: { $gte: startDate, $lte: endDate }
  }).lean();

  // Get doctor profiles for additional info
  const doctorProfiles = await Doctor.find({}).lean();

  // Build a map of userId -> doctor profile
  const doctorProfileMap = {};
  doctorProfiles.forEach(dp => {
    if (dp.userId) {
      doctorProfileMap[dp.userId.toString()] = dp;
    }
  });

  // Enrich doctors with profile data (prefer Doctor profile fullName over User fullName)
  const enrichedDoctors = doctors.map(d => {
    const profile = doctorProfileMap[d._id.toString()] || null;
    return {
      ...d,
      profile,
      displayName: (profile && profile.fullName) || d.fullName || d.email || 'N/A',
      specialization: (profile && profile.specialization) || 'N/A',
      phone: (profile && profile.phone) || d.phone || 'N/A'
    };
  });

  const appointments = await Appointment.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('patient', 'fullName email').populate('doctor', 'fullName email role').lean();

  const doctorStats = {};

  for (const doctor of doctors) {
    const doctorAppointments = appointments.filter(apt =>
      apt.doctor && apt.doctor._id.toString() === doctor._id.toString()
    );

    doctorStats[doctor._id.toString()] = {
      totalAppointments: doctorAppointments.length,
      completedAppointments: doctorAppointments.filter(apt => apt.status === 'completed').length,
      cancelledAppointments: doctorAppointments.filter(apt => apt.status === 'cancelled').length,
    };
  }

  return {
    doctors: enrichedDoctors,
    doctorProfiles,
    appointments,
    doctorStats,
    summary: {
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter(doc => doc.status === 'ACTIVE').length,
      pendingDoctors: doctors.filter(doc => doc.status === 'PENDING').length,
      totalAppointments: appointments.length,
      avgAppointmentsPerDoctor: Math.round(appointments.length / Math.max(doctors.length, 1))
    }
  };
};

const getEmergenciesReportData = async (startDate, endDate) => {
  const emergencies = await EmergencyCase.find({
    triggeredAt: { $gte: startDate, $lte: endDate }
  }).populate('patient', 'fullName email').lean();

  const patientIds = emergencies.map(e => e.patient?._id).filter(id => id);
  const patientProfiles = await Patient.find({ userId: { $in: patientIds } }).lean();

  const profileMap = {};
  patientProfiles.forEach(p => {
    if (p.userId) profileMap[p.userId.toString()] = p;
  });

  const districtStats = {};
  let totalResponseTime = 0;
  let resolvedCount = 0;

  const enrichedEmergencies = emergencies.map(em => {
    const profile = em.patient ? profileMap[em.patient._id.toString()] : null;
    const district = profile?.address?.district || 'Unknown';

    if (!districtStats[district]) {
      districtStats[district] = { total: 0, resolved: 0, avgResponseTime: 0 };
    }
    districtStats[district].total++;

    if (em.status === 'RESOLVED') {
      districtStats[district].resolved++;
      if (em.responseTime) {
        totalResponseTime += em.responseTime;
        resolvedCount++;
      }
    }

    return {
      ...em,
      district,
      patientName: em.patient?.fullName || 'N/A'
    };
  });

  return {
    emergencies: enrichedEmergencies,
    districtStats,
    summary: {
      totalEmergencies: emergencies.length,
      resolvedCount,
      avgResponseTime: resolvedCount > 0 ? Math.round(totalResponseTime / resolvedCount) : 0,
      districtCount: Object.keys(districtStats).length
    }
  };
};

const getProjectionsReportData = async (startDate, endDate) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const historicalEmergencies = await EmergencyCase.aggregate([
    { $match: { triggeredAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$triggeredAt" }, year: { $year: "$triggeredAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const historicalAppointments = await Appointment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  // Simple projection: average growth rate
  const calculateProjection = (history) => {
    if (history.length < 2) return history.map(h => h.count);
    let totalGrowth = 0;
    for (let i = 1; i < history.length; i++) {
      const growth = history[i].count - history[i - 1].count;
      totalGrowth += growth;
    }
    const avgGrowth = totalGrowth / (history.length - 1);
    const lastCount = history[history.length - 1].count;
    return [
      Math.max(0, Math.round(lastCount + avgGrowth)),
      Math.max(0, Math.round(lastCount + avgGrowth * 2)),
      Math.max(0, Math.round(lastCount + avgGrowth * 3))
    ];
  };

  return {
    historical: { emergencies: historicalEmergencies, appointments: historicalAppointments },
    projections: {
      emergencies: calculateProjection(historicalEmergencies),
      appointments: calculateProjection(historicalAppointments)
    },
    margins: {
      emergencyGrowth: historicalEmergencies.length > 1 ?
        ((historicalEmergencies[historicalEmergencies.length - 1].count - historicalEmergencies[0].count) / historicalEmergencies[0].count * 100).toFixed(1) : 0,
      appointmentGrowth: historicalAppointments.length > 1 ?
        ((historicalAppointments[historicalAppointments.length - 1].count - historicalAppointments[0].count) / historicalAppointments[0].count * 100).toFixed(1) : 0
    }
  };
};

const getAppointmentsReportData = async (startDate, endDate) => {
  const appointments = await Appointment.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('patient', 'fullName email').populate('doctor', 'fullName email').lean();

  const statusBreakdown = {
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length
  };

  const typeBreakdown = {
    video: appointments.filter(apt => apt.consultationType === 'video').length,
    inPerson: appointments.filter(apt => apt.consultationType === 'in-person').length,
    phone: appointments.filter(apt => apt.consultationType === 'phone').length
  };

  const dailyStats = {};
  appointments.forEach(apt => {
    if (!apt.date) return;
    const dateKey = (apt.date instanceof Date ? apt.date : new Date(apt.date)).toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { total: 0, completed: 0, cancelled: 0 };
    }
    dailyStats[dateKey].total++;
    if (apt.status === 'completed') dailyStats[dateKey].completed++;
    if (apt.status === 'cancelled') dailyStats[dateKey].cancelled++;
  });

  return {
    appointments,
    statusBreakdown,
    typeBreakdown,
    dailyStats,
    summary: {
      totalAppointments: appointments.length,
      completionRate: Math.round((statusBreakdown.completed / Math.max(appointments.length, 1)) * 100),
      cancellationRate: Math.round((statusBreakdown.cancelled / Math.max(appointments.length, 1)) * 100),
      avgDailyAppointments: Math.round(appointments.length / Math.max(Object.keys(dailyStats).length, 1))
    }
  };
};

const generatePDFReport = async (reportType, data, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text('CareLine360 Analytics Report', 50, 50);

      doc.fontSize(14).font('Helvetica')
        .fillColor('#6b7280')
        .text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 50, 85)
        .text(`Period: ${dateRange.from} to ${dateRange.to}`, 50, 105)
        .text(`Generated: ${new Date().toLocaleString()}`, 50, 125);

      let yPosition = 160;

      // Add content based on report type
      switch (reportType) {
        case 'patients':
          yPosition = addPatientsPDFContent(doc, data, yPosition);
          break;
        case 'doctors':
          yPosition = addDoctorsPDFContent(doc, data, yPosition);
          break;
        case 'appointments':
          yPosition = addAppointmentsPDFContent(doc, data, yPosition);
          break;
        case 'emergencies':
          yPosition = addEmergenciesPDFContent(doc, data, yPosition);
          break;
        case 'projections':
          yPosition = addProjectionsPDFContent(doc, data, yPosition);
          break;
      }

      // Footer
      doc.fontSize(10).fillColor('#9ca3af')
        .text('Generated by CareLine360 Analytics Engine', 50, doc.page.height - 50);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const addPatientsPDFContent = (doc, data, yPosition) => {
  // Summary Section
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
    .text('Patient Summary', 50, yPosition);

  yPosition += 30;

  doc.fontSize(12).font('Helvetica').fillColor('#374151')
    .text(`Total Patients: ${data.summary.totalPatients}`, 70, yPosition)
    .text(`Total Appointments: ${data.summary.totalAppointments}`, 70, yPosition + 20)
    .text(`Total Emergencies: ${data.summary.totalEmergencies}`, 70, yPosition + 40)
    .text(`Completed Appointments: ${data.summary.completedAppointments}`, 70, yPosition + 60)
    .text(`Resolved Emergencies: ${data.summary.resolvedEmergencies}`, 70, yPosition + 80);

  yPosition += 120;

  // Patient Details
  if (data.patients.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
      .text('Patient Details', 50, yPosition);

    yPosition += 25;

    data.patients.slice(0, 10).forEach((patient, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(10).font('Helvetica')
        .fillColor('#374151')
        .text(`${index + 1}. ${patient.displayName || patient.fullName || 'N/A'}`, 70, yPosition)
        .text(`Email: ${patient.email || 'N/A'}`, 90, yPosition + 15)
        .text(`Phone: ${patient.phone || 'N/A'}`, 90, yPosition + 30)
        .text(`Status: ${patient.status || 'N/A'}`, 90, yPosition + 45);

      yPosition += 70;
    });

    if (data.patients.length > 10) {
      doc.text(`... and ${data.patients.length - 10} more patients`, 70, yPosition);
    }
  }

  return yPosition + 30;
};

const addDoctorsPDFContent = (doc, data, yPosition) => {
  // Summary Section
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
    .text('Doctor Summary', 50, yPosition);

  yPosition += 30;

  doc.fontSize(12).font('Helvetica').fillColor('#374151')
    .text(`Total Doctors: ${data.summary.totalDoctors}`, 70, yPosition)
    .text(`Active Doctors: ${data.summary.activeDoctors}`, 70, yPosition + 20)
    .text(`Pending Doctors: ${data.summary.pendingDoctors}`, 70, yPosition + 40)
    .text(`Total Appointments: ${data.summary.totalAppointments}`, 70, yPosition + 60)
    .text(`Avg Appointments per Doctor: ${data.summary.avgAppointmentsPerDoctor}`, 70, yPosition + 80);

  yPosition += 120;

  // Doctor Details
  if (data.doctors.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
      .text('Doctor Details', 50, yPosition);

    yPosition += 25;

    data.doctors.slice(0, 10).forEach((doctor, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const doctorId = doctor._id ? doctor._id.toString() : '';
      const stats = data.doctorStats[doctorId] || {};

      doc.fontSize(10).font('Helvetica')
        .fillColor('#374151')
        .text(`${index + 1}. Dr. ${doctor.displayName || doctor.fullName || 'N/A'}`, 70, yPosition)
        .text(`Email: ${doctor.email || 'N/A'}`, 90, yPosition + 15)
        .text(`Status: ${doctor.status || 'N/A'}`, 90, yPosition + 30)
        .text(`Appointments: ${stats.totalAppointments || 0}`, 90, yPosition + 45)
        .text(`Completed: ${stats.completedAppointments || 0}`, 90, yPosition + 60);

      yPosition += 85;
    });

    if (data.doctors.length > 10) {
      doc.text(`... and ${data.doctors.length - 10} more doctors`, 70, yPosition);
    }
  }

  return yPosition + 30;
};

const addAppointmentsPDFContent = (doc, data, yPosition) => {
  // Summary Section
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
    .text('Appointment Summary', 50, yPosition);

  yPosition += 30;

  doc.fontSize(12).font('Helvetica').fillColor('#374151')
    .text(`Total Appointments: ${data.summary.totalAppointments}`, 70, yPosition)
    .text(`Completion Rate: ${data.summary.completionRate}%`, 70, yPosition + 20)
    .text(`Cancellation Rate: ${data.summary.cancellationRate}%`, 70, yPosition + 40)
    .text(`Avg Daily Appointments: ${data.summary.avgDailyAppointments}`, 70, yPosition + 60);

  yPosition += 100;

  // Status Breakdown
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
    .text('Status Breakdown', 50, yPosition);

  yPosition += 25;

  doc.fontSize(10).font('Helvetica').fillColor('#374151')
    .text(`Pending: ${data.statusBreakdown.pending}`, 70, yPosition)
    .text(`Confirmed: ${data.statusBreakdown.confirmed}`, 200, yPosition)
    .text(`Completed: ${data.statusBreakdown.completed}`, 70, yPosition + 20)
    .text(`Cancelled: ${data.statusBreakdown.cancelled}`, 200, yPosition + 20);

  yPosition += 60;

  // Type Breakdown
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
    .text('Consultation Type Breakdown', 50, yPosition);

  yPosition += 25;

  doc.fontSize(10).font('Helvetica').fillColor('#374151')
    .text(`Video: ${data.typeBreakdown.video}`, 70, yPosition)
    .text(`In-Person: ${data.typeBreakdown.inPerson}`, 200, yPosition)
    .text(`Phone: ${data.typeBreakdown.phone}`, 330, yPosition);

  return yPosition + 50;
};

const addEmergenciesPDFContent = (doc, data, yPosition) => {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937').text('Emergency Summary', 50, yPosition);
  yPosition += 30;
  doc.fontSize(12).font('Helvetica').fillColor('#374151')
    .text(`Total Emergencies: ${data.summary.totalEmergencies}`, 70, yPosition)
    .text(`Resolved Cases: ${data.summary.resolvedCount}`, 70, yPosition + 20)
    .text(`Average Response Time: ${data.summary.avgResponseTime} mins`, 70, yPosition + 40)
    .text(`Districts Covered: ${data.summary.districtCount}`, 70, yPosition + 60);

  yPosition += 100;
  doc.fontSize(14).font('Helvetica-Bold').text('District Breakdown', 50, yPosition);
  yPosition += 25;
  Object.entries(data.districtStats).forEach(([district, stats], idx) => {
    if (yPosition > 700) { doc.addPage(); yPosition = 50; }
    doc.fontSize(10).text(`${district}: ${stats.total} total, ${stats.resolved} resolved`, 70, yPosition);
    yPosition += 20;
  });

  return yPosition + 30;
};

const addProjectionsPDFContent = (doc, data, yPosition) => {
  doc.fontSize(16).font('Helvetica-Bold').text('Future Growth Projections', 50, yPosition);
  yPosition += 30;
  doc.fontSize(12).text(`Historical Emergency Growth: ${data.margins.emergencyGrowth}%`, 70, yPosition);
  doc.fontSize(12).text(`Historical Appointment Growth: ${data.margins.appointmentGrowth}%`, 70, yPosition + 20);

  yPosition += 60;
  doc.fontSize(14).text('Projected Volume (Next 3 Months)', 50, yPosition);
  yPosition += 25;
  doc.fontSize(10).text('Emergencies: ' + data.projections.emergencies.join(', '), 70, yPosition);
  doc.fontSize(10).text('Appointments: ' + data.projections.appointments.join(', '), 70, yPosition + 20);

  return yPosition + 40;
};

const generateExcelReport = async (reportType, data, dateRange) => {
  const workbook = new ExcelJS.Workbook();

  // Add metadata
  workbook.creator = 'CareLine360';
  workbook.created = new Date();
  workbook.modified = new Date();

  switch (reportType) {
    case 'patients':
      addPatientsExcelSheets(workbook, data, dateRange);
      break;
    case 'doctors':
      addDoctorsExcelSheets(workbook, data, dateRange);
      break;
    case 'appointments':
      addAppointmentsExcelSheets(workbook, data, dateRange);
      break;
    case 'emergencies':
      addEmergenciesExcelSheets(workbook, data, dateRange);
      break;
    case 'projections':
      addProjectionsExcelSheets(workbook, data, dateRange);
      break;
  }

  return await workbook.xlsx.writeBuffer();
};

const addPatientsExcelSheets = (workbook, data, dateRange) => {
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['CareLine360 Patient Report']);
  summarySheet.addRow([`Period: ${dateRange.from} to ${dateRange.to}`]);
  summarySheet.addRow([]);

  summarySheet.addRow(['Metric', 'Value']);
  summarySheet.addRow(['Total Patients', data.summary.totalPatients]);
  summarySheet.addRow(['Total Appointments', data.summary.totalAppointments]);
  summarySheet.addRow(['Total Emergencies', data.summary.totalEmergencies]);
  summarySheet.addRow(['Completed Appointments', data.summary.completedAppointments]);
  summarySheet.addRow(['Resolved Emergencies', data.summary.resolvedEmergencies]);

  // Patients Detail Sheet
  const patientsSheet = workbook.addWorksheet('Patients');
  patientsSheet.addRow(['Name', 'Email', 'Phone', 'Status', 'Created Date']);

  data.patients.forEach(patient => {
    const createdDate = patient.createdAt
      ? (patient.createdAt instanceof Date ? patient.createdAt : new Date(patient.createdAt)).toISOString().split('T')[0]
      : 'N/A';
    patientsSheet.addRow([
      patient.displayName || patient.fullName || 'N/A',
      patient.email || 'N/A',
      patient.phone || 'N/A',
      patient.status || 'N/A',
      createdDate
    ]);
  });

  // Style headers
  [summarySheet, patientsSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(column => {
      column.width = 20;
    });
  });
};

const addDoctorsExcelSheets = (workbook, data, dateRange) => {
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['CareLine360 Doctor Report']);
  summarySheet.addRow([`Period: ${dateRange.from} to ${dateRange.to}`]);
  summarySheet.addRow([]);

  summarySheet.addRow(['Metric', 'Value']);
  summarySheet.addRow(['Total Doctors', data.summary.totalDoctors]);
  summarySheet.addRow(['Active Doctors', data.summary.activeDoctors]);
  summarySheet.addRow(['Pending Doctors', data.summary.pendingDoctors]);
  summarySheet.addRow(['Total Appointments', data.summary.totalAppointments]);
  summarySheet.addRow(['Avg Appointments per Doctor', data.summary.avgAppointmentsPerDoctor]);

  // Doctors Detail Sheet
  const doctorsSheet = workbook.addWorksheet('Doctors');
  doctorsSheet.addRow(['Name', 'Email', 'Status', 'Total Appointments', 'Completed', 'Cancelled', 'Created Date']);

  data.doctors.forEach(doctor => {
    const doctorId = doctor._id ? doctor._id.toString() : '';
    const stats = data.doctorStats[doctorId] || {};
    const createdDate = doctor.createdAt
      ? (doctor.createdAt instanceof Date ? doctor.createdAt : new Date(doctor.createdAt)).toISOString().split('T')[0]
      : 'N/A';
    doctorsSheet.addRow([
      doctor.displayName || doctor.fullName || 'N/A',
      doctor.email || 'N/A',
      doctor.status || 'N/A',
      stats.totalAppointments || 0,
      stats.completedAppointments || 0,
      stats.cancelledAppointments || 0,
      createdDate
    ]);
  });

  // Style headers
  [summarySheet, doctorsSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(column => {
      column.width = 20;
    });
  });
};

const addAppointmentsExcelSheets = (workbook, data, dateRange) => {
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['CareLine360 Appointments Report']);
  summarySheet.addRow([`Period: ${dateRange.from} to ${dateRange.to}`]);
  summarySheet.addRow([]);

  summarySheet.addRow(['Metric', 'Value']);
  summarySheet.addRow(['Total Appointments', data.summary.totalAppointments]);
  summarySheet.addRow(['Completion Rate (%)', data.summary.completionRate]);
  summarySheet.addRow(['Cancellation Rate (%)', data.summary.cancellationRate]);
  summarySheet.addRow(['Avg Daily Appointments', data.summary.avgDailyAppointments]);

  // Appointments Detail Sheet
  const appointmentsSheet = workbook.addWorksheet('Appointments');
  appointmentsSheet.addRow(['Date', 'Time', 'Patient', 'Doctor', 'Type', 'Status', 'Priority']);

  data.appointments.forEach(appointment => {
    const aptDate = appointment.date
      ? (appointment.date instanceof Date ? appointment.date : new Date(appointment.date)).toISOString().split('T')[0]
      : 'N/A';
    appointmentsSheet.addRow([
      aptDate,
      appointment.time || 'N/A',
      appointment.patient?.fullName || 'N/A',
      appointment.doctor?.fullName || 'N/A',
      appointment.consultationType || 'N/A',
      appointment.status || 'N/A',
      appointment.priority || 'N/A'
    ]);
  });

  // Status Breakdown Sheet
  const statusSheet = workbook.addWorksheet('Status Breakdown');
  statusSheet.addRow(['Status', 'Count']);
  Object.entries(data.statusBreakdown).forEach(([status, count]) => {
    statusSheet.addRow([status.charAt(0).toUpperCase() + status.slice(1), count]);
  });

  // Type Breakdown Sheet
  const typeSheet = workbook.addWorksheet('Type Breakdown');
  typeSheet.addRow(['Consultation Type', 'Count']);
  Object.entries(data.typeBreakdown).forEach(([type, count]) => {
    const typeName = type === 'inPerson' ? 'In-Person' : type.charAt(0).toUpperCase() + type.slice(1);
    typeSheet.addRow([typeName, count]);
  });

  // Style headers
  [summarySheet, appointmentsSheet, statusSheet, typeSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(column => {
      column.width = 20;
    });
  });
};

const generateCSVReport = async (reportType, data, dateRange) => {
  let csvContent = '';

  switch (reportType) {
    case 'patients':
      csvContent = generatePatientsCSV(data, dateRange);
      break;
    case 'doctors':
      csvContent = generateDoctorsCSV(data, dateRange);
      break;
    case 'appointments':
      csvContent = generateAppointmentsCSV(data, dateRange);
      break;
    case 'emergencies':
      csvContent = generateEmergenciesCSV(data, dateRange);
      break;
    case 'projections':
      csvContent = generateProjectionsCSV(data, dateRange);
      break;
  }

  return Buffer.from(csvContent, 'utf-8');
};

const generatePatientsCSV = (data, dateRange) => {
  let csv = `CareLine360 Patient Report\n`;
  csv += `Period: ${dateRange.from} to ${dateRange.to}\n\n`;

  csv += `Summary\n`;
  csv += `Total Patients,${data.summary.totalPatients}\n`;
  csv += `Total Appointments,${data.summary.totalAppointments}\n`;
  csv += `Total Emergencies,${data.summary.totalEmergencies}\n\n`;

  csv += `Patient Details\n`;
  csv += `Name,Email,Phone,Status,Created Date\n`;

  data.patients.forEach(patient => {
    const createdDate = patient.createdAt
      ? (patient.createdAt instanceof Date ? patient.createdAt : new Date(patient.createdAt)).toISOString().split('T')[0]
      : 'N/A';
    csv += `"${patient.displayName || patient.fullName || 'N/A'}","${patient.email || 'N/A'}","${patient.phone || 'N/A'}","${patient.status || 'N/A'}","${createdDate}"\n`;
  });

  return csv;
};

const generateDoctorsCSV = (data, dateRange) => {
  let csv = `CareLine360 Doctor Report\n`;
  csv += `Period: ${dateRange.from} to ${dateRange.to}\n\n`;

  csv += `Summary\n`;
  csv += `Total Doctors,${data.summary.totalDoctors}\n`;
  csv += `Active Doctors,${data.summary.activeDoctors}\n`;
  csv += `Pending Doctors,${data.summary.pendingDoctors}\n\n`;

  csv += `Doctor Details\n`;
  csv += `Name,Email,Status,Total Appointments,Completed,Cancelled,Created Date\n`;

  data.doctors.forEach(doctor => {
    const doctorId = doctor._id ? doctor._id.toString() : '';
    const stats = data.doctorStats[doctorId] || {};
    const createdDate = doctor.createdAt
      ? (doctor.createdAt instanceof Date ? doctor.createdAt : new Date(doctor.createdAt)).toISOString().split('T')[0]
      : 'N/A';
    csv += `"${doctor.displayName || doctor.fullName || 'N/A'}","${doctor.email || 'N/A'}","${doctor.status || 'N/A'}","${stats.totalAppointments || 0}","${stats.completedAppointments || 0}","${stats.cancelledAppointments || 0}","${createdDate}"\n`;
  });

  return csv;
};

const generateAppointmentsCSV = (data, dateRange) => {
  let csv = `CareLine360 Appointments Report\n`;
  csv += `Period: ${dateRange.from} to ${dateRange.to}\n\n`;

  csv += `Summary\n`;
  csv += `Total Appointments,${data.summary.totalAppointments}\n`;
  csv += `Completion Rate (%),${data.summary.completionRate}\n`;
  csv += `Cancellation Rate (%),${data.summary.cancellationRate}\n\n`;

  csv += `Appointment Details\n`;
  csv += `Date,Time,Patient,Doctor,Type,Status,Priority\n`;

  data.appointments.forEach(appointment => {
    const aptDate = appointment.date
      ? (appointment.date instanceof Date ? appointment.date : new Date(appointment.date)).toISOString().split('T')[0]
      : 'N/A';
    csv += `"${aptDate}","${appointment.time || 'N/A'}","${appointment.patient?.fullName || 'N/A'}","${appointment.doctor?.fullName || 'N/A'}","${appointment.consultationType || 'N/A'}","${appointment.status || 'N/A'}","${appointment.priority || 'N/A'}"\n`;
  });

  return csv;
};

const addEmergenciesExcelSheets = (workbook, data, dateRange) => {
  const sheet = workbook.addWorksheet('Emergencies');
  sheet.addRow(['District', 'Total Cases', 'Resolved', 'Avg Response (min)']);
  Object.entries(data.districtStats).forEach(([dist, s]) => {
    sheet.addRow([dist, s.total, s.resolved, s.avgResponseTime]);
  });

  const detail = workbook.addWorksheet('Details');
  detail.addRow(['Patient', 'District', 'Status', 'Response Time (min)', 'Triggered At']);
  data.emergencies.forEach(e => {
    detail.addRow([e.patientName, e.district, e.status, e.responseTime || 'N/A', e.triggeredAt]);
  });
};

const addProjectionsExcelSheets = (workbook, data, dateRange) => {
  const sheet = workbook.addWorksheet('Projections');
  sheet.addRow(['Insight', 'Value']);
  sheet.addRow(['Emergency Growth Rate (%)', data.margins.emergencyGrowth]);
  sheet.addRow(['Appointment Growth Rate (%)', data.margins.appointmentGrowth]);
  sheet.addRow([]);
  sheet.addRow(['Metric', 'Next Month (P1)', 'Month 2 (P2)', 'Month 3 (P3)']);
  sheet.addRow(['Projected Emergencies', ...data.projections.emergencies]);
  sheet.addRow(['Projected Appointments', ...data.projections.appointments]);
};

const generateEmergenciesCSV = (data) => {
  let csv = "District,Total,Resolved,AvgResponse\n";
  Object.entries(data.districtStats).forEach(([d, s]) => {
    csv += `"${d}",${s.total},${s.resolved},${s.avgResponseTime}\n`;
  });
  return csv;
};

const generateProjectionsCSV = (data) => {
  let csv = "Metric,GrowthRate,Month1,Month2,Month3\n";
  csv += `Emergencies,${data.margins.emergencyGrowth}%,${data.projections.emergencies.join(',')}\n`;
  csv += `Appointments,${data.margins.appointmentGrowth}%,${data.projections.appointments.join(',')}\n`;
  return csv;
};

module.exports = {
  generateReport
};