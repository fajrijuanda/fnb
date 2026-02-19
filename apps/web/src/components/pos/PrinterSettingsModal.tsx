'use client';

import { useState, useEffect } from 'react';
import { X, Printer, Bluetooth, Smartphone, Save, RotateCcw } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { useToast } from '@/components/ToastContext';

interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
    const {
        isConnected,
        printerName,
        settings,
        updateSettings,
        connect,
        disconnect,
        print
    } = usePrinter();
    const { success, error } = useToast();

    // Internal state for form to avoid flicker before save
    const [localSettings, setLocalSettings] = useState(settings);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        updateSettings(localSettings);
        success('Pengaturan printer disimpan');
        onClose();
    };

    const handleTestPrint = async () => {
        setIsTesting(true);
        try {
            await print(
                `<div style="text-align:center; font-family:monospace;">
                    <h3>TEST PRINT</h3>
                    <p>Printer Connected!</p>
                    <p>----------------</p>
                    <p>FNB System</p>
                </div>`
            );
            success('Test print dikirim');
        } catch (err) {
            console.error(err);
            error('Gagal melakukan test print');
        } finally {
            setIsTesting(false);
        }
    };

    const handleConnectBluetooth = () => {
        connect('bluetooth').catch(() => {
            error('Gagal terhubung ke printer Bluetooth');
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary">
                            <Printer className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Pengaturan Printer</h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Koneksi dan preferensi cetak</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Status Section */}
                    <div className={`p-4 rounded-xl border ${isConnected
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Koneksi</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isConnected
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                                }`}>
                                {isConnected ? 'TERHUBUNG' : 'TERPUTUS'}
                            </span>
                        </div>

                        {isConnected ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bluetooth className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{printerName || 'Unknown Device'}</span>
                                </div>
                                <button
                                    onClick={disconnect}
                                    className="text-xs text-red-500 hover:text-red-400 font-medium"
                                >
                                    Putuskan
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pilih metode koneksi:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleConnectBluetooth}
                                        className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                                    >
                                        <Bluetooth className="h-4 w-4" />
                                        <span className="text-xs font-bold">Bluetooth</span>
                                    </button>
                                    <button
                                        onClick={() => connect('rawbt')}
                                        className="flex items-center justify-center gap-2 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                                    >
                                        <Smartphone className="h-4 w-4" />
                                        <span className="text-xs font-bold">RawBT (Android)</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preferences */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferensi</label>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Connect</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Hubungkan otomatis saat login</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.autoConnect}
                                    onChange={(e) => setLocalSettings({ ...localSettings, autoConnect: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Cetak QRIS</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Tampilkan QR code di struk</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.printQRIS}
                                    onChange={(e) => setLocalSettings({ ...localSettings, printQRIS: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-3 bg-gray-50 dark:bg-white/5">
                    <button
                        onClick={handleTestPrint}
                        disabled={!isConnected || isTesting}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <RotateCcw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        Test Print
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
