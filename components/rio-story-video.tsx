"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };
type State = "idle" | "playing" | "paused" | "ended" | "failed";

interface RioStoryVideoProps {
  desktopSrc: string;
  mobileSrc: string;
  poster: string;
  posterAlt: string;
  posterPosition: string;
  sizes: string;
  labels: { play: string; pause: string; replay: string };
}

function connection(): NetworkInfo | undefined {
  return (navigator as Navigator & { connection?: NetworkInfo }).connection;
}

// Poster-first: no video request until the card nears the viewport; muted autoplay only when
// visible and motion/data preferences allow; otherwise playback starts from the button.
export function RioStoryVideo({ desktopSrc, mobileSrc, poster, posterAlt, posterPosition, sizes, labels }: RioStoryVideoProps) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const attached = useRef(false);
  const userPaused = useRef(false);
  const [state, setState] = useState<State>("idle");
  const [started, setStarted] = useState(false);

  const attach = useCallback(() => {
    const v = video.current;
    if (!v || attached.current) return;
    attached.current = true;
    const net = connection();
    const light = matchMedia("(max-width: 767px)").matches || net?.saveData === true
      || ["slow-2g", "2g", "3g"].includes(net?.effectiveType ?? "");
    v.src = light ? mobileSrc : desktopSrc;
    v.preload = "auto";
  }, [desktopSrc, mobileSrc]);

  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    attach();
    v.play().catch(() => setState((s) => (s === "failed" ? s : "paused")));
  }, [attach]);

  useEffect(() => {
    const el = frame.current;
    const v = video.current;
    if (!el || !v) return;
    v.muted = true;
    v.defaultMuted = true;

    const net = connection();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const constrained = net?.saveData === true || ["slow-2g", "2g"].includes(net?.effectiveType ?? "");
    if (reduced || constrained) return;

    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        attach();
        near.disconnect();
      }
    }, { rootMargin: "600px 0px" });

    const visible = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.5) {
        if (!userPaused.current && !v.ended) play();
      } else if (entry.intersectionRatio < 0.25 && !v.paused) {
        v.pause();
      }
    }, { threshold: [0, 0.25, 0.5] });

    near.observe(el);
    visible.observe(el);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [attach, play]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (state === "playing") {
      userPaused.current = true;
      v.pause();
      return;
    }
    userPaused.current = false;
    if (v.ended) v.currentTime = 0;
    play();
  };

  const label = state === "playing" ? labels.pause : state === "ended" ? labels.replay : labels.play;
  const Icon = state === "playing" ? Pause : state === "ended" ? RotateCcw : Play;

  return (
    <div ref={frame} className="absolute inset-0" data-video-state={state}>
      <Image src={poster} alt={posterAlt} fill sizes={sizes} className="object-cover" style={{ objectPosition: posterPosition }} />
      <video
        ref={video}
        muted
        playsInline
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => {
          setStarted(true);
          setState("playing");
        }}
        onPause={(e) => {
          if (!e.currentTarget.ended) setState((s) => (s === "failed" ? s : "paused"));
        }}
        onEnded={() => setState("ended")}
        onError={() => setState("failed")}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
          started && state !== "failed" ? "opacity-100" : "opacity-0"
        }`}
        style={{ objectPosition: posterPosition }}
      />
      {state !== "failed" ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          className="absolute bottom-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/45 text-[#F4F0E8] transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8C780]"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
