/**
 * Lazy loading para bibliotecas pesadas de exportação
 * Carrega apenas quando necessário, reduzindo o bundle inicial
 */

/**
 * Lazy load da biblioteca jsPDF
 * Carrega apenas quando o usuário solicita exportação PDF
 */
export const loadPdfLib = async () => {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = await import('jspdf-autotable');
  return { jsPDF, autoTable };
};

/**
 * Lazy load da biblioteca XLSX
 * Carrega apenas quando o usuário solicita exportação Excel
 */
export const loadExcelLib = async () => {
  const XLSX = await import('xlsx');
  return XLSX;
};

/**
 * Exporta dados para PDF com lazy loading
 */
export const exportToPDF = async (
  data: any[],
  columns: string[],
  fileName: string = 'export.pdf'
) => {
  try {
    const { jsPDF } = await loadPdfLib();
    const doc = new jsPDF();

    // Adicionar título
    doc.setFontSize(16);
    doc.text(fileName.replace('.pdf', ''), 14, 15);

    // Adicionar tabela
    const tableData = data.map((row) =>
      columns.map((col) => row[col] || '')
    );

    (doc as any).autoTable({
      head: [columns],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    // Salvar PDF
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

/**
 * Exporta dados para Excel com lazy loading
 */
export const exportToExcel = async (
  data: any[],
  fileName: string = 'export.xlsx',
  sheetName: string = 'Sheet1'
) => {
  try {
    const XLSX = await loadExcelLib();

    // Criar worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};
