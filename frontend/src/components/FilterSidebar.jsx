import React from 'react';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Adventure', 'Crime'];

const FilterSidebar = ({
  genre,
  onGenreChange,
  minRating,
  onMinRatingChange,
  yearFrom,
  onYearFromChange,
  yearTo,
  onYearToChange,
}) => {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-6 border-r border-white/10 bg-black/30 p-5 backdrop-blur-xl">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Filters</h2>
        <p className="mt-1 text-sm text-zinc-400">Refine your deck</p>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-400">Genre</label>
        <select
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
        >
          {GENRES.map((g) => (
            <option key={g} value={g === 'All' ? 'all' : g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-400">Min rating</label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={minRating}
          onChange={(e) => onMinRatingChange(Number(e.target.value))}
          className="mt-3 w-full accent-violet-500"
        />
        <div className="mt-1 text-right text-sm font-medium text-violet-300">{minRating.toFixed(1)} / 10</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-400">Year from</label>
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => onYearFromChange(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400">Year to</label>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => onYearToChange(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-zinc-500">
        Tip: drag cards or use ← → arrows. ↑ for super like.
      </div>
    </aside>
  );
};

export default FilterSidebar;
