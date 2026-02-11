'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { X } from 'lucide-react';
import { useThemeStore } from '~/store/useThemeStore';
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover';
import FeatureFolderTree from '~/components/dashboard/FeatureFolderTree';

export default function BryntumGanttWrapper() {
  const theme = useThemeStore((state) => state.theme);

  // Popover state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string>('');
  const anchorRef = useRef<HTMLElement | null>(null);
  const [coverImages, setCoverImages] = useState<Record<string, string | undefined>>({});
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const linkId = 'bryntum-theme';
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = `/bryntum/stockholm-${theme}.css`;

    return () => {
      const existingLink = document.getElementById(linkId);
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, [theme]);

  // Handle task bar click
  const handleTaskClick = useCallback(({ taskRecord, event }: any) => {
    const barEl = (event.target as HTMLElement).closest('.b-gantt-task-wrap') as HTMLElement;
    if (!barEl) return;

    const id = String(taskRecord.id);
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
      anchorRef.current = null;
    } else {
      setSelectedTaskId(id);
      setSelectedTaskName(taskRecord.name);
      anchorRef.current = barEl;
    }
    setSelectedDoc(null);
  }, [selectedTaskId]);

  // Handle cover image change
  const handleCoverImageChange = useCallback((imageUrl: string | undefined) => {
    if (selectedTaskId) {
      setCoverImages(prev => ({ ...prev, [selectedTaskId]: imageUrl }));
    }
  }, [selectedTaskId]);

  // Handle document selection in tree
  const handleDocumentSelect = useCallback((docId: string, docName: string) => {
    setSelectedDoc({ id: docId, name: docName });
  }, []);
  const ganttConfig = {
    project: {
      autoLoad: true,
      transport: {
        load: {
          url: '/data/bryntum-sample.json'
        }
      }
    },
    columns: [
      { type: 'name', field: 'name', text: 'Task', width: 250 },
      { type: 'startdate', field: 'startDate', text: 'Start' },
      { type: 'duration', field: 'duration', text: 'Duration' }
    ],
    viewPreset: 'weekAndDayLetter',
    barMargin: 10,
    listeners: {
      taskClick: handleTaskClick
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
      {/* Header matching Kibo Gantt style */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
        <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <h2 className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
          Bryntum Schedule
        </h2>
      </div>

      {/* Gantt content */}
      <div className="flex-1 overflow-hidden bryntum-gantt-container">
        <BryntumGantt {...ganttConfig} />
      </div>

      {/* Popover for task details */}
      <Popover open={!!selectedTaskId} onOpenChange={(open) => { if (!open) { setSelectedTaskId(null); setSelectedDoc(null); } }}>
        <PopoverAnchor virtualRef={anchorRef as React.RefObject<any>} />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className={`transition-all duration-300 ${selectedDoc ? 'w-[580px]' : 'w-80'}`}
        >
          <div className="flex gap-3">
            {/* Folder Tree - Fixed width */}
            <div className={`transition-all duration-300 ${selectedDoc ? 'w-[280px]' : 'w-full'}`}>
              <FeatureFolderTree
                featureName={selectedTaskName}
                featureId={selectedTaskId ?? ''}
                coverImage={selectedTaskId ? coverImages[selectedTaskId] : undefined}
                onCoverImageChange={handleCoverImageChange}
                onDocumentSelect={handleDocumentSelect}
              />
            </div>

            {/* Detail Panel - Appears when doc is selected */}
            {selectedDoc && (
              <div className="flex-1 border-l border-[var(--border-color)] pl-3 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {selectedDoc.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {selectedTaskName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
                    aria-label="Close detail panel"
                  >
                    <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
                <div
                  className="text-xs rounded-md p-3 border border-dashed border-[var(--border-color)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No documents yet
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
