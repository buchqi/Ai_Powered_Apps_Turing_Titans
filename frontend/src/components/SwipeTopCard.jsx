import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import MovieCard from './MovieCard.jsx';

const Motion = motion;

const SWIPE_X = 140;
const VELO = 600;

const SwipeTopCard = forwardRef(function SwipeTopCard(
  { movie, onSwipeLeft, onSwipeRight, onSuperLike, onOpenDetails },
  ref,
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-22, 22]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const nopeOpacity = useTransform(x, [-160, -40], [1, 0]);
  const superGlow = useTransform(y, [-80, -300], [0, 1]);

  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [movie.id, x, y]);

  const exitX = async (target, cb) => {
    await Promise.all([
      animate(x, target, { duration: 0.28, ease: [0.22, 1, 0.36, 1] }),
      animate(y, 0, { duration: 0.28 }),
    ]);
    cb();
  };

  const exitSuper = async (cb) => {
    await Promise.all([
      animate(y, -720, { duration: 0.35, ease: [0.22, 1, 0.36, 1] }),
      animate(x, 0, { duration: 0.2 }),
    ]);
    cb();
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => exitX(-560, onSwipeLeft),
    swipeRight: () => exitX(560, onSwipeRight),
    superLike: () => exitSuper(onSuperLike),
  }));

  const handleDragEnd = async (_, info) => {
    const vx = info.velocity.x;
    const ox = info.offset.x;

    if (ox > SWIPE_X || vx > VELO) {
      await exitX(560, onSwipeRight);
      return;
    }
    if (ox < -SWIPE_X || vx < -VELO) {
      await exitX(-560, onSwipeLeft);
      return;
    }
    if (info.offset.y < -100 && Math.abs(ox) < 80) {
      await exitSuper(onSuperLike);
      return;
    }

    await Promise.all([
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 }),
      animate(y, 0, { type: 'spring', stiffness: 420, damping: 32 }),
    ]);
  };

  return (
    <Motion.div
      className="relative z-20 touch-none"
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: -480, right: 480, top: -560, bottom: 560 }}
      dragElastic={0.92}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      <Motion.div
        className="pointer-events-none absolute inset-0 z-30 flex items-start justify-end rounded-[18px] p-6"
        style={{ opacity: likeOpacity }}
      >
        <span className="rotate-12 rounded-lg border-4 border-emerald-400 bg-emerald-500/90 px-4 py-2 text-2xl font-black tracking-widest text-white shadow-lg">
          LIKE
        </span>
      </Motion.div>
      <Motion.div
        className="pointer-events-none absolute inset-0 z-30 flex items-start justify-start rounded-[18px] p-6"
        style={{ opacity: nopeOpacity }}
      >
        <span className="-rotate-12 rounded-lg border-4 border-rose-400 bg-rose-600/90 px-4 py-2 text-2xl font-black tracking-widest text-white shadow-lg">
          NOPE
        </span>
      </Motion.div>
      <Motion.div
        className="pointer-events-none absolute inset-0 z-30 rounded-[18px] bg-gradient-to-b from-violet-500/40 to-transparent"
        style={{ opacity: superGlow }}
      />
      <div className="pointer-events-auto">
        <MovieCard movie={movie} onOpenDetails={onOpenDetails} />
      </div>
    </Motion.div>
  );
});

export default SwipeTopCard;
