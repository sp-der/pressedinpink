export type InvoicePdfLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: string;
  lines: InvoicePdfLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function ascii(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncate(value: string, length: number): string {
  const cleaned = ascii(value.trim());
  return cleaned.length > length
    ? `${cleaned.slice(0, Math.max(0, length - 3))}...`
    : cleaned;
}

function text(
  value: string,
  x: number,
  y: number,
  size = 10,
  bold = false,
): string {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${ascii(
    value,
  )}) Tj ET\n`;
}

function rightText(
  value: string,
  rightX: number,
  y: number,
  size = 10,
  bold = false,
): string {
  const estimatedWidth = ascii(value).length * size * 0.52;
  return text(
    value,
    Math.max(20, rightX - estimatedWidth),
    y,
    size,
    bold,
  );
}

function buildPageContent(
  invoice: InvoicePdfData,
  lines: InvoicePdfLine[],
  pageNumber: number,
  pageCount: number,
): string {
  let stream = "";
  stream += "0 0 0 rg 0 688 612 104 re f\n";
  stream += "1 1 1 rg\n";
  stream += text("PRESSED IN PINK", 44, 744, 23, true);
  stream += text(
    "CUSTOM CREATIONS MADE TO STAND OUT",
    44,
    722,
    9,
    true,
  );
  stream += rightText("INVOICE", 568, 744, 19, true);
  stream += rightText(invoice.invoiceNumber, 568, 722, 9, false);
  stream += "0 0 0 rg\n";

  let y = 655;

  if (pageNumber === 1) {
    stream += text("BILL TO", 44, y, 10, true);
    stream += text("DETAILS", 377, y, 10, true);
    stream += text(
      truncate(invoice.customerName, 44),
      44,
      y - 20,
      11,
    );
    stream += text(
      truncate(invoice.customerEmail, 48),
      44,
      y - 38,
      10,
    );
    stream += text(
      `Invoice date: ${invoice.invoiceDate}`,
      377,
      y - 20,
      10,
    );
    stream += text(
      `Order: ${invoice.orderNumber}`,
      377,
      y - 38,
      10,
    );
    y -= 72;
  } else {
    stream += text(
      `Invoice items continued - page ${pageNumber} of ${pageCount}`,
      44,
      y,
      10,
      true,
    );
    y -= 32;
  }

  stream += "0.92 0.14 0.16 rg 44 " + (y - 8) + " 524 26 re f\n";
  stream += "1 1 1 rg\n";
  stream += text("DESCRIPTION", 54, y, 9, true);
  stream += rightText("QTY", 390, y, 9, true);
  stream += rightText("PRICE", 478, y, 9, true);
  stream += rightText("TOTAL", 558, y, 9, true);
  stream += "0 0 0 rg\n";
  y -= 32;

  for (const line of lines) {
    stream += text(truncate(line.description, 46), 54, y, 9);
    stream += rightText(String(line.quantity), 390, y, 9);
    stream += rightText(currency.format(line.unitPrice), 478, y, 9);
    stream += rightText(currency.format(line.lineTotal), 558, y, 9);
    stream += `0.86 0.86 0.86 RG 44 ${y - 8} 524 0 re S\n`;
    y -= 24;
  }

  const isLastPage = pageNumber === pageCount;

  if (isLastPage) {
    y -= 12;
    const labelX = 390;
    const valueX = 558;
    const rows: [string, number][] = [
      ["Subtotal", invoice.subtotal],
      ["Shipping", invoice.shipping],
      ["Discount", -invoice.discount],
      ["Tax", invoice.tax],
    ];

    for (const [label, value] of rows) {
      stream += text(label, labelX, y, 10);
      stream += rightText(currency.format(value), valueX, y, 10);
      y -= 20;
    }

    stream += `0.92 0.14 0.16 RG 390 ${y + 8} 168 0 re S\n`;
    stream += text("TOTAL", labelX, y - 8, 13, true);
    stream += rightText(
      currency.format(invoice.total),
      valueX,
      y - 8,
      13,
      true,
    );
    y -= 48;

    if (invoice.notes.trim()) {
      stream += text("NOTES", 44, y, 10, true);
      const note = truncate(invoice.notes.replace(/\s+/g, " "), 155);
      const firstLine = note.slice(0, 78);
      const secondLine = note.slice(78);
      stream += text(firstLine, 44, y - 18, 9);
      if (secondLine) {
        stream += text(secondLine, 44, y - 34, 9);
      }
    }
  }

  stream += "0.35 0.35 0.35 rg\n";
  stream += text(
    "Thank you for choosing Pressed In Pink. support@pressedinpink.com",
    132,
    28,
    8,
  );

  return stream;
}

export function buildInvoicePdf(
  invoice: InvoicePdfData,
): Uint8Array {
  const linesPerFirstPage = 15;
  const linesPerLaterPage = 20;
  const pages: InvoicePdfLine[][] = [];
  let cursor = 0;

  pages.push(invoice.lines.slice(0, linesPerFirstPage));
  cursor = linesPerFirstPage;

  while (cursor < invoice.lines.length) {
    pages.push(
      invoice.lines.slice(cursor, cursor + linesPerLaterPage),
    );
    cursor += linesPerLaterPage;
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let nextObjectId = 5;

  pages.forEach(() => {
    pageObjectIds.push(nextObjectId);
    contentObjectIds.push(nextObjectId + 1);
    nextObjectId += 2;
  });

  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] >>`;

  pages.forEach((pageLines, index) => {
    const pageId = pageObjectIds[index];
    const contentId = contentObjectIds[index];
    const content = buildPageContent(
      invoice,
      pageLines,
      index + 1,
      pages.length,
    );
    const contentLength = new TextEncoder().encode(content).length;

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${contentLength} >>\nstream\n${content}endstream`;
  });

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteOffset = 0;

  const push = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    byteOffset += bytes.length;
  };

  push("%PDF-1.4\n");

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = byteOffset;
    push(`${id} 0 obj\n${objects[id]}\nendobj\n`);
  }

  const xrefOffset = byteOffset;
  push(`xref\n0 ${objects.length}\n`);
  push("0000000000 65535 f \n");

  for (let id = 1; id < objects.length; id += 1) {
    push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  push(
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`,
  );

  const totalLength = chunks.reduce(
    (sum, chunk) => sum + chunk.length,
    0,
  );
  const output = new Uint8Array(totalLength);
  let outputOffset = 0;

  for (const chunk of chunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.length;
  }

  return output;
}

export function invoicePdfBase64(
  invoice: InvoicePdfData,
): string {
  const bytes = buildInvoicePdf(invoice);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize),
    );
  }

  return window.btoa(binary);
}

export function downloadInvoicePdf(
  invoice: InvoicePdfData,
): void {
  const bytes = buildInvoicePdf(invoice);
  const blob = new Blob([bytes], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
