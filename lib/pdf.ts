import fs from "fs";
import { PDFDocument } from "pdf-lib";

export async function mergePDFs(pdfPaths: Array<string>, outputPath: string) {
  const mergedPdf = await PDFDocument.create();
  for (const pdfPath of pdfPaths) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);
  return outputPath;
}
