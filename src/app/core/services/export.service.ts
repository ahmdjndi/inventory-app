import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToExcel<T>(data: T[], columns: ExportColumn<T>[], filename: string): void {
    const rows = data.map((row) => {
      const obj: Record<string, string | number> = {};
      for (const col of columns) {
        obj[col.header] = col.accessor(row);
      }
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  exportToPdf<T>(data: T[], columns: ExportColumn<T>[], filename: string, title: string): void {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Diekspor: ${new Date().toLocaleString('id-ID')} — ${data.length} baris`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [columns.map((c) => c.header)],
      body: data.map((row) => columns.map((c) => String(c.accessor(row)))),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [16, 128, 93] },
    });

    doc.save(`${filename}.pdf`);
  }
}