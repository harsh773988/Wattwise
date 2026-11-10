const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_PDF_PAGES = 3;
const MIN_PDF_TEXT_LENGTH = 80;

export interface OcrProgress {
  message: string;
  progress: number | null;
}

function assertSupportedFile(file: File): "image" | "pdf" | "text" {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Please choose a bill under 12 MB.");
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (
    file.type === "text/plain" ||
    file.name.toLowerCase().endsWith(".txt")
  ) {
    return "text";
  }

  throw new Error("Unsupported file. Choose an image, PDF, or plain-text bill.");
}

async function recognizeImage(
  image: File | HTMLCanvasElement,
  onProgress: (progress: OcrProgress) => void
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: `${window.location.origin}/wattwise-ocr/worker.min.js`,
    corePath: `${window.location.origin}/wattwise-ocr/tesseract-core-lstm.wasm.js`,
    workerBlobURL: false,
    logger: ({ status, progress }) => {
      onProgress({
        message: status,
        progress: Number.isFinite(progress) ? progress : null,
      });
    },
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractPdfText(
  file: File,
  onProgress: (progress: OcrProgress) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({
    data: await file.arrayBuffer(),
  });
  const document = await loadingTask.promise;

  try {
    if (document.numPages > MAX_PDF_PAGES) {
      throw new Error("For privacy and performance, scan a PDF with 3 pages or fewer.");
    }

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      onProgress({
        message: `Reading PDF page ${pageNumber} of ${document.numPages}`,
        progress: pageNumber / document.numPages,
      });
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
      );
    }

    const text = pages.join("\n").trim();
    if (text.length >= MIN_PDF_TEXT_LENGTH) {
      return text;
    }

    const ocrPages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      onProgress({
        message: `Preparing scanned PDF page ${pageNumber} of ${document.numPages}`,
        progress: (pageNumber - 1) / document.numPages,
      });
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not prepare the PDF page for local text recognition.");
      }

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      ocrPages.push(await recognizeImage(canvas, onProgress));
      canvas.width = 0;
      canvas.height = 0;
    }

    return ocrPages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

export async function extractBillTextLocally(
  file: File,
  onProgress: (progress: OcrProgress) => void
): Promise<string> {
  const fileKind = assertSupportedFile(file);

  if (fileKind === "text") {
    return file.text();
  }

  if (fileKind === "pdf") {
    return extractPdfText(file, onProgress);
  }

  onProgress({ message: "Starting local text recognition", progress: null });
  return recognizeImage(file, onProgress);
}
