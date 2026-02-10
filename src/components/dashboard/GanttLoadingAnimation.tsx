'use client';

import { motion } from 'framer-motion';

export default function GanttLoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Stacking blocks animation */}
      <div className="relative h-24 w-24 mb-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm"
            style={{
              backgroundColor: 'var(--accent-primary)',
              opacity: 0.7,
            }}
            initial={{ y: -60, opacity: 0 }}
            animate={{
              y: [60, -(i * 8)],
              opacity: [0, 0.7],
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <motion.p
        className="text-sm uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Loading schedule...
      </motion.p>
    </div>
  );
}
