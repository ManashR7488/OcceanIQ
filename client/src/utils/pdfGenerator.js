import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

/**
 * Generate a professional PDF report for species identification
 * @param {Object} species - Full species data object
 * @param {Object} identificationData - Optional identification metadata { uploadedImageUrl, confidence, rank }
 * @param {Object} options - Optional settings { includeImage: boolean, includeReferences: boolean }
 * @returns {Promise<String>} filename - Name of the generated PDF file
 */
export const generateSpeciesReportPDF = async (
  species,
  identificationData = null,
  options = {}
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (
    text,
    fontSize = 12,
    isBold = false,
    isItalic = false,
    maxWidth = pageWidth - 2 * margin
  ) => {
    doc.setFontSize(fontSize);
    if (isBold && isItalic) doc.setFont(undefined, "bolditalic");
    else if (isBold) doc.setFont(undefined, "bold");
    else if (isItalic) doc.setFont(undefined, "italic");
    else doc.setFont(undefined, "normal");

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.5 + 3;
    doc.setFont(undefined, "normal");
  };

  // Helper function to add section header
  const addSectionHeader = (title) => {
    yPosition += 8;
    doc.setFillColor(0, 128, 128); // Teal color
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(title, margin + 5, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    yPosition += 12;
  };

  // Check if new page needed
  const checkPageBreak = (requiredSpace = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // 1. Header with branding
  doc.setFillColor(0, 128, 128);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("OcceanIQ", margin, 20);
  doc.setFontSize(12);
  doc.text("Species Identification Report", margin, 30);
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // Add uploaded image if provided in options
  if (options.includeImage && identificationData?.uploadedImageUrl) {
    try {
      // Convert image URL to data URL and embed in PDF
      const dataUrl = await convertImageToDataURL(identificationData.uploadedImageUrl);
      
      // Calculate centered position
      const imageWidth = 120;
      const imageHeight = 80;
      const imageX = (pageWidth - imageWidth) / 2;
      
      // Add image to PDF
      doc.addImage(dataUrl, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
      yPosition += imageHeight + 12; // Move position below image
      
      // Add caption
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Uploaded specimen image", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      doc.setTextColor(0, 0, 0);
    } catch (error) {
      console.error("Failed to add image to PDF:", error);
      // Fallback: Add text note if image embedding fails
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("(Image could not be embedded - see online version)", margin, yPosition);
      yPosition += 12;
      doc.setTextColor(0, 0, 0);
    }
  }

  // 2. Species Name
  doc.setFontSize(22);
  doc.setFont(undefined, "bolditalic");
  doc.text(species.scientificName || "Unknown Species", margin, yPosition);
  yPosition += 10;

  // 3. Common Names
  if (species.commonNames && species.commonNames.length > 0) {
    doc.setFontSize(14);
    doc.setFont(undefined, "normal");
    doc.text("Common Names: " + species.commonNames.join(", "), margin, yPosition);
    yPosition += 10;
  }
  yPosition += 5;

  // 4. Identification Info (if provided)
  if (identificationData) {
    checkPageBreak(50);
    addSectionHeader("Identification Results");
    addText(`Confidence Score: ${identificationData.confidence}%`, 12, true);
    addText(`Ranking: #${identificationData.rank}`);
    addText(`Identification Date: ${new Date().toLocaleDateString()}`);
    yPosition += 5;
  }

  // 5. Taxonomic Classification
  checkPageBreak(100);
  addSectionHeader("Taxonomic Classification");
  const hierarchy = species.taxonomicHierarchy;
  if (hierarchy && Object.keys(hierarchy).length > 0) {
    // Define preferred order for common ranks to ensure logical display
    const rankOrder = [
      "kingdom",
      "phylum",
      "subphylum",
      "class",
      "subclass",
      "order",
      "suborder",
      "family",
      "subfamily",
      "genus",
      "species",
    ];

    // Get all keys, sort them by rank order (unknown ranks go to the end)
    const sortedKeys = Object.keys(hierarchy).sort((a, b) => {
      const indexA = rankOrder.indexOf(a.toLowerCase());
      const indexB = rankOrder.indexOf(b.toLowerCase());
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach((rank) => {
      if (hierarchy[rank]) {
        // Format rank name: camelCase/snake_case to Title Case
        const formattedRank = rank
          .replace(/([A-Z])/g, " $1") // Add space before capital letters
          .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

        addText(
          `${formattedRank}: ${hierarchy[rank]}`,
          11
        );
      }
    });
  } else {
    addText("Taxonomic classification data not available.", 11);
  }
  yPosition += 5;

  // 6. Physical Characteristics
  checkPageBreak(60);
  addSectionHeader("Physical Characteristics");
  const description =
    species.description || "Physical characteristics data not available.";
  addText(description, 11);
  yPosition += 5;

  // 7. Habitat & Distribution
  checkPageBreak(60);
  addSectionHeader("Habitat & Distribution");
  addText(`Habitat: ${species.habitat || "N/A"}`, 11);
  addText(`Distribution: ${species.distribution || "N/A"}`, 11);

  if (species.wormsMetadata) {
    const env = [];
    if (species.wormsMetadata.isMarine) env.push("Marine");
    if (species.wormsMetadata.isBrackish) env.push("Brackish");
    if (species.wormsMetadata.isFreshwater) env.push("Freshwater");
    if (env.length > 0) {
      addText(`Environment: ${env.join(", ")}`, 11);
    }
  }
  yPosition += 5;

  // 8. Conservation Status
  if (species.conservationStatus) {
    checkPageBreak(40);
    addSectionHeader("Conservation Status");
    addText(`IUCN Status: ${species.conservationStatus}`, 11, true);
    yPosition += 5;
  }

  // 9. Additional Information
  checkPageBreak(80);
  addSectionHeader("Additional Information");
  addText(`Taxonomic Status: ${species.taxonomicStatus || "N/A"}`, 11);

  if (species.wormsMetadata?.authority) {
    addText(`Authority: ${species.wormsMetadata.authority}`, 11);
  }

  if (species.synonyms && species.synonyms.length > 0) {
    const synonymsText = species.synonyms.map((s) => s.name || s).join(", ");
    addText(`Synonyms: ${synonymsText}`, 11);
  }
  yPosition += 5;

  // 10. External References
  if (options.includeReferences !== false) {
    checkPageBreak(60);
    addSectionHeader("External References");

    if (species.wormsMetadata?.url) {
      addText(`WoRMS: ${species.wormsMetadata.url}`, 10);
    }

    if (species.externalLinks?.wikipedia) {
      addText(`Wikipedia: ${species.externalLinks.wikipedia}`, 10);
    }

    if (species.externalLinks?.gbif) {
      addText(`GBIF: ${species.externalLinks.gbif}`, 10);
    }

    if (species.externalLinks?.fishbase) {
      addText(`FishBase: ${species.externalLinks.fishbase}`, 10);
    }
  }

  // 11. Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by OcceanIQ on ${new Date().toLocaleString()}`,
      margin,
      footerY
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, footerY);
  }

  // Save PDF
  const filename = `${species.scientificName.replace(/\s+/g, "_")}_report.pdf`;
  doc.save(filename);

  return filename;
};

/**
 * Alternative: Generate PDF with image inclusion (requires additional setup)
 * This is a placeholder for future enhancement
 */
export const generateSpeciesReportPDFWithImage = async (
  species,
  identificationData,
  imageUrl
) => {
  // Future implementation: Convert image URL to base64 and embed in PDF
  // Requires additional image processing logic
  console.log("PDF with image generation not yet implemented");
  return generateSpeciesReportPDF(species, identificationData, {
    includeImage: true,
  });
};

/**
 * Helper function to convert image URL to data URL for PDF embedding
 * @param {String} imageUrl - URL of the image to convert
 * @returns {Promise<String>} - Data URL (base64 encoded)
 */
export const convertImageToDataURL = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle CORS
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      } catch (error) {
        reject(new Error("Failed to convert image to data URL: " + error.message));
      }
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image from URL"));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Sanitize filename from title
 * @private
 */
function sanitizeFilename(title) {
  const cleanTitle = title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  return `${cleanTitle}_${Date.now()}.pdf`;
}

/**
 * Helper function to generate PDF from container element
 * @private
 */
function generatePDFFromContainer(container, title, resolve, reject) {
  let containerAppended = false;
  
  try {
    containerAppended = container.parentNode === document.body;
    
    // Configure html2pdf options
    const opt = {
      margin: [10, 10, 10, 10], // [top, left, bottom, right] in mm
      filename: sanitizeFilename(title),
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123 // A4 height in pixels at 96 DPI
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['section', '.finding-item', '.analysis-section']
      }
    };
    
    // Generate PDF with guaranteed cleanup
    const cleanup = () => {
      try {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
    
    html2pdf()
      .set(opt)
      .from(container)
      .save()
      .then(() => {
        cleanup();
        resolve(opt.filename);
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
      
  } catch (error) {
    // Clean up on synchronous error
    try {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    reject(error);
  }
}

/**
 * Generate PDF from HTML research document using html2pdf.js
 * @param {Object} researchDocument - Object containing { body, css, title }
 * @returns {Promise<String>} filename - Name of the generated PDF file
 */
export const generateResearchReportPDF = async (researchDocument) => {
  const { body, css, title } = researchDocument;
  
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = 'white';
      
      // Inject CSS with @page rules for print
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        ${css}
        
        /* Additional print-specific styles */
        @page {
          size: A4;
          margin: 20mm;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
        
        /* Ensure proper page breaks */
        section {
          page-break-inside: avoid;
        }
        
        h1, h2, h3 {
          page-break-after: avoid;
        }
      `;
      container.appendChild(styleElement);
      
      // Inject HTML body
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = body;
      container.appendChild(contentDiv);
      
      // Append to document
      document.body.appendChild(container);
      
      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          generatePDFFromContainer(container, title, resolve, reject);
        }).catch(() => {
          // Fallback if font loading fails
          setTimeout(() => {
            generatePDFFromContainer(container, title, resolve, reject);
          }, 1000);
        });
      } else {
        // Fallback for browsers without Font Loading API
        setTimeout(() => {
          generatePDFFromContainer(container, title, resolve, reject);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error generating research PDF:', error);
      reject(error);
    }
  });
};

/**
 * Fallback PDF generation using jsPDF (if html2pdf fails)
 * @param {Object} researchDocument - Object containing { body, css, title }
 * @returns {Promise<String>} filename
 */
export const generateResearchReportPDFFallback = async (researchDocument) => {
  const { body, css, title } = researchDocument;
  
  return new Promise((resolve, reject) => {
    let container = null;
    
    // Shared cleanup helper
    const cleanup = () => {
      try {
        if (container && container.parentNode) {
          document.body.removeChild(container);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
    
    try {
      container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.backgroundColor = 'white';
      
      const styleElement = document.createElement('style');
      styleElement.textContent = css;
      container.appendChild(styleElement);
      
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = body;
      container.appendChild(contentDiv);
      
      document.body.appendChild(container);
      
      // Wait for fonts
      const fontLoadPromise = document.fonts?.ready || Promise.resolve();
      
      fontLoadPromise.then(() => {
        // Additional delay for rendering
        setTimeout(() => {
          try {
            const doc = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
            });
            
            doc.html(container, {
              callback: function(pdf) {
                cleanup();
                const filename = sanitizeFilename(title);
                pdf.save(filename);
                resolve(filename);
              },
              x: 10,
              y: 10,
              width: 190,
              windowWidth: 794,
              html2canvas: {
                scale: 2,
                logging: false,
                letterRendering: true,
                useCORS: true,
                scrollY: 0,
                scrollX: 0
              }
            });
          } catch (error) {
            cleanup();
            reject(error);
          }
        }, 500); // 500ms delay for rendering
      }).catch((error) => {
        cleanup();
        reject(error);
      });
      
    } catch (error) {
      console.error('Fallback PDF generation error:', error);
      cleanup();
      reject(error);
    }
  });
};

/**
 * Preview research document in a new window/tab
 * @param {Object} researchDocument - Object containing { body, css, title }
 */
export const previewResearchDocument = (researchDocument) => {
  const { body, css, title } = researchDocument;
  
  // Sanitize title for use in <title> tag (strip HTML tags)
  const sanitizedTitle = title ? title.replace(/<[^>]*>/g, '').trim() : 'Research Document';
  
  // Create full HTML document with proper structure
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${sanitizedTitle}</title>
      <style>${css}</style>
    </head>
    <body>
      ${body}
    </body>
    </html>
  `;
  
  // Open in new window
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  } else {
    console.error('Failed to open preview window. Please allow popups.');
  }
};
