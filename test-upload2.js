import fs from 'fs';
import PDFDocument from 'pdfkit';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test2.pdf'));
doc.fontSize(25).text('Some text for the PDF that is longer than 50 characters so it parses into a paragraph, and another one.', 100, 100);
doc.end();
