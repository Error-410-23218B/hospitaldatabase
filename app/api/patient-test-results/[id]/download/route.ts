import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  const id = params.id;

  try {
    // Fetch test result by id with related parameters and doctor
    const testResult = await prisma.testResult.findUnique({
      where: { id: Number(id) },
      include: {
        doctor: true,
        parameters: true,
      },
    });

    if (!testResult) {
      return NextResponse.json({ error: "Test result not found" }, { status: 404 });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSizeTitle = 20;
    const fontSizeText = 12;
    let yPosition = height - 50;

    // Title
    page.drawText(`Test Result: ${testResult.testName}`, {
      x: 50,
      y: yPosition,
      size: fontSizeTitle,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= fontSizeTitle + 20;

    // Details
    const details = [
      `Date: ${testResult.date.toISOString().split("T")[0]}`,
      `Time: ${testResult.time}`,
      `Doctor: ${testResult.doctor.firstName} ${testResult.doctor.lastName}`,
      `Department: ${testResult.department}`,
      `Status: ${testResult.status}`,
      `Priority: ${testResult.priority}`,
    ];

    details.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSizeText,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= fontSizeText + 5;
    });

    yPosition -= fontSizeText + 10;

    // Draw table headers
    const tableX = 50;
    const tableY = yPosition;
    const colWidths = [120, 60, 60, 100, 80]; // widths for parameter, value, unit, range, status
    const rowHeight = fontSizeText + 8;

    const headers = ["Parameter", "Value", "Unit", "Range", "Status"];
    let x = tableX;
    headers.forEach((header, i) => {
      page.drawText(header, {
        x,
        y: tableY,
        size: fontSizeText,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      x += colWidths[i];
    });

    yPosition = tableY - rowHeight;

    // Draw table rows
    testResult.parameters.forEach((param) => {
      let x = tableX;
      const row = [
        param.parameter,
        param.value.toString(),
        param.unit || "",
        param.range || "",
        param.status || "",
      ];
      row.forEach((text, i) => {
        page.drawText(text, {
          x,
          y: yPosition,
          size: fontSizeText,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i];
      });
      yPosition -= rowHeight;
    });

    yPosition -= fontSizeText + 10;

    // Doctor's notes
    if (testResult.notes) {
      page.drawText("Doctor's Notes:", {
        x: 50,
        y: yPosition,
        size: fontSizeText,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= fontSizeText + 5;

      // Split notes into lines if too long
      const maxWidth = width - 100;
      const words = testResult.notes.split(" ");
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSizeText);
        if (textWidth > maxWidth) {
          page.drawText(line, {
            x: 60,
            y: yPosition,
            size: fontSizeText,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          });
          line = words[i] + " ";
          yPosition -= fontSizeText + 5;
        } else {
          line = testLine;
        }
      }
      if (line) {
        page.drawText(line, {
          x: 60,
          y: yPosition,
          size: fontSizeText,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= fontSizeText + 5;
      }
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Save PDF to public/reports folder
    const fs = require("fs");
    const path = require("path");
    const reportsDir = path.resolve("./public/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const fileName = `test-result-${testResult.id}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, pdfBytes);

    // Update testResult with downloadUrl
    const downloadUrl = `/reports/${fileName}`;
    await prisma.testResult.update({
      where: { id: testResult.id },
      data: { downloadUrl },
    });

    // Return the download URL
    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating test result PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
