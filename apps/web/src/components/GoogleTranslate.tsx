'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

declare global {
    interface Window {
        google: {
            translate: {
                TranslateElement: new (
                    options: {
                        pageLanguage: string;
                        includedLanguages: string;
                        autoDisplay: boolean;
                        layout?: number;
                    },
                    elementId: string
                ) => void;
            };
        };
        googleTranslateElementInit: () => void;
    }
}

export const GoogleTranslate = () => {
    const { language } = useAuthStore();

    useEffect(() => {
        // Function to initialize Google Translate
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'id',
                    includedLanguages: 'id,en',
                    autoDisplay: false,
                },
                'google_translate_element'
            );
        };

        // Load the script if not already loaded
        if (!document.querySelector('#google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        }

        // Handle language change via cookies and reload if necessary
        // Google Translate uses 'googtrans' cookie: /source/target
        const currentCookie = getCookie('googtrans');
        const targetCookie = language === 'en' ? '/id/en' : '/id/id';

        if (currentCookie !== targetCookie) {
            // Set cookie for automatic translation
            setCookie('googtrans', targetCookie, 1); // 1 day
            // We need to reload to apply the translation if the script has already run
            // or if we are switching languages. 
            // However, to avoid infinite loops, we only reload if the cookie was actually different
            // AND we expect the widget to pick it up.

            // For a smoother experience, we can try to find the actual widget frame and change it,
            // but the robust way "without dictionary" for full page is the cookie + reload method.
            window.location.reload();
        }
    }, [language]);

    return (
        <div id="google_translate_element" className="fixed bottom-0 right-0 z-[9999] opacity-0 pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true" />
    );
};

// Helper to set cookie
function setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Helper to get cookie
function getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
