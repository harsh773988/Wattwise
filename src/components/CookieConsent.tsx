"use client";

import { useState } from "react";

const STORAGE_KEY = "wattwise-cookie-consent";

function getInitialConsentVisibility() {
  if (typeof window === "undefined") {
    return false;
  }

  const consent = window.localStorage.getItem(STORAGE_KEY);
  const enabled = Boolean(process.env.NEXT_PUBLIC_GA_ID);
  return enabled && consent === null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(getInitialConsentVisibility);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    window.localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] rounded-none border-2 border-black bg-[#fbfbf8] p-4 shadow-[6px_6px_0_#000] sm:left-auto sm:right-4 sm:max-w-md">
      <p className="text-sm font-bold text-black">
        We use analytics cookies only if you opt in.
      </p>
      <p className="mt-2 text-xs leading-5 text-black/70">
        This helps us understand which pages are useful to visitors without tracking personal data.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="neo-btn flex-1 bg-[#ffe17c] px-3 py-2 text-xs font-black text-black"
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={decline}
          className="neo-btn flex-1 bg-white px-3 py-2 text-xs font-black text-black"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
