'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { X } from 'lucide-react';
import { useThemeStore } from '~/store/useThemeStore';
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
      {/* Header matching Kibo Gantt style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <svg style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Bryntum Schedule
        </h2>
      </div>

      {/* Gantt content */}
      <div style={{ flex: 1, overflow: 'hidden' }} className="bryntum-gantt-container">
        <BryntumGantt {...ganttConfig} />
      </div>

      {/* Popover for task details */}
      <Popover open={!!selectedTaskId} onOpenChange={(open) => { if (!open) { setSelectedTaskId(null); setSelectedDoc(null); } }}>
        <PopoverAnchor virtualRef={anchorRef as React.RefObject<any>} />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-80"
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {selectedTaskName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div
              className="text-xs rounded-md p-3 border border-dashed border-[var(--border-color)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Task details panel (folder tree removed during migration)
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
