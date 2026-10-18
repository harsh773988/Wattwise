/**
 * Web Worker for parsing large CSV files (100k+ rows) without freezing the UI thread.
 * Uses streaming chunk parsing and emits progress events.
 */

import Papa from "papaparse";

export interface WorkerParseResult {
  rows: Record<string, string>[];
  totalRows: number;
}

export interface WorkerProgressEvent {
  type: "progress";
  percentage: number;
  rowsLoaded: number;
}

export interface WorkerSuccessEvent {
  type: "success";
  rows: Record<string, string>[];
}

export interface WorkerErrorEvent {
  type: "error";
  message: string;
}

/**
 * Worker script code as string, allowing zero-config inline Blob instantiation.
 * Works seamlessly in Next.js Turbopack and standard Webpack without worker loader issues.
 */
const WORKER_CODE = `
self.onmessage = function(e) {
  const { fileContent } = e.data;
  
  if (!fileContent || typeof fileContent !== 'string') {
    self.postMessage({ type: 'error', message: 'No file content provided' });
    return;
  }

  const lines = fileContent.split(/\\r?\\n/).filter(line => line.trim().length > 0);
  const totalLines = lines.length;
  
  if (totalLines <= 1) {
    self.postMessage({ type: 'success', rows: [] });
    return;
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  const rows = [];
  const chunkSize = 5000;
  let currentIndex = 1;

  function processChunk() {
    const end = Math.min(currentIndex + chunkSize, totalLines);
    for (let i = currentIndex; i < end; i++) {
      const line = lines[i];
      if (!line) continue;
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] !== undefined ? values[j] : '';
      }
      rows.push(row);
    }
    currentIndex = end;

    const percentage = Math.min(100, Math.round((currentIndex / totalLines) * 100));
    self.postMessage({ 
      type: 'progress', 
      percentage, 
      rowsLoaded: rows.length 
    });

    if (currentIndex < totalLines) {
      setTimeout(processChunk, 0);
    } else {
      self.postMessage({ type: 'success', rows });
    }
  }

  processChunk();
};
`;

/**
 * Parse CSV text using a Web Worker with chunked progress reporting.
 * Falls back to PapaParse if Web Workers are unavailable (e.g. Node.js environment).
 */
export async function parseCsvWithWorker(
  fileContent: string,
  onProgress?: (percentage: number, rowsLoaded: number) => void,
): Promise<Record<string, string>[]> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    // SSR / Node environment fallback using PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err: Error) => reject(err),
      });
    });
  }

  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    let objectUrl: string | null = null;

    try {
      const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
      objectUrl = URL.createObjectURL(blob);
      worker = new Worker(objectUrl);

      worker.onmessage = (event: MessageEvent<WorkerProgressEvent | WorkerSuccessEvent | WorkerErrorEvent>) => {
        const data = event.data;
        if (data.type === "progress") {
          onProgress?.(data.percentage, data.rowsLoaded);
        } else if (data.type === "success") {
          cleanup();
          resolve(data.rows);
        } else if (data.type === "error") {
          cleanup();
          reject(new Error(data.message));
        }
      };

      worker.onerror = (err) => {
        cleanup();
        reject(new Error(`Worker error: ${err.message}`));
      };

      worker.postMessage({ fileContent });
    } catch {
      cleanup();
      // Fallback to PapaParse directly
      Papa.parse<Record<string, string>>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (parseErr: Error) => reject(parseErr),
      });
    }

    function cleanup() {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    }
  });
}
