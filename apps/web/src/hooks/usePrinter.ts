/**
 * Hook for printer integration
 * Supports Browser Print and RawBT (Android direct print)
 */

export function usePrinter() {
  /**
   * Print receipt using browser print dialog
   */
  const printViaBrowser = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const printWindow = window.open("", "", "width=300,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: monospace; 
              font-size: 12px; 
              width: 58mm; 
              margin: 0; 
              padding: 8px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  /**
   * Print via RawBT (Android direct print to thermal printer)
   * @param base64Image - Base64 encoded receipt image
   */
  const printViaRawBT = (base64Image: string) => {
    window.location.href = `rawbt:data:image/png;base64,${base64Image}`;
  };

  /**
   * Check if RawBT is available (Android only)
   */
  const isRawBTAvailable = () => {
    return /Android/i.test(navigator.userAgent);
  };

  return {
    printViaBrowser,
    printViaRawBT,
    isRawBTAvailable,
  };
}
