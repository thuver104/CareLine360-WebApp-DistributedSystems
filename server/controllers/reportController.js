const { generateReport } = require('../services/reportService');

const generateReportController = async (req, res, next) => {
  try {
    const { reportType, format, dateRange } = req.body;
    
    if (!reportType || !format || !dateRange) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type, format, and date range are required' 
      });
    }

    const reportBuffer = await generateReport({
      reportType,
      format,
      dateRange,
      userId: req.user.userId,
      userRole: req.user.role
    });

    // Set appropriate headers for file download
    let filename = `${reportType}_report_${dateRange.from}_to_${dateRange.to}`;
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
    console.error('Report generation error:', error);
    next(error);
  }
};

module.exports = {
  generateReportController
};