import { describe, expect, it, vi } from "vitest";
import { extractBillTextLocally } from "../../src/services/localBillOcrService";

describe("extractBillTextLocally", () => {
  it("reads plain-text bills locally without starting OCR", async () => {
    const file = new File(["BESCOM\nUnits Consumed: 250"], "bill.txt", {
      type: "text/plain",
    });

    await expect(extractBillTextLocally(file, vi.fn())).resolves.toBe(
      "BESCOM\nUnits Consumed: 250"
    );
  });

  it("rejects unsupported files", async () => {
    const file = new File(["not a bill"], "bill.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    await expect(extractBillTextLocally(file, vi.fn())).rejects.toThrow(
      "Unsupported file"
    );
  });

  it("rejects files over the local processing size limit", async () => {
    const file = new File([new Uint8Array(12 * 1024 * 1024 + 1)], "bill.png", {
      type: "image/png",
    });

    await expect(extractBillTextLocally(file, vi.fn())).rejects.toThrow(
      "under 12 MB"
    );
  });
});
