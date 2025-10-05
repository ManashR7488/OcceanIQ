import jsPDF from 'jspdf';

/**
 * Format health data for export
 */
export const formatHealthDataForExport = (healthData, comparisonData) => {
  const formatted = {
    overallScore: healthData?.overallHealthScore || 0,
    trend: healthData?.trend || 'N/A',
    trendPercentage: healthData?.trendPercentage || 0,
    timestamp: healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : new Date().toLocaleString(),
    metrics: {
      speciesDiversity: healthData?.metrics?.speciesDiversityIndex?.toFixed(2) || 'N/A',
      waterQuality: healthData?.metrics?.waterQualityIndex?.toFixed(2) || 'N/A',
      habitatIntegrity: healthData?.metrics?.habitatIntegrity?.toFixed(2) || 'N/A'
    },
    details: healthData?.details || {},
    alerts: healthData?.alerts || [],
    comparison: comparisonData?.entities || []
  };

  return formatted;
};

/**
 * Export ecosystem health data to PDF
 */
export const exportToPDF = (healthData, comparisonData, filename = 'ecosystem-health-report.pdf') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(14, 116, 144); // cyan-700
    doc.text('Ecosystem Health Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Generated date
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Overall Health Score
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Overall Health Score', 20, yPos);
    yPos += 10;

    const score = healthData?.overallHealthScore || 0;
    const scoreColor = score >= 71 ? [16, 185, 129] : score >= 41 ? [245, 158, 11] : [239, 68, 68];
    
    doc.setFontSize(24);
    doc.setTextColor(...scoreColor);
    doc.text(`${score}/100`, 20, yPos);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(`Trend: ${healthData?.trend || 'N/A'} (${healthData?.trendPercentage || 0}%)`, 60, yPos);
    yPos += 15;

    // Health Metrics Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Health Metrics', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    
    const metrics = healthData?.metrics || {};
    doc.text(`Species Diversity Index: ${metrics.speciesDiversityIndex?.toFixed(1) || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`Water Quality Index: ${metrics.waterQualityIndex?.toFixed(1) || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`Habitat Integrity: ${metrics.habitatIntegrity?.toFixed(1) || 'N/A'}`, 25, yPos);
    yPos += 12;

    // Details Section
    if (healthData?.details) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Environmental Details', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);

      const details = healthData.details;
      if (details.speciesCount) doc.text(`Species Count: ${details.speciesCount}`, 25, yPos), yPos += 6;
      if (details.observationCount) doc.text(`Observations: ${details.observationCount}`, 25, yPos), yPos += 6;
      if (details.avgTemperature) doc.text(`Avg Temperature: ${details.avgTemperature.toFixed(1)}°C`, 25, yPos), yPos += 6;
      if (details.pH) doc.text(`pH Level: ${details.pH.toFixed(2)}`, 25, yPos), yPos += 6;
      if (details.dissolvedOxygen) doc.text(`Dissolved Oxygen: ${details.dissolvedOxygen.toFixed(1)} mg/L`, 25, yPos), yPos += 6;
      yPos += 6;
    }

    // Alerts Section
    const alerts = healthData?.alerts || [];
    if (alerts.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Active Alerts', 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      alerts.forEach((alert, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const alertColor = alert.severity === 'critical' ? [239, 68, 68] : 
                          alert.severity === 'warning' ? [245, 158, 11] : [59, 130, 246];
        
        doc.setTextColor(...alertColor);
        doc.text(`[${alert.severity.toUpperCase()}]`, 25, yPos);
        
        doc.setTextColor(0, 0, 0);
        doc.text(`${alert.type}:`, 50, yPos);
        
        doc.setTextColor(75, 85, 99);
        const messageLines = doc.splitTextToSize(alert.message, pageWidth - 60);
        doc.text(messageLines, 25, yPos + 4);
        yPos += 4 + (messageLines.length * 4) + 3;
      });
      yPos += 5;
    }

    // Comparison Data
    if (comparisonData?.entities && comparisonData.entities.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Comparison Analysis (${comparisonData.comparisonType})`, 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      comparisonData.entities.forEach((entity, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setTextColor(14, 116, 144);
        doc.text(`${entity.name}${entity.isBaseline ? ' (Baseline)' : ''}`, 25, yPos);
        yPos += 6;

        doc.setTextColor(75, 85, 99);
        doc.text(`Health Score: ${entity.healthScore}/100 (${entity.trend})`, 30, yPos);
        yPos += 5;

        if (entity.difference && !entity.isBaseline) {
          const diffColor = entity.difference > 0 ? [16, 185, 129] : [239, 68, 68];
          doc.setTextColor(...diffColor);
          doc.text(`Difference: ${entity.difference > 0 ? '+' : ''}${entity.difference.toFixed(1)} (${entity.differencePercentage}%)`, 30, yPos);
          yPos += 5;
        }

        yPos += 3;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated by OcceanIQ - Marine Data Platform', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Save PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Export ecosystem health data to CSV
 */
export const exportToCSV = (healthData, comparisonData, filename = 'ecosystem-health-data.csv') => {
  try {
    const formatted = formatHealthDataForExport(healthData, comparisonData);
    let csvContent = '';

    // Header
    csvContent += 'Ecosystem Health Report\n';
    csvContent += `Generated,${formatted.timestamp}\n\n`;

    // Overall Metrics
    csvContent += 'Overall Health Metrics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Overall Health Score,${formatted.overallScore}\n`;
    csvContent += `Trend,${formatted.trend}\n`;
    csvContent += `Trend Percentage,${formatted.trendPercentage}%\n\n`;

    // Detailed Metrics
    csvContent += 'Detailed Health Metrics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Species Diversity Index,${formatted.metrics.speciesDiversity}\n`;
    csvContent += `Water Quality Index,${formatted.metrics.waterQuality}\n`;
    csvContent += `Habitat Integrity,${formatted.metrics.habitatIntegrity}\n\n`;

    // Environmental Details
    if (healthData?.details) {
      csvContent += 'Environmental Details\n';
      csvContent += 'Parameter,Value\n';
      const details = healthData.details;
      Object.entries(details).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedValue = typeof value === 'object' 
          ? JSON.stringify(value) 
          : typeof value === 'number' 
          ? value.toFixed(2) 
          : value;
        csvContent += `${formattedKey},${formattedValue}\n`;
      });
      csvContent += '\n';
    }

    // Alerts
    if (formatted.alerts.length > 0) {
      csvContent += 'Active Alerts\n';
      csvContent += 'Type,Severity,Message,Timestamp\n';
      formatted.alerts.forEach(alert => {
        // Properly escape double quotes by replacing " with ""
        const escapedMessage = alert.message
          .replace(/"/g, '""') // Escape double quotes
          .replace(/,/g, ';')   // Replace commas with semicolons
          .replace(/\n/g, ' '); // Replace newlines with spaces
        csvContent += `${alert.type},${alert.severity},"${escapedMessage}",${new Date(alert.timestamp).toLocaleString()}\n`;
      });
      csvContent += '\n';
    }

    // Comparison Data
    if (formatted.comparison.length > 0) {
      csvContent += `Comparison Analysis (${comparisonData.comparisonType})\n`;
      csvContent += 'Entity,Health Score,Trend,Difference,Difference %\n';
      formatted.comparison.forEach(entity => {
        csvContent += `${entity.name},${entity.healthScore},${entity.trend},${entity.difference || 0},${entity.differencePercentage || 0}%\n`;
      });
    }

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error generating CSV:', error);
    return false;
  }
};
