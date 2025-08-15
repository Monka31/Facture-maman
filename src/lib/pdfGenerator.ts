import jsPDF from 'jspdf';
import ribImg from '../rib.png'; // chemin relatif depuis src/lib vers src/rib.png
import logoImg from '../logo.png'; // chemin relatif depuis src/lib vers src/rib.png

import { type Invoice } from '@/store/invoiceStore';

export const generatePDF = async (invoice: Invoice): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Margins
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  
  // Colors
  const primaryColor = '#680000';
  const textColor = '#333333' ;
  const lightGray = '#666666';
  
  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace(/\u202F|\u00A0/g, ' '); // remplace tout espace insécable par espace normal
  };

  const getDocumentTitle = (type: string) => {
    switch (type) {
      case 'invoice': return 'FACTURE';
      case 'quote': return 'DEVIS';
      case 'proforma': return 'FACTURE PROFORMA';
      default: return 'DOCUMENT';
    }
  };
  
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    pdf.setFontSize(options.fontSize || 10);
    pdf.setTextColor(options.color || textColor);
    pdf.setFont('helvetica', options.style || 'normal');
    
    if (options.align === 'right') {
      pdf.text(text, x, y, { align: 'right' });
    } else if (options.align === 'center') {
      pdf.text(text, x, y, { align: 'center' });
    } else {
      pdf.text(text, x, y);
    }
  };
  
  let currentY = margin;

  // Vérifie si on dépasse la page
  const checkPageOverflow = (heightToAdd = 0) => {
    if ((currentY + heightToAdd) > (pageHeight + 130)) {
      pdf.addPage();
      currentY =  +20;
    }
  };

  // Header
  checkPageOverflow(20);
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(margin, currentY, contentWidth, 15, 'F');
  
const rightMargin = pageWidth - margin - 5;

// Largeur du titre
const titleText = getDocumentTitle(invoice.type);
pdf.setFontSize(16);
pdf.setFont('helvetica', 'bold');
const titleWidth = pdf.getTextWidth(titleText);

// Position du numéro juste après le titre
const numberText = `N° ${invoice.number}`;
pdf.setFontSize(12);
pdf.setFont('helvetica', 'bold');
const numberWidth = pdf.getTextWidth(numberText);

// Décalage horizontal pour que tout reste à droite
const totalWidth = titleWidth + 5 + numberWidth; // 5 = espacement entre titre et numéro
const startX = rightMargin - totalWidth;

addText(titleText, startX, currentY + 10, {
  fontSize: 16,
  style: 'bold',
  color: '#FFFFFF'
});

addText(numberText, startX + titleWidth + 5, currentY + 10, {
  fontSize: 12,
  style: 'bold',
  color: '#FFFFFF'
});

  
  currentY += 20;
  
  pdf.addImage(logoImg, 'PNG', margin, currentY, 25, 12.5);
const companyStartY = currentY;
  currentY += 10;
// Company info (now left side)
  checkPageOverflow(30);

addText(invoice.company.name, margin, currentY, {
  fontSize: 14,
  style: 'bold',
  color: primaryColor
});
currentY += 8;

const companyLines = invoice.company.address.split('\n');
companyLines.forEach(line => {
  addText(line, margin, currentY, {
    fontSize: 9,
    color: lightGray
  });
  currentY += 5;

});

addText(`Tél: ${invoice.company.phone}`, margin, currentY, {
  fontSize: 9,
  color: lightGray
});
currentY += 5;

addText(`Email: ${invoice.company.email}`, margin, currentY, {
  fontSize: 9,
  color: lightGray
});
currentY += 5;

if (invoice.company.siret) {
  addText(`SIRET: ${invoice.company.siret}`, margin, currentY, {
    fontSize: 9,
    color: lightGray
  });
  currentY += 5;
}

if (invoice.company.vatNumber) {
  addText(`N° TVA: ${invoice.company.vatNumber}`, margin, currentY, {
    fontSize: 9,
    color: lightGray
  });
  currentY += 5;
}

// Document info (now right side)
currentY = companyStartY;
addText(`Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, currentY, {
  fontSize: 10,
  color: lightGray,
  align: 'right'
});
currentY += 6;

if (invoice.dueDate) {
  addText(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, pageWidth - margin, currentY, {
    fontSize: 10,
    color: lightGray,
    align: 'right'
  });
  currentY += 6;
}

  
  currentY = Math.max(currentY, companyStartY + 10);
  

  
// Client box
  checkPageOverflow(35);

pdf.setDrawColor('#E5E5E5');
pdf.setFillColor('#F8F8F8');
const clientBoxHeight = 35;
const boxWidth = contentWidth * 0.6;
const boxX = pageWidth - margin - boxWidth; // décale depuis la droite
pdf.rect(boxX, currentY, boxWidth, clientBoxHeight, 'FD');

currentY += 8;
const textX = boxX + 5; // petit padding à l'intérieur de la box

addText(invoice.client.name, textX, currentY, {
  fontSize: 11,
  style: 'bold'
});
currentY += 6;

const clientAddressLines = invoice.client.address.split('\n');
clientAddressLines.forEach(line => {
  addText(line, textX, currentY, {
    fontSize: 9,
    color: lightGray
  });
  currentY += 4;

});

currentY += 3;
addText(`Email: ${invoice.client.email}`, textX, currentY, {
  fontSize: 9,
  color: lightGray
});
currentY += 4;

addText(`Tél: ${invoice.client.phone}`, textX, currentY, {
  fontSize: 9,
  color: lightGray
});

  
  currentY += 25;
  
  // Items table
  const tableStartY = currentY;
  const colWidths = [95, 15, 30, 20, 20]; // mm
  const colHeaders = ['Désignation', 'Qté', 'Prix unit. HT', 'TVA', 'Total HT'];
  
  // Table header
pdf.setFillColor(primaryColor);
pdf.rect(margin, currentY, contentWidth, 8, 'F');

let currentX = margin;
colHeaders.forEach((header, index) => {
  let align: 'left' | 'center' | 'right' = 'left';
  if (index === 1 || index === 3 || index === 2 || index === 4) align = 'center';
  if (index === 5) align = 'right';

  // Position X pour le titre selon alignement
  let textX = currentX + 3; // par défaut left
  if (align === 'center') {
    textX = currentX + colWidths[index] / 2;
    if (index === 4) {
      textX = currentX + colWidths[index] -6; // même ajustement que pour les lignes
    }
  } else if (align === 'right') {
    textX = currentX + colWidths[index] - 3;
    
  }

  addText(header, textX, currentY + 6, {
    fontSize: 9,
    style: 'bold',
    color: '#FFFFFF',
    align
  });

  currentX += colWidths[index];
});

  
  currentY += 8;
  
 // Table rows
invoice.items.forEach((item, index) => {
    checkPageOverflow(8);
  const lineTotal = item.quantity * item.unitPrice;
  // const discount = item.discountType === 'percentage' 
  //   ? lineTotal * (item.discount / 100)
  //   : item.discount;
  const totalHT = lineTotal; // pas de remise

  if (index % 2 === 0) {
    pdf.setFillColor('#F8F8F8');
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
  }

  currentX = margin;
  const rowData = [
    item.designation.length > 35 ? item.designation.substring(0, 35) + '...' : item.designation,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    `${item.vatRate}%`,
    formatCurrency(totalHT) // plus de remise
  ];

  rowData.forEach((data, colIndex) => {
  let align: 'left' | 'center' | 'right' = 'left';

  if (colIndex === 1 || colIndex === 3) {
    align = 'center'; // Qté et TVA
  }
  if (colIndex === 2 || colIndex === 4 ) {
    align = 'right'; // Prix unit. HT et Total HT
  }

  // Position X pour le texte selon l'alignement
  let textX = currentX + 3; // par défaut pour align left
  if (align === 'center') {
    textX = currentX + colWidths[colIndex] / 2;
  } else if (align === 'right') {
    textX = currentX + colWidths[colIndex] - 3;
    if (colIndex === 4 ) {
      textX = currentX + colWidths[colIndex] + 7;
    }
  }

  addText(data, textX, currentY + 6, {
    fontSize: 9,
    align
  });

  currentX += colWidths[colIndex];
  });


    currentY += 8;
  });

  
  // Table border
  pdf.setDrawColor('#E5E5E5');
  pdf.rect(margin, tableStartY, contentWidth, currentY - tableStartY);
  
  // Column separators
  currentX = margin;
  colWidths.slice(0, -1).forEach(width => {
    currentX += width;
    pdf.line(currentX, tableStartY, currentX, currentY);
  });
  
  currentY += 5;
  
  // Totals box
  checkPageOverflow(30);

  const totalsBoxWidth = 80;
  const totalsStartY = currentY;
  
  pdf.setFillColor('#F8F8F8');
  pdf.rect(pageWidth - margin - totalsBoxWidth, currentY, totalsBoxWidth, 25, 'FD');
  currentY += 8;
  addText('Total HT :', pageWidth - margin - totalsBoxWidth + 5, currentY, {
    fontSize: 10,
    color: lightGray
  });
  addText(formatCurrency(invoice.totalHT), pageWidth - margin - 5, currentY, {
    fontSize: 10,
    style: 'bold',
    align: 'right'
  });
  
  currentY += 6;
  addText('Total TVA :', pageWidth - margin - totalsBoxWidth + 5, currentY, {
    fontSize: 10,
    color: lightGray
  });
  addText(formatCurrency(invoice.totalVAT), pageWidth - margin - 5, currentY, {
    fontSize: 10,
    style: 'bold',
    align: 'right'
  });


  
  currentY += 8;
  pdf.setDrawColor(primaryColor);
  pdf.line(
    pageWidth - margin - totalsBoxWidth + 5,
    currentY - 5,
    pageWidth - margin - 5,
    currentY - 5
  );
  
  addText('Total TTC :', pageWidth - margin - totalsBoxWidth + 5, currentY, {
    fontSize: 12,
    style: 'bold',
    color: primaryColor
  });
  addText(formatCurrency(invoice.totalTTC), pageWidth - margin - 5, currentY, {
    fontSize: 12,
    style: 'bold',
    color: primaryColor,
    align: 'right'
  });
  currentY += 30;

  checkPageOverflow(180);

// currentY est la position verticale après tout le contenu
pdf.addImage(ribImg, 'PNG', 28.5, currentY, 150, 75);

  currentY += 80;


  // Notes and terms
  if (invoice.notes) {
    checkPageOverflow(20);
    addText('Notes :', margin, currentY, {
      fontSize: 11,
      style: 'bold',
      color: primaryColor
    });
    currentY += 5;
    
    const noteLines = pdf.splitTextToSize(invoice.notes, contentWidth * 0.8);
    noteLines.forEach((line: string) => {
      checkPageOverflow(5);
      addText(line, margin, currentY, {
        fontSize: 9,
        color: lightGray
      });
      currentY += 5;
    });
    currentY += 5;
  }


  
  if (invoice.terms) {
    checkPageOverflow(20);
    addText('Conditions de paiement :', margin, currentY, {
      fontSize: 11,
      style: 'bold',
      color: primaryColor
    });
    currentY += 5;
    


    const termLines = pdf.splitTextToSize(invoice.terms, contentWidth * 0.8);
    termLines.forEach((line: string) => {
      checkPageOverflow(5);
      addText(line, margin, currentY, {
        fontSize: 9,
        color: lightGray
      });
      currentY += 5;
    });
  }
  


  // Signature
  if (invoice.signature) {
    currentY = Math.max(currentY + 10, pageHeight - 50);
    addText('Signature:', margin, currentY, {
      fontSize: 10,
      style: 'bold',
      color: primaryColor
    });
    pdf.addImage(invoice.signature, 'PNG', margin + 25, currentY - 5, 50, 20);
  }

  // --- Ajout du RIB ---

 
  

  
  // Save PDF
  pdf.save(`${invoice.type}_${invoice.number}.pdf`);
};
