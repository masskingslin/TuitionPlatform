import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadResult {
  downloadUrl: string;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  contentType: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB maximum

/**
 * Format bytes into human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate that a file is a PDF or Image and does not exceed 10 MB
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`
    };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);

  if (!isPdf && !isImage) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF documents and Images are supported.'
    };
  }

  return { valid: true };
}

/**
 * Upload a file to Firebase Storage (with Base64 dataURL fallback)
 */
export async function uploadFileToStorage(
  file: File,
  folder: 'question_papers' | 'answer_sheets' | 'resources'
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file.');
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${cleanFileName}`;

  try {
    // 1. Primary: Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/octet-stream'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      downloadUrl,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileSizeBytes: file.size,
      contentType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    };
  } catch (err) {
    console.warn('Firebase Storage direct upload failed or blocked by CORS, falling back to client DataURL:', err);

    // 2. Fallback: Base64 Data URL so the file can be previewed & downloaded in all environments
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

    return {
      downloadUrl: dataUrl,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileSizeBytes: file.size,
      contentType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    };
  }
}

/**
 * Download a real file directly in browser
 */
export function downloadFile(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
