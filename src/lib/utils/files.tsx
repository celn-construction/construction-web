import { FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import type { ReactNode } from 'react';

const FILE_ICON_STYLE = { color: 'var(--text-secondary)' };

/**
 * Returns an icon component for a given MIME type.
 */
export function getFileIcon(mimeType: string): ReactNode {
  if (mimeType.startsWith('image/')) {
    return <FileImage size={20} style={FILE_ICON_STYLE} />;
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return <FileSpreadsheet size={20} style={FILE_ICON_STYLE} />;
  }
  return <FileText size={20} style={FILE_ICON_STYLE} />;
}
