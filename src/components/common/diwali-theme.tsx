'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Sparkles, X } from 'lucide-react';

/**
 * Expiry Date: November 9, 2026 00:00:00
 * The theme automatically unmounts and removes itself on 9 November.
 */
export const DIWALI_EXPIRY_DATE = new Date('2026-11-09T00:00:00');

function subscribe() {
  return () => {};
}

export function DiwaliTheme() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [showFireworks, setShowFireworks] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [fireworkKey, setFireworkKey] = useState(1);

  // Active only prior to November 9, 2026
  const isActive = isClient && new Date() < DIWALI_EXPIRY_DATE;

  // Handler to trigger fireworks replay
  const triggerFireworks = () => {
    setShowFireworks(false);
    setTimeout(() => {
      setFireworkKey((prev) => prev + 1);
      setShowFireworks(true);
    }, 50);
  };

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          SCOPED DIWALI THEME STYLES (from Main.dc.html)
      ───────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        .diwali-gl {
          position: relative;
          height: 3px;
          overflow: hidden;
          background: linear-gradient(90deg, #c9702a, #f2b544, #c9702a);
          z-index: 60;
        }
        .diwali-shine {
          position: absolute;
          top: 0;
          left: -30%;
          width: 30%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0)
          );
          animation: diwali-shine 4.5s ease-in-out infinite;
        }
        .diwali-mand {
          position: fixed;
          right: -80px;
          top: 20px;
          width: 300px;
          height: 300px;
          z-index: 10;
          pointer-events: none;
          animation: diwali-spin 160s linear infinite;
          opacity: 0.22;
        }
        .diwali-show {
          position: fixed;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 60;
        }
        .diwali-dusk {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          background: #06121e;
          opacity: 0;
          animation: diwali-dusk 14s ease-in-out 1 forwards;
        }
        .diwali-fwk {
          position: absolute;
          width: 0;
          height: 0;
          mix-blend-mode: screen;
        }
        .diwali-fh {
          position: absolute;
          left: -95px;
          top: -95px;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 246, 210, 0.95),
            rgba(255, 190, 80, 0.38) 42%,
            rgba(255, 170, 60, 0) 70%
          );
          opacity: 0;
          animation: diwali-fh 14s linear 1 forwards;
          animation-delay: var(--d, 0s);
        }
        .diwali-p,
        .diwali-g {
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: 3px;
          margin: -1.5px 0 0 -1.5px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 7px 2px var(--c);
          opacity: 0;
          animation: diwali-pf 14s linear 1 forwards, diwali-ch 14s linear 1 forwards;
          animation-delay: var(--d, 0s), var(--d, 0s);
        }
        .diwali-g {
          width: 2px;
          height: 2px;
          margin: -1px 0 0 -1px;
          box-shadow: 0 0 5px 1px var(--c);
          animation: diwali-pg 14s linear 1 forwards, diwali-ch 14s linear 1 forwards;
          animation-delay: var(--d, 0s), var(--d, 0s);
        }
        .diwali-p::before {
          content: "";
          position: absolute;
          right: 1.5px;
          top: 50%;
          width: 22px;
          height: 2px;
          margin-top: -1px;
          transform-origin: 100% 50%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), var(--c));
          animation: diwali-tl 14s linear 1 forwards;
          animation-delay: var(--d, 0s);
        }
        .diwali-rkt {
          opacity: 0;
          position: absolute;
          bottom: 20px;
          width: 0;
          height: 0;
          mix-blend-mode: screen;
          animation: diwali-rk 14s linear 1 forwards;
          animation-delay: var(--d, 0s);
        }
        .diwali-rkt b {
          position: absolute;
          left: -1.5px;
          top: 0;
          width: 3px;
          height: 84px;
          border-radius: 2px;
          background: linear-gradient(0deg, rgba(255, 150, 50, 0), rgba(255, 205, 120, 0.95));
        }
        .diwali-rkt::after {
          content: "";
          position: absolute;
          left: -3px;
          top: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff6d6;
          box-shadow: 0 0 12px 4px rgba(255, 190, 80, 0.9);
        }
        @keyframes diwali-dusk {
          0% { opacity: 0; }
          5% { opacity: 0.38; }
          32% { opacity: 0.38; }
          42%, 100% { opacity: 0; }
        }
        @keyframes diwali-rk {
          0% {
            transform: translateY(0);
            opacity: 1;
            animation-timing-function: cubic-bezier(0.3, 0.1, 0.55, 1);
          }
          10% {
            transform: translateY(var(--up));
            opacity: 1;
          }
          10.2%, 100% {
            transform: translateY(var(--up));
            opacity: 0;
          }
        }
        @keyframes diwali-fh {
          0%, 9.8% { opacity: 0; transform: scale(0.2); }
          10.4% { opacity: 1; transform: scale(1); }
          16% { opacity: 0.35; transform: scale(1.8); }
          22%, 100% { opacity: 0; transform: scale(2.2); }
        }
        @keyframes diwali-pf {
          0% { transform: translate(0, 0); opacity: 0; }
          10% {
            transform: translate(0, 0);
            opacity: 0;
            animation-timing-function: cubic-bezier(0.1, 0.75, 0.3, 1);
          }
          10.3% { opacity: 1; }
          22% {
            transform: translate(var(--x), var(--y));
            opacity: 1;
            animation-timing-function: cubic-bezier(0.4, 0, 0.9, 0.6);
          }
          40% {
            transform: translate(calc(var(--x) * 1.1), calc(var(--y) + 130px));
            opacity: 0;
          }
          100% {
            transform: translate(calc(var(--x) * 1.1), calc(var(--y) + 130px));
            opacity: 0;
          }
        }
        @keyframes diwali-pg {
          0% { transform: translate(0, 0); opacity: 0; }
          13% {
            transform: translate(0, 0);
            opacity: 0;
            animation-timing-function: cubic-bezier(0.1, 0.75, 0.3, 1);
          }
          13.3% { opacity: 1; }
          25% {
            transform: translate(var(--x), var(--y));
            opacity: 1;
            animation-timing-function: cubic-bezier(0.4, 0, 0.9, 0.6);
          }
          28% { opacity: 0.25; }
          30% { opacity: 0.95; }
          32% { opacity: 0.2; }
          34% { opacity: 0.85; }
          36% { opacity: 0.2; }
          38% { opacity: 0.7; }
          50% {
            transform: translate(calc(var(--x) * 1.06), calc(var(--y) + 190px));
            opacity: 0;
          }
          100% {
            transform: translate(calc(var(--x) * 1.06), calc(var(--y) + 190px));
            opacity: 0;
          }
        }
        @keyframes diwali-ch {
          0%, 10% { background: #fff; }
          15% { background: var(--c); }
          30% { background: #c2410c; }
          100% { background: #c2410c; }
        }
        @keyframes diwali-tl {
          0%, 10% { transform: rotate(var(--ang)) scaleX(0.3); }
          14% { transform: rotate(var(--ang)) scaleX(1); }
          22%, 100% { transform: rotate(var(--ang)) scaleX(0); }
        }
        @keyframes diwali-shine {
          from { left: -30%; }
          to { left: 100%; }
        }
        @keyframes diwali-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes diwali-flick {
          0% { transform: scale(1, 1) rotate(-2deg); }
          50% { transform: scale(0.92, 1.1) rotate(2deg); }
          100% { transform: scale(1.04, 0.96) rotate(-1deg); }
        }
        @keyframes diwali-glow {
          from { opacity: 0.55; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .diwali-show { display: none !important; }
          .diwali-mand, .diwali-shine { animation: none !important; }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────
          1. GOLDEN GLOWING STRIP AT THE VERY TOP
      ───────────────────────────────────────────────────────────── */}
      <div className="diwali-gl" aria-hidden="true">
        <i className="diwali-shine" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FESTIVE TOP GREETING BANNER
      ───────────────────────────────────────────────────────────── */}
      {!isBannerDismissed && (
        <div className="bg-gradient-to-r from-[#2B1B0E] via-[#3D2614] to-[#1C2C26] text-[#FDEBD0] text-xs py-1.5 px-4 flex items-center justify-between border-b border-[#C9702A]/30 z-50 relative shadow-xs">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            {/* Diya Icon */}
            <span className="text-base leading-none select-none">🪔</span>
            <span className="font-medium tracking-wide">
              <strong className="text-[#F2B544] font-semibold">Happy Diwali!</strong>{' '}
              <span className="hidden sm:inline text-[#E8D5B5]">
                Wishing you prosperity, bright growth &amp; seamless GMP compliance.
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerFireworks}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9702A]/30 hover:bg-[#C9702A]/50 text-[#F2B544] border border-[#F2B544]/40 font-medium text-[11px] transition-all cursor-pointer"
              title="Launch celebratory Diwali fireworks"
            >
              <Sparkles className="w-3 h-3 text-[#F2B544]" />
              <span>Fireworks</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="text-[#D4AF37]/70 hover:text-[#D4AF37] p-0.5 rounded-full transition-colors cursor-pointer"
              aria-label="Dismiss Diwali banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ROTATING MANDALA BACKGROUND MOTIF (from Main.dc.html)
      ───────────────────────────────────────────────────────────── */}
      <svg className="diwali-mand" viewBox="0 0 200 200" aria-hidden="true">
        <g fill="none" stroke="#c9902a" strokeOpacity="0.35" strokeWidth="1">
          <circle cx="100" cy="100" r="92" />
          <circle cx="100" cy="100" r="62" />
          <circle cx="100" cy="100" r="22" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(0 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(45 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(90 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(135 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(180 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(225 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(270 100 100)" />
          <ellipse cx="100" cy="46" rx="11" ry="28" transform="rotate(315 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(22.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(67.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(112.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(157.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(202.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(247.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(292.5 100 100)" />
          <ellipse cx="100" cy="16" rx="6" ry="12" transform="rotate(337.5 100 100)" />
        </g>
      </svg>

      {/* ─────────────────────────────────────────────────────────────
          4. DIWALI FIREWORKS SHOW OVERLAY (from Main.dc.html)
      ───────────────────────────────────────────────────────────── */}
      {showFireworks && (
        <div
          key={fireworkKey}
          className="diwali-show"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `
              <div class="diwali-dusk"></div>
              <i class="diwali-rkt" style="left:22%;--up:-680px;--d:0s"><b></b></i>
              <div class="diwali-fwk" style="left:22%;top:250px;--d:0s">
                <i class="diwali-fh"></i>
                <i class="diwali-p" style="--x:167px;--y:-1px;--c:#ffb02e;--ang:-0deg"></i>
                <i class="diwali-p" style="--x:83px;--y:7px;--c:#ff8a1f;--ang:5deg"></i>
                <i class="diwali-p" style="--x:140px;--y:26px;--c:#ffb02e;--ang:11deg"></i>
                <i class="diwali-p" style="--x:158px;--y:41px;--c:#ff8a1f;--ang:15deg"></i>
                <i class="diwali-p" style="--x:137px;--y:56px;--c:#ffb02e;--ang:24deg"></i>
                <i class="diwali-p" style="--x:123px;--y:65px;--c:#ffd36a;--ang:29deg"></i>
                <i class="diwali-p" style="--x:110px;--y:77px;--c:#ffd36a;--ang:36deg"></i>
                <i class="diwali-p" style="--x:71px;--y:56px;--c:#ff8a1f;--ang:40deg"></i>
                <i class="diwali-p" style="--x:106px;--y:110px;--c:#ffb02e;--ang:48deg"></i>
                <i class="diwali-p" style="--x:109px;--y:108px;--c:#ffb02e;--ang:47deg"></i>
                <i class="diwali-p" style="--x:62px;--y:103px;--c:#ff8a1f;--ang:60deg"></i>
                <i class="diwali-p" style="--x:52px;--y:85px;--c:#ffd36a;--ang:60deg"></i>
                <i class="diwali-p" style="--x:43px;--y:82px;--c:#ffb02e;--ang:64deg"></i>
                <i class="diwali-p" style="--x:39px;--y:113px;--c:#ffd36a;--ang:72deg"></i>
                <i class="diwali-p" style="--x:18px;--y:68px;--c:#ffb02e;--ang:76deg"></i>
                <i class="diwali-p" style="--x:4px;--y:130px;--c:#ff8a1f;--ang:88deg"></i>
                <i class="diwali-p" style="--x:6px;--y:138px;--c:#ffb02e;--ang:88deg"></i>
                <i class="diwali-p" style="--x:-9px;--y:113px;--c:#ffd36a;--ang:94deg"></i>
                <i class="diwali-p" style="--x:-20px;--y:127px;--c:#ffb02e;--ang:98deg"></i>
                <i class="diwali-p" style="--x:-51px;--y:138px;--c:#ffb02e;--ang:109deg"></i>
                <i class="diwali-p" style="--x:-46px;--y:105px;--c:#ffb02e;--ang:113deg"></i>
                <i class="diwali-p" style="--x:-74px;--y:123px;--c:#ffd36a;--ang:119deg"></i>
                <i class="diwali-p" style="--x:-67px;--y:110px;--c:#ff8a1f;--ang:120deg"></i>
                <i class="diwali-p" style="--x:-52px;--y:63px;--c:#ffb02e;--ang:128deg"></i>
                <i class="diwali-p" style="--x:-117px;--y:96px;--c:#ffd36a;--ang:139deg"></i>
                <i class="diwali-p" style="--x:-118px;--y:79px;--c:#ff8a1f;--ang:145deg"></i>
                <i class="diwali-p" style="--x:-113px;--y:75px;--c:#ffd36a;--ang:145deg"></i>
                <i class="diwali-p" style="--x:-118px;--y:65px;--c:#ffb02e;--ang:150deg"></i>
                <i class="diwali-p" style="--x:-155px;--y:63px;--c:#ffb02e;--ang:156deg"></i>
                <i class="diwali-p" style="--x:-145px;--y:34px;--c:#ff8a1f;--ang:166deg"></i>
                <i class="diwali-p" style="--x:-121px;--y:28px;--c:#ffd36a;--ang:166deg"></i>
                <i class="diwali-p" style="--x:-157px;--y:10px;--c:#ff8a1f;--ang:176deg"></i>
                <i class="diwali-p" style="--x:-128px;--y:5px;--c:#ff8a1f;--ang:178deg"></i>
                <i class="diwali-p" style="--x:-140px;--y:-5px;--c:#ff8a1f;--ang:182deg"></i>
                <i class="diwali-p" style="--x:-155px;--y:-39px;--c:#ffb02e;--ang:195deg"></i>
                <i class="diwali-p" style="--x:-99px;--y:-27px;--c:#ff8a1f;--ang:196deg"></i>
                <i class="diwali-p" style="--x:-71px;--y:-24px;--c:#ffd36a;--ang:200deg"></i>
                <i class="diwali-p" style="--x:-139px;--y:-69px;--c:#ffd36a;--ang:208deg"></i>
                <i class="diwali-p" style="--x:-72px;--y:-42px;--c:#ffd36a;--ang:212deg"></i>
                <i class="diwali-p" style="--x:-117px;--y:-80px;--c:#ffd36a;--ang:216deg"></i>
                <i class="diwali-p" style="--x:-115px;--y:-99px;--c:#ffd36a;--ang:222deg"></i>
                <i class="diwali-p" style="--x:-103px;--y:-105px;--c:#ffb02e;--ang:227deg"></i>
                <i class="diwali-p" style="--x:-84px;--y:-124px;--c:#ffd36a;--ang:238deg"></i>
                <i class="diwali-p" style="--x:-47px;--y:-85px;--c:#ffb02e;--ang:243deg"></i>
                <i class="diwali-p" style="--x:-26px;--y:-64px;--c:#ff8a1f;--ang:249deg"></i>
                <i class="diwali-p" style="--x:-51px;--y:-129px;--c:#ffd36a;--ang:250deg"></i>
                <i class="diwali-p" style="--x:-19px;--y:-144px;--c:#ff8a1f;--ang:263deg"></i>
                <i class="diwali-p" style="--x:-19px;--y:-110px;--c:#ffd36a;--ang:261deg"></i>
                <i class="diwali-p" style="--x:4px;--y:-88px;--c:#ff8a1f;--ang:272deg"></i>
                <i class="diwali-p" style="--x:16px;--y:-155px;--c:#ffd36a;--ang:275deg"></i>
                <i class="diwali-p" style="--x:38px;--y:-143px;--c:#ffb02e;--ang:284deg"></i>
                <i class="diwali-p" style="--x:38px;--y:-125px;--c:#ffd36a;--ang:286deg"></i>
                <i class="diwali-p" style="--x:51px;--y:-110px;--c:#ff8a1f;--ang:294deg"></i>
                <i class="diwali-p" style="--x:52px;--y:-98px;--c:#ffb02e;--ang:297deg"></i>
                <i class="diwali-p" style="--x:42px;--y:-60px;--c:#ff8a1f;--ang:303deg"></i>
                <i class="diwali-p" style="--x:89px;--y:-116px;--c:#ffd36a;--ang:306deg"></i>
                <i class="diwali-p" style="--x:122px;--y:-101px;--c:#ff8a1f;--ang:319deg"></i>
                <i class="diwali-p" style="--x:110px;--y:-75px;--c:#ffb02e;--ang:324deg"></i>
                <i class="diwali-p" style="--x:123px;--y:-86px;--c:#ffb02e;--ang:323deg"></i>
                <i class="diwali-p" style="--x:148px;--y:-71px;--c:#ffb02e;--ang:333deg"></i>
                <i class="diwali-p" style="--x:145px;--y:-58px;--c:#ffd36a;--ang:337deg"></i>
                <i class="diwali-p" style="--x:151px;--y:-35px;--c:#ffb02e;--ang:346deg"></i>
                <i class="diwali-p" style="--x:144px;--y:-33px;--c:#ffd36a;--ang:346deg"></i>
                <i class="diwali-p" style="--x:89px;--y:-6px;--c:#ffd36a;--ang:356deg"></i>
                <i class="diwali-g" style="--x:88px;--y:76px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:53px;--y:-95px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-65px;--y:-121px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-63px;--y:133px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:56px;--y:-57px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-93px;--y:-44px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-70px;--y:-86px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:145px;--y:23px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:26px;--y:-142px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-123px;--y:43px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:130px;--y:-35px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:44px;--y:-88px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:4px;--y:-122px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:43px;--y:90px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-152px;--y:-39px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-113px;--y:89px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:133px;--y:81px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:79px;--y:84px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-89px;--y:87px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-128px;--y:30px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:122px;--y:87px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:35px;--y:149px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:121px;--y:-17px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-10px;--y:137px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-48px;--y:68px;--c:#ffd36a"></i>
                <i class="diwali-g" style="--x:-61px;--y:94px;--c:#ffd36a"></i>
              </div>

              <i class="diwali-rkt" style="left:76%;--up:-715px;--d:.9s"><b></b></i>
              <div class="diwali-fwk" style="left:76%;top:215px;--d:.9s">
                <i class="diwali-fh"></i>
                <i class="diwali-p" style="--x:178px;--y:-0px;--c:#ff9a3d;--ang:-0deg"></i>
                <i class="diwali-p" style="--x:167px;--y:14px;--c:#ffcf6b;--ang:5deg"></i>
                <i class="diwali-p" style="--x:138px;--y:25px;--c:#fff1c9;--ang:11deg"></i>
                <i class="diwali-p" style="--x:172px;--y:60px;--c:#ff9a3d;--ang:20deg"></i>
                <i class="diwali-p" style="--x:153px;--y:66px;--c:#ffcf6b;--ang:25deg"></i>
                <i class="diwali-p" style="--x:103px;--y:52px;--c:#ff6a2a;--ang:28deg"></i>
                <i class="diwali-p" style="--x:114px;--y:75px;--c:#ffcf6b;--ang:35deg"></i>
                <i class="diwali-p" style="--x:133px;--y:97px;--c:#ff6a2a;--ang:38deg"></i>
                <i class="diwali-p" style="--x:117px;--y:113px;--c:#ff9a3d;--ang:46deg"></i>
                <i class="diwali-p" style="--x:115px;--y:135px;--c:#fff1c9;--ang:51deg"></i>
                <i class="diwali-p" style="--x:47px;--y:68px;--c:#ff9a3d;--ang:57deg"></i>
                <i class="diwali-p" style="--x:75px;--y:141px;--c:#fff1c9;--ang:63deg"></i>
                <i class="diwali-p" style="--x:35px;--y:94px;--c:#ffcf6b;--ang:71deg"></i>
                <i class="diwali-p" style="--x:48px;--y:147px;--c:#fff1c9;--ang:73deg"></i>
                <i class="diwali-p" style="--x:31px;--y:151px;--c:#ff9a3d;--ang:79deg"></i>
                <i class="diwali-p" style="--x:7px;--y:166px;--c:#ff9a3d;--ang:88deg"></i>
                <i class="diwali-p" style="--x:10px;--y:139px;--c:#ff6a2a;--ang:86deg"></i>
                <i class="diwali-p" style="--x:-13px;--y:160px;--c:#ff9a3d;--ang:94deg"></i>
                <i class="diwali-p" style="--x:-35px;--y:166px;--c:#ff6a2a;--ang:101deg"></i>
                <i class="diwali-p" style="--x:-58px;--y:161px;--c:#ff9a3d;--ang:109deg"></i>
                <i class="diwali-p" style="--x:-61px;--y:147px;--c:#ffcf6b;--ang:112deg"></i>
                <i class="diwali-p" style="--x:-55px;--y:95px;--c:#ffcf6b;--ang:118deg"></i>
                <i class="diwali-p" style="--x:-67px;--y:94px;--c:#ffcf6b;--ang:124deg"></i>
                <i class="diwali-p" style="--x:-81px;--y:101px;--c:#ffcf6b;--ang:127deg"></i>
                <i class="diwali-p" style="--x:-125px;--y:124px;--c:#ffcf6b;--ang:134deg"></i>
                <i class="diwali-p" style="--x:-121px;--y:86px;--c:#ffcf6b;--ang:143deg"></i>
                <i class="diwali-p" style="--x:-130px;--y:91px;--c:#fff1c9;--ang:143deg"></i>
                <i class="diwali-p" style="--x:-160px;--y:72px;--c:#ffcf6b;--ang:155deg"></i>
                <i class="diwali-p" style="--x:-161px;--y:70px;--c:#ff9a3d;--ang:155deg"></i>
                <i class="diwali-p" style="--x:-172px;--y:56px;--c:#ff6a2a;--ang:161deg"></i>
                <i class="diwali-p" style="--x:-171px;--y:41px;--c:#ffcf6b;--ang:166deg"></i>
                <i class="diwali-p" style="--x:-149px;--y:8px;--c:#fff1c9;--ang:177deg"></i>
                <i class="diwali-p" style="--x:-155px;--y:7px;--c:#ffcf6b;--ang:177deg"></i>
                <i class="diwali-p" style="--x:-83px;--y:-13px;--c:#ff9a3d;--ang:190deg"></i>
                <i class="diwali-p" style="--x:-149px;--y:-21px;--c:#ff9a3d;--ang:188deg"></i>
                <i class="diwali-p" style="--x:-161px;--y:-42px;--c:#fff1c9;--ang:195deg"></i>
                <i class="diwali-p" style="--x:-161px;--y:-56px;--c:#ff9a3d;--ang:200deg"></i>
                <i class="diwali-p" style="--x:-141px;--y:-80px;--c:#ff6a2a;--ang:211deg"></i>
                <i class="diwali-p" style="--x:-129px;--y:-79px;--c:#ff9a3d;--ang:213deg"></i>
                <i class="diwali-p" style="--x:-141px;--y:-104px;--c:#fff1c9;--ang:218deg"></i>
                <i class="diwali-p" style="--x:-119px;--y:-114px;--c:#ff6a2a;--ang:226deg"></i>
                <i class="diwali-p" style="--x:-109px;--y:-137px;--c:#ffcf6b;--ang:233deg"></i>
                <i class="diwali-p" style="--x:-94px;--y:-146px;--c:#ff6a2a;--ang:239deg"></i>
                <i class="diwali-p" style="--x:-47px;--y:-90px;--c:#ffcf6b;--ang:244deg"></i>
                <i class="diwali-p" style="--x:-72px;--y:-140px;--c:#ff9a3d;--ang:244deg"></i>
                <i class="diwali-p" style="--x:-34px;--y:-129px;--c:#ff9a3d;--ang:256deg"></i>
                <i class="diwali-p" style="--x:-29px;--y:-114px;--c:#ff6a2a;--ang:257deg"></i>
                <i class="diwali-p" style="--x:-21px;--y:-144px;--c:#ff9a3d;--ang:262deg"></i>
                <i class="diwali-p" style="--x:-2px;--y:-115px;--c:#ff9a3d;--ang:269deg"></i>
                <i class="diwali-p" style="--x:11px;--y:-74px;--c:#ff9a3d;--ang:278deg"></i>
                <i class="diwali-p" style="--x:37px;--y:-149px;--c:#ff9a3d;--ang:283deg"></i>
                <i class="diwali-p" style="--x:48px;--y:-132px;--c:#ff6a2a;--ang:289deg"></i>
                <i class="diwali-p" style="--x:41px;--y:-102px;--c:#fff1c9;--ang:291deg"></i>
                <i class="diwali-p" style="--x:98px;--y:-148px;--c:#fff1c9;--ang:302deg"></i>
                <i class="diwali-p" style="--x:101px;--y:-129px;--c:#ff9a3d;--ang:306deg"></i>
                <i class="diwali-p" style="--x:65px;--y:-77px;--c:#ffcf6b;--ang:308deg"></i>
                <i class="diwali-p" style="--x:126px;--y:-107px;--c:#fff1c9;--ang:318deg"></i>
                <i class="diwali-p" style="--x:136px;--y:-92px;--c:#ff6a2a;--ang:324deg"></i>
                <i class="diwali-p" style="--x:141px;--y:-92px;--c:#ff6a2a;--ang:325deg"></i>
                <i class="diwali-p" style="--x:71px;--y:-34px;--c:#ffcf6b;--ang:333deg"></i>
                <i class="diwali-p" style="--x:151px;--y:-57px;--c:#fff1c9;--ang:338deg"></i>
                <i class="diwali-p" style="--x:152px;--y:-53px;--c:#ff6a2a;--ang:340deg"></i>
                <i class="diwali-p" style="--x:104px;--y:-26px;--c:#fff1c9;--ang:345deg"></i>
                <i class="diwali-p" style="--x:80px;--y:-10px;--c:#ff9a3d;--ang:352deg"></i>
                <i class="diwali-g" style="--x:139px;--y:-58px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:106px;--y:136px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-75px;--y:-57px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-98px;--y:28px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-61px;--y:76px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-136px;--y:51px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-115px;--y:-84px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-100px;--y:115px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:145px;--y:-44px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-129px;--y:15px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:30px;--y:-138px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-22px;--y:138px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-102px;--y:-114px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:124px;--y:-39px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:63px;--y:-60px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:107px;--y:6px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-66px;--y:-65px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:82px;--y:40px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-135px;--y:-44px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-115px;--y:12px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-84px;--y:127px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:40px;--y:-118px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-143px;--y:52px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:43px;--y:-109px;--c:#ffb02e"></i>
                <i class="diwali-g" style="--x:-39px;--y:148px;--c:#fff1c9"></i>
                <i class="diwali-g" style="--x:-105px;--y:52px;--c:#fff1c9"></i>
              </div>

              <i class="diwali-rkt" style="left:49%;--up:-755px;--d:1.9s"><b></b></i>
              <div class="diwali-fwk" style="left:49%;top:175px;--d:1.9s">
                <i class="diwali-fh"></i>
                <i class="diwali-p" style="--x:200px;--y:-1px;--c:#7fe3d6;--ang:-0deg"></i>
                <i class="diwali-p" style="--x:205px;--y:21px;--c:#fff6d6;--ang:6deg"></i>
                <i class="diwali-p" style="--x:184px;--y:43px;--c:#ffe08a;--ang:14deg"></i>
                <i class="diwali-p" style="--x:199px;--y:62px;--c:#fff6d6;--ang:18deg"></i>
                <i class="diwali-p" style="--x:179px;--y:64px;--c:#fff6d6;--ang:21deg"></i>
                <i class="diwali-p" style="--x:185px;--y:89px;--c:#fff6d6;--ang:27deg"></i>
                <i class="diwali-p" style="--x:99px;--y:61px;--c:#fff6d6;--ang:33deg"></i>
                <i class="diwali-p" style="--x:122px;--y:87px;--c:#ffc24a;--ang:37deg"></i>
                <i class="diwali-p" style="--x:71px;--y:59px;--c:#7fe3d6;--ang:42deg"></i>
                <i class="diwali-p" style="--x:96px;--y:113px;--c:#fff6d6;--ang:51deg"></i>
                <i class="diwali-p" style="--x:111px;--y:171px;--c:#ffc24a;--ang:59deg"></i>
                <i class="diwali-p" style="--x:85px;--y:134px;--c:#fff6d6;--ang:59deg"></i>
                <i class="diwali-p" style="--x:61px;--y:158px;--c:#ffc24a;--ang:70deg"></i>
                <i class="diwali-p" style="--x:41px;--y:132px;--c:#7fe3d6;--ang:74deg"></i>
                <i class="diwali-p" style="--x:54px;--y:192px;--c:#ffe08a;--ang:75deg"></i>
                <i class="diwali-p" style="--x:22px;--y:169px;--c:#fff6d6;--ang:83deg"></i>
                <i class="diwali-p" style="--x:11px;--y:171px;--c:#7fe3d6;--ang:87deg"></i>
                <i class="diwali-p" style="--x:-13px;--y:197px;--c:#fff6d6;--ang:94deg"></i>
                <i class="diwali-p" style="--x:-44px;--y:175px;--c:#fff6d6;--ang:103deg"></i>
                <i class="diwali-p" style="--x:-63px;--y:178px;--c:#ffe08a;--ang:108deg"></i>
                <i class="diwali-p" style="--x:-52px;--y:109px;--c:#fff6d6;--ang:114deg"></i>
                <i class="diwali-p" style="--x:-83px;--y:131px;--c:#7fe3d6;--ang:121deg"></i>
                <i class="diwali-p" style="--x:-121px;--y:149px;--c:#ffe08a;--ang:127deg"></i>
                <i class="diwali-p" style="--x:-130px;--y:136px;--c:#ffc24a;--ang:132deg"></i>
                <i class="diwali-p" style="--x:-139px;--y:140px;--c:#ffc24a;--ang:133deg"></i>
                <i class="diwali-p" style="--x:-151px;--y:122px;--c:#fff6d6;--ang:139deg"></i>
                <i class="diwali-p" style="--x:-164px;--y:89px;--c:#ffe08a;--ang:150deg"></i>
                <i class="diwali-p" style="--x:-188px;--y:101px;--c:#ffe08a;--ang:150deg"></i>
                <i class="diwali-p" style="--x:-185px;--y:65px;--c:#ffe08a;--ang:160deg"></i>
                <i class="diwali-p" style="--x:-182px;--y:57px;--c:#ffc24a;--ang:162deg"></i>
                <i class="diwali-p" style="--x:-195px;--y:34px;--c:#7fe3d6;--ang:170deg"></i>
                <i class="diwali-p" style="--x:-182px;--y:24px;--c:#fff6d6;--ang:172deg"></i>
                <i class="diwali-p" style="--x:-138px;--y:-2px;--c:#fff6d6;--ang:181deg"></i>
                <i class="diwali-p" style="--x:-217px;--y:-20px;--c:#ffe08a;--ang:186deg"></i>
                <i class="diwali-p" style="--x:-175px;--y:-32px;--c:#ffc24a;--ang:191deg"></i>
                <i class="diwali-p" style="--x:-188px;--y:-62px;--c:#fff6d6;--ang:199deg"></i>
                <i class="diwali-p" style="--x:-197px;--y:-85px;--c:#ffe08a;--ang:205deg"></i>
                <i class="diwali-p" style="--x:-111px;--y:-63px;--c:#ffc24a;--ang:211deg"></i>
                <i class="diwali-p" style="--x:-149px;--y:-100px;--c:#ffc24a;--ang:215deg"></i>
                <i class="diwali-p" style="--x:-162px;--y:-135px;--c:#ffc24a;--ang:222deg"></i>
                <i class="diwali-p" style="--x:-80px;--y:-78px;--c:#ffe08a;--ang:226deg"></i>
                <i class="diwali-p" style="--x:-62px;--y:-64px;--c:#ffc24a;--ang:228deg"></i>
                <i class="diwali-p" style="--x:-97px;--y:-151px;--c:#ffe08a;--ang:239deg"></i>
                <i class="diwali-p" style="--x:-76px;--y:-153px;--c:#fff6d6;--ang:245deg"></i>
                <i class="diwali-p" style="--x:-82px;--y:-155px;--c:#ffe08a;--ang:244deg"></i>
                <i class="diwali-p" style="--x:-45px;--y:-162px;--c:#7fe3d6;--ang:255deg"></i>
                <i class="diwali-p" style="--x:-41px;--y:-196px;--c:#fff6d6;--ang:259deg"></i>
                <i class="diwali-p" style="--x:-25px;--y:-187px;--c:#7fe3d6;--ang:263deg"></i>
                <i class="diwali-p" style="--x:4px;--y:-168px;--c:#ffc24a;--ang:271deg"></i>
                <i class="diwali-p" style="--x:8px;--y:-184px;--c:#ffe08a;--ang:272deg"></i>
                <i class="diwali-p" style="--x:42px;--y:-177px;--c:#7fe3d6;--ang:282deg"></i>
                <i class="diwali-p" style="--x:50px;--y:-178px;--c:#ffe08a;--ang:285deg"></i>
                <i class="diwali-p" style="--x:65px;--y:-130px;--c:#ffc24a;--ang:295deg"></i>
                <i class="diwali-p" style="--x:89px;--y:-168px;--c:#fff6d6;--ang:296deg"></i>
                <i class="diwali-p" style="--x:84px;--y:-104px;--c:#ffe08a;--ang:307deg"></i>
                <i class="diwali-p" style="--x:127px;--y:-155px;--c:#fff6d6;--ang:307deg"></i>
                <i class="diwali-p" style="--x:135px;--y:-134px;--c:#fff6d6;--ang:313deg"></i>
                <i class="diwali-p" style="--x:139px;--y:-109px;--c:#ffe08a;--ang:320deg"></i>
                <i class="diwali-p" style="--x:147px;--y:-103px;--c:#ffc24a;--ang:323deg"></i>
                <i class="diwali-p" style="--x:124px;--y:-65px;--c:#ffe08a;--ang:331deg"></i>
                <i class="diwali-p" style="--x:198px;--y:-89px;--c:#7fe3d6;--ang:334deg"></i>
                <i class="diwali-p" style="--x:206px;--y:-62px;--c:#7fe3d6;--ang:342deg"></i>
                <i class="diwali-p" style="--x:183px;--y:-24px;--c:#ffc24a;--ang:352deg"></i>
                <i class="diwali-p" style="--x:190px;--y:-10px;--c:#7fe3d6;--ang:357deg"></i>
                <i class="diwali-g" style="--x:-128px;--y:-125px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:185px;--y:-21px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-8px;--y:119px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-65px;--y:-90px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:38px;--y:130px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:76px;--y:-148px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-4px;--y:158px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-131px;--y:-41px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-108px;--y:-54px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-93px;--y:-42px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:19px;--y:-112px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-156px;--y:-81px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:163px;--y:106px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-110px;--y:26px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:12px;--y:161px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-119px;--y:-47px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-90px;--y:-67px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-47px;--y:192px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:7px;--y:-139px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:63px;--y:146px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-138px;--y:41px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:-61px;--y:162px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:-127px;--y:-112px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:78px;--y:121px;--c:#fff6d6"></i>
                <i class="diwali-g" style="--x:88px;--y:111px;--c:#ffe08a"></i>
                <i class="diwali-g" style="--x:72px;--y:139px;--c:#ffe08a"></i>
              </div>
            `,
          }}
        />
      )}
    </>
  );
}
