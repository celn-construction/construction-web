'use client';

import { motion } from 'framer-motion';

export default function GanttLoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Construction crane mechanism */}
      <div className="relative w-64 h-40 mb-8">
        {/* Crane arm */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 origin-bottom"
          style={{ bottom: '20%', width: '2px', height: '80px' }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-full h-full"
            style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.3 }}
          />
          {/* Horizontal beam */}
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 h-1"
            style={{
              width: '120px',
              backgroundColor: 'var(--accent-primary)',
              opacity: 0.3
            }}
          />
        </motion.div>

        {/* Hanging cable */}
        <motion.div
          className="absolute left-1/2 origin-top"
          style={{
            top: '20%',
            width: '1px',
            height: '60px',
            backgroundColor: 'var(--accent-primary)',
            opacity: 0.2
          }}
          animate={{
            x: [-20, 20, -20],
            height: ['60px', '50px', '60px']
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Load block */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 bottom-0"
            style={{
              width: '32px',
              height: '24px',
              backgroundColor: 'var(--accent-primary)',
              opacity: 0.4,
              border: '1px solid var(--accent-primary)',
            }}
            animate={{
              rotate: [-2, 2, -2],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Building progress bars */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 relative overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--bg-hover)' }}
            >
              <motion.div
                className="h-full absolute left-0 top-0 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.3 }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ease: 'easeInOut'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status display */}
      <div className="flex flex-col items-center gap-3">
        {/* Loading text with monospace engineering feel */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--status-amber)' }}
          />
          <p
            className="text-xs font-mono uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Building Schedule
          </p>
        </motion.div>

        {/* Progress counter */}
        <motion.div
          className="flex items-baseline gap-1 font-mono text-[10px] tracking-wider"
          style={{ color: 'var(--text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>[</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </motion.span>
          <span className="opacity-30">░░░░░</span>
          <span>]</span>
        </motion.div>
      </div>
    </div>
  );
}
