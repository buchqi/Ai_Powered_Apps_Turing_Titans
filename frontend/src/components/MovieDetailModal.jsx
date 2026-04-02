import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion;

const MovieDetailModal = ({ movie, onClose }) => {
  return (
    <AnimatePresence>
      {movie ? (
        <Motion.div
          key={movie.id}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={onClose}
          />
          <Motion.article
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl shadow-black/50"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="flex gap-4">
              <img
                src={movie.poster}
                alt=""
                className="h-40 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white">{movie.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">{movie.year}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{movie.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cast</h3>
              <p className="mt-1 text-sm text-zinc-300">{movie.cast?.join(', ')}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-rose-600/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} trailer`)}`,
                    '_blank',
                  )
                }
              >
                Watch trailer
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </Motion.article>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MovieDetailModal;
