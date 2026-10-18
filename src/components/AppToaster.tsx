"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "border-2 border-black bg-white text-black shadow-[4px_4px_0_#000]",
          title: "font-black text-black",
          description: "text-black/70",
          actionButton: "bg-[#ffe17c] text-black border-2 border-black",
          cancelButton: "bg-white text-black border-2 border-black",
          closeButton: "border-2 border-black bg-white text-black",
        },
      }}
    />
  );
}
