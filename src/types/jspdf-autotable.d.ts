// Type declaration shim for jspdf-autotable to avoid build-time type issues
// Allows both default import usage and (doc as any).autoTable patterns

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  // Minimal typing to keep build resilient
  const autoTable: (doc: jsPDF | any, options?: any) => any;
  export default autoTable;
}
