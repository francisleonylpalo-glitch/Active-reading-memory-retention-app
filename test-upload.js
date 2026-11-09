import fs from 'fs';
import PDFDocument from 'pdfkit';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));
doc.fontSize(25).text('Some text for the PDF', 100, 100);
doc.end();
