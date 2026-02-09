'use client';

import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import DocumentTree from '@/components/documents/DocumentTree';

export default function DocumentsPage() {
  return (
    <LayoutWrapper>
      <div className="flex flex-col h-full bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)]">
        {/* Header */}
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--blueprint-line)] bg-white dark:bg-[var(--bg-card)] transition-colors duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--blueprint-accent)]/10 border border-[var(--blueprint-accent)]/30">
              <FileText className="w-5 h-5 text-[var(--blueprint-accent)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold tracking-wider uppercase font-[family-name:var(--font-mono-blueprint)] text-gray-900 dark:text-white">
                Construction Documents
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-[var(--text-muted)] font-[family-name:var(--font-mono-blueprint)]">
                REV {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Document Tree */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 overflow-auto p-6"
        >
          <DocumentTree />
        </motion.div>
      </div>
    </LayoutWrapper>
  );
}
