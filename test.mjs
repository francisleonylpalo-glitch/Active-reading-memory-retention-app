import { PDFParse } from 'pdf-parse';
import fs from 'fs';
async function run() {
  const buf = fs.readFileSync('package.json');
  const parser = new PDFParse({ data: buf });
  const res = await parser.getText();
  console.log(res);
}
run().catch(console.error);
