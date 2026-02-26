const PDFDocument = require("pdfkit");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Generate a prescription PDF and upload to Cloudinary.
 * Returns { fileUrl, publicId }
 */
const generateAndUploadPrescriptionPdf = ({
  doctor,
  patient,
  prescription,
  appointmentDate,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("error", reject);
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Upload to Cloudinary — resource_type "auto" lets Cloudinary detect the
      // PDF content-type automatically, ensuring browsers receive the correct
      // MIME type (application/pdf) and download the file with a .pdf extension.
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "careline360/prescriptions",
          resource_type: "auto",
          format: "pdf",
          public_id: `prescription_${Date.now()}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({ fileUrl: result.secure_url, publicId: result.public_id });
        },
      );

      streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
    });

    // ── PDF Layout ──────────────────────────────────────────────
    const teal = "#0d9488";
    const darkGray = "#1f2937";
    const gray = "#6b7280";

    // Header bar
    doc.rect(0, 0, doc.page.width, 80).fill(teal);

    doc
      .fillColor("white")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("CareLine360", 50, 20);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Smart Healthcare & Emergency System", 50, 46);

    doc.fillColor(darkGray).moveDown(3);

    // Title
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(teal)
      .text("PRESCRIPTION", { align: "center" });
    doc.moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor(teal)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);

    // Doctor & Patient Info
    const startY = doc.y;

    // Left: Doctor info
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(teal)
      .text("DOCTOR", 50, startY);
    doc
      .fillColor(darkGray)
      .font("Helvetica")
      .text(`Dr. ${doctor.fullName}`, 50, doc.y + 4)
      .text(doctor.specialization || "General Practitioner", 50, doc.y + 2)
      .text(`Reg: ${doctor.licenseNumber || "N/A"}`, 50, doc.y + 2);

    // Right: Patient info
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(teal)
      .text("PATIENT", 320, startY);
    doc
      .fillColor(darkGray)
      .font("Helvetica")
      .text(patient.fullName, 320, startY + 16)
      .text(`ID: ${patient.patientId}`, 320, startY + 30)
      .text(
        `Date: ${appointmentDate || new Date().toLocaleDateString("en-GB")}`,
        320,
        startY + 44,
      );

    doc.y = startY + 75;
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(1);

    // Diagnosis / Notes
    if (prescription.notes) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(teal)
        .text("CLINICAL NOTES");
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(darkGray)
        .text(prescription.notes);
      doc.moveDown(1);
    }

    // Medicines
    doc.fontSize(11).font("Helvetica-Bold").fillColor(teal).text("MEDICATIONS");
    doc.moveDown(0.3);

    if (!prescription.medicines || prescription.medicines.length === 0) {
      doc.fontSize(10).fillColor(gray).text("No medications prescribed.");
    } else {
      prescription.medicines.forEach((med, i) => {
        const rowY = doc.y;
        const num = `${i + 1}.`;

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(darkGray)
          .text(`${num} ${med.medicine || "—"}`, 50, rowY);
        doc
          .font("Helvetica")
          .fillColor(gray)
          .text(
            `Dosage: ${med.dosage || "—"}   |   Frequency: ${med.frequency || "—"}   |   Duration: ${med.duration || "—"}`,
            65,
            doc.y + 2,
          );
        if (med.instructions) {
          doc
            .fillColor("#9ca3af")
            .text(`Note: ${med.instructions}`, 65, doc.y + 2);
        }
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(1);

    // Signature line
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(gray)
      .text("Doctor's Signature: ________________________", 50);
    doc.moveDown(0.5);
    doc.text(`Dr. ${doctor.fullName}`, 50);
    doc.text(doctor.specialization || "", 50);

    // Footer
    const footerY = doc.page.height - 50;
    doc
      .fontSize(8)
      .fillColor(gray)
      .text(
        "This prescription was generated by CareLine360 | For medical advice, consult your doctor.",
        50,
        footerY,
        {
          align: "center",
          width: doc.page.width - 100,
        },
      );

    doc.end();
  });
};

module.exports = { generateAndUploadPrescriptionPdf };
