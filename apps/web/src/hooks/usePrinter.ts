import { useState, useEffect, useCallback } from "react";

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
  };
}

export interface PrinterSettings {
  type: "browser" | "rawbt" | "bluetooth";
  autoConnect: boolean;
  printQRIS: boolean;
  deviceName?: string; // For Bluetooth
  deviceId?: string; // For Bluetooth
}

const DEFAULT_SETTINGS: PrinterSettings = {
  type: "browser",
  autoConnect: false,
  printQRIS: false,
};

export function usePrinter() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
  const [isConnected, setIsConnected] = useState(false);
  const [printerName, setPrinterName] = useState<string | undefined>(undefined);
  const [bluetoothDevice, setBluetoothDevice] =
    useState<BluetoothDevice | null>(null);

  // Load settings from storage
  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line
        setSettings(parsed);
        if (parsed.type !== "browser") {
          setPrinterName(
            parsed.deviceName ||
              (parsed.type === "rawbt" ? "RawBT App" : undefined),
          );
        }
      } catch (e) {
        console.error("Failed to load printer settings", e);
      }
    }
  }, []);

  // Save settings to storage
  const updateSettings = useCallback((newSettings: PrinterSettings) => {
    setSettings(newSettings);
    localStorage.setItem("printer_settings", JSON.stringify(newSettings));
    if (newSettings.type === "rawbt") {
      setIsConnected(true);
      setPrinterName("RawBT App");
    } else if (newSettings.type === "browser") {
      setIsConnected(false);
      setPrinterName(undefined);
    }
  }, []);

  // Auto-connect
  const autoConnect = useCallback(async () => {
    const saved = localStorage.getItem("printer_settings");
    if (!saved) return;

    const config = JSON.parse(saved) as PrinterSettings;
    if (!config.autoConnect) return;

    if (config.type === "rawbt") {
      setIsConnected(true);
      setPrinterName("RawBT App");
    } else if (config.type === "bluetooth" && config.deviceId) {
      // Try to reconnect Bluetooth (requires previously authorized device)
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - navigator.bluetooth is experimental
        const devices = await navigator.bluetooth.getDevices();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const device = devices.find((d: any) => d.id === config.deviceId);
        if (device) {
          await device.gatt?.connect();
          setBluetoothDevice(device);
          setPrinterName(device.name);
          setIsConnected(true);
        }
      } catch (err) {
        console.warn("Auto-connect bluetooth failed:", err);
      }
    }
  }, []);

  // Manual Connect
  const connect = useCallback(
    async (type: "rawbt" | "bluetooth") => {
      if (type === "rawbt") {
        updateSettings({ ...settings, type: "rawbt" });
        return;
      }

      if (type === "bluetooth") {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }], // Standard Invoice Service UUID or generic
            acceptAllDevices: true, // For development/broad support
            optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
          });

          await device.gatt?.connect();
          setBluetoothDevice(device);
          setIsConnected(true);
          setPrinterName(device.name);

          updateSettings({
            ...settings,
            type: "bluetooth",
            deviceName: device.name,
            deviceId: device.id,
          });
        } catch (err) {
          console.error("Bluetooth connection failed", err);
          throw err;
        }
      }
    },
    [settings, updateSettings],
  );

  const disconnect = useCallback(() => {
    if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setBluetoothDevice(null);
    setIsConnected(false);
    setPrinterName(undefined);
    updateSettings({ ...settings, type: "browser" }); // Revert to browser
  }, [bluetoothDevice, settings, updateSettings]);

  /**
   * Print Content
   * @param contentHTML - HTML string of receipt
   */
  const print = useCallback(
    async (contentHTML: string) => {
      if (settings.type === "browser") {
        // Create a hidden frame
        const printWindow = window.open("", "", "width=300,height=600");
        if (!printWindow) return;

        printWindow.document.write(`
                <html>
                    <head>
                        <title>Receipt</title>
                        <style>
                            body { font-family: monospace; font-size: 12px; width: 58mm; margin: 0; padding: 8px; }
                            @media print { body { margin: 0; } }
                        </style>
                    </head>
                    <body>${contentHTML}</body>
                </html>
            `);
        printWindow.document.close();
        // Wait for QRCodes to render if any
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      } else if (settings.type === "rawbt") {
        // Simple Base64 approach or Intent approach
        const base64 = btoa(contentHTML);
        window.location.href = `rawbt:data:text/html;base64,${base64}`;
      } else if (settings.type === "bluetooth" && bluetoothDevice) {
        console.log(
          "Printing via Bluetooth (Stubbed - requires HTML to ESC/POS conversion)",
        );
        alert(
          "Bluetooth printing implementation requires ESC/POS encoder library.",
        );
      }
    },
    [settings, bluetoothDevice],
  );

  return {
    isConnected,
    printerName,
    settings,
    updateSettings,
    connect,
    disconnect,
    print,
    autoConnect,
  };
}
