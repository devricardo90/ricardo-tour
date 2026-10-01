"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createGlobe, type Globe, type GlobeState } from "./globe-3d";
import { buildHeroScenes, type HeroLayer, type HeroScene } from "./hero-media";
import styles from "./globe-journey.module.css";

const translations = {
  pt: {
    labels: ["Globo", "América do Sul", "Brasil", "Rio de Janeiro", "Helicóptero", "Cristo Redentor"],
    regionLabel: "Rick Travel · Uma jornada pelo Rio", media: "Uma jornada cinematográfica pelo Rio",
    scroll: "Role para entrar na jornada", skip: "Ir para a próxima seção ↓",
    planEyebrow: "Planeje sua viagem", next: "Voos para o Rio de Janeiro",
    progress: "Progresso da jornada", stage: "Etapa", of: "de",
    nextBody: "O Rio convida você a desenhar uma viagem à sua própria medida.",
    static: "Uma jornada visual pelo Rio, em um quadro estático.",
    fallback: "Uma vista estática da jornada — continue para descobrir o Rio.",
    badge: "UM NOVO OLHAR SOBRE O RIO",
  },
  en: {
    labels: ["Globe", "South America", "Brazil", "Rio de Janeiro", "Helicopter", "Christ the Redeemer"],
    regionLabel: "Rick Travel · A journey through Rio", media: "A cinematic journey through Rio",
    scroll: "Scroll into the journey", skip: "Go to the next section ↓",
    planEyebrow: "Plan your trip", next: "Flights to Rio de Janeiro",
    progress: "Journey progress", stage: "Stage", of: "of",
    nextBody: "Let Rio inspire a journey shaped around the way you want to travel.",
    static: "A visual journey through Rio, held in a still frame.",
    fallback: "A still view of the journey — continue to discover Rio.",
    badge: "A CLOSER LOOK AT RIO",
  },
  es: {
    labels: ["Globo", "América del Sur", "Brasil", "Río de Janeiro", "Helicóptero", "Cristo Redentor"],
    regionLabel: "Rick Travel · Un viaje por Río", media: "Un viaje cinematográfico por Río",
    scroll: "Desplázate para entrar en el recorrido", skip: "Ir a la siguiente sección ↓",
    planEyebrow: "Planea tu viaje", next: "Vuelos a Río de Janeiro",
    progress: "Progreso del viaje", stage: "Etapa", of: "de",
    nextBody: "Deja que Río inspire un viaje hecho a tu manera.",
    static: "Un viaje visual por Río, detenido en un instante.",
    fallback: "Una vista fija del viaje — continúa para descubrir Río.",
    badge: "UNA MIRADA MÁS CERCANA A RÍO",
  },
};

/** RT-16 boundaries, byte-for-byte the same contract Version A and Version B honour. */
const boundaries = [0, 0.12, 0.28, 0.44, 0.62, 0.78];

/**
 * RT-19 pointer depth. A bounded, additive camera orbit applied only at render time;
 * the timeline-owned camera and the scroll progress are never written by the pointer.
 * Full influence during the RT-16 0–8% hold (the timeline's own hold), fading to zero
 * by the end of the Globe stage, where scroll takes over the camera.
 */
const pointerDepth = {
  holdEnd: 0.08,
  fadeEnd: boundaries[1],
  /** Degrees of camera orbit at the viewport edge. */
  lon: 1.1,
  lat: 0.7,
  /** Pixels of star-field drift at the viewport edge. */
  starsX: 6,
  starsY: 4,
  /** Exponential smoothing time constant, seconds: critically damped, never springy. */
  tau: 0.45,
};

/**
 * Server-rendered stand-in, also used whenever WebGL is unavailable, reduced motion is
 * requested or data saving is on. Authored lab artwork, never photography.
 */
function StaticGlobe() {
  return <svg viewBox="0 0 600 600" className={styles.staticGlobe} data-static-globe aria-hidden="true">
    <defs>
      <radialGradient id="globe-ocean" cx="31%" cy="22%"><stop stopColor="#65706f"/><stop offset=".32" stopColor="#293339"/><stop offset=".76" stopColor="#121a20"/><stop offset="1" stopColor="#070b0f"/></radialGradient>
      <radialGradient id="globe-rim"><stop offset=".78" stopColor="#d7ba79" stopOpacity="0"/><stop offset=".88" stopColor="#d7ba79" stopOpacity=".55"/><stop offset="1" stopColor="#d7ba79" stopOpacity="0"/></radialGradient>
      <clipPath id="globe-clip"><circle cx="300" cy="300" r="245"/></clipPath>
    </defs>
    <circle cx="300" cy="300" r="297" fill="url(#globe-rim)"/>
    <circle cx="300" cy="300" r="245" fill="url(#globe-ocean)" stroke="#d7ba79" strokeOpacity=".42"/>
    <g clipPath="url(#globe-clip)" fill="none" stroke="#d7ba79" strokeOpacity=".1">
      {[120,210,300,390,480].map(y => <ellipse key={y} cx="300" cy={y} rx="245" ry="35"/>)}
      {[90,170,235].map(rx => <ellipse key={rx} cx="300" cy="300" rx={rx} ry="245"/>)}
    </g>
    <g clipPath="url(#globe-clip)" fill="#64705f" stroke="#e3c47d" strokeWidth="1.2" strokeOpacity=".6">
      <path d="M83 115 175 84 257 99 265 137 223 162 211 202 176 221 188 250 233 263 255 292 239 311 215 286 178 272 143 232 108 205 73 165Z"/>
      <path d="M246 285 282 278 310 297 343 308 367 344 352 373 327 390 319 425 293 460 280 489 266 475 258 438 253 412 240 383 224 354 221 325Z"/>
      <path d="M391 123 422 103 469 114 508 147 523 197 482 218 445 198 405 219 377 193 393 163Z M404 233 457 222 491 259 482 297 454 329 444 373 422 368 406 331 385 296 382 257Z"/>
    </g>
    <path d="M275 299 310 307 342 316 359 345 343 370 322 383 300 394 279 376 260 367 250 342 262 321Z" fill="#d7ba79" fillOpacity=".1" stroke="#fff0c2" strokeOpacity=".72" strokeWidth="2"/>
    <circle cx="322" cy="381" r="4" fill="#fff1cc"/>
    <circle cx="322" cy="381" r="15" fill="none" stroke="#d7ba79" strokeOpacity=".72"/>
  </svg>;
}

export default function GlobeJourney({ locale }: { locale: string }) {
  const t = translations[locale as keyof typeof translations] || translations.pt;
  const labels = t.labels;
  const root = useRef<HTMLDivElement>(null);
  const progressText = useRef<HTMLOutputElement>(null);
  const activeText = useRef<HTMLSpanElement>(null);
  const progressIndicator = useRef<HTMLDivElement>(null);
  // Render-time layer list: only `id`/`type`/`src`/`mediaStatus` are read here, none of
  // which vary with `mobile` (only each layer's keyframe tween values do, and those are
  // consumed inside the effect once matchMedia resolves the real value).
  const heroScenesForRender = buildHeroScenes(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current!;
    const media = gsap.matchMedia();
    media.add({
      reduce: "(prefers-reduced-motion: reduce)", mobile: "(max-width: 767px)", desktop: "(min-width: 768px)",
      finePointer: "(hover: hover) and (pointer: fine)",
    }, context => {
      const { reduce, mobile, finePointer } = context.conditions!;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (reduce || connection?.saveData) { element.dataset.mode = "static"; return; }
      // RT-28: a slow connection that hasn't opted into data-saver still gets the
      // lighter mobile derivative, on any viewport size — bandwidth-based, not just
      // width-based. Network Information API support varies, so this only ever narrows
      // behavior when the browser actually reports it; nothing changes without evidence.
      const slowConnection = Boolean(connection?.effectiveType && ["slow-2g", "2g", "3g"].includes(connection.effectiveType));

      const canvas = element.querySelector<HTMLCanvasElement>("[data-globe-canvas]")!;
      const marker = element.querySelector<HTMLElement>("[data-rio-marker]")!;
      let globe: Globe | null = null;
      try {
        globe = createGlobe(canvas);
      } catch {
        globe = null;
      }
      // A device without WebGL keeps the server-rendered static frame instead of an
      // empty stage; the journey stays usable and the next section stays reachable.
      element.dataset.webgl = globe ? "ready" : "unavailable";
      element.dataset.mode = "motion";

      const section = element.querySelector<HTMLElement>("[data-runway]")!;
      const stage = element.querySelector<HTMLElement>("[data-stage]")!;
      const globeWrap = element.querySelector<HTMLElement>("[data-globe]")!;
      const stars = element.querySelector<HTMLElement>("[data-layer='stars']")!;
      const copy = element.querySelector<HTMLElement>("[data-hero-copy]")!;

      // RT-27: Rio/Helicopter/Christ are described declaratively (app/.../hero-media.ts)
      // instead of three hardcoded scene variables. `mobile` is already resolved by the
      // matchMedia context above, so every keyframe value below is identical to what the
      // inline tweens used to hardcode; only where the numbers live has changed.
      const heroScenes = buildHeroScenes(mobile);
      const heroLayerElements = new Map<string, HTMLElement>();
      for (const scene of heroScenes) {
        for (const layer of scene.layers) {
          const layerEl = element.querySelector<HTMLElement>(`[data-scene='${scene.id}'][data-layer='${layer.id}']`);
          // A layer declared in hero-media.ts with no matching DOM node (e.g. a future
          // layer added to the data before its markup lands) is skipped, not fatal.
          if (!layerEl) continue;
          heroLayerElements.set(`${scene.id}:${layer.id}`, layerEl);
          gsap.set(layerEl, layer.initial);
        }
      }

      // RT-28: media is requested by scroll proximity (`layer.prepareAt`), never by a
      // fixed timer. A layer's own `initial`/`keyframes` opacity is untouched either
      // way — this only controls when its pixels exist to show, decoupled from when the
      // (unchanged) timeline reveals it. `layerMediaState` also doubles as the
      // dev-inspectable readiness record (mirrored onto `data-media-state`, never a
      // user-visible label) and guarantees each layer's image is fetched at most once.
      const layerMediaState = new Map<string, "requested" | "loaded" | "failed">();
      const preferMobileDerivative = mobile || slowConnection;
      const prepareLayer = (scene: HeroScene, layer: HeroLayer) => {
        if (!layer.src) return;
        const key = `${scene.id}:${layer.id}`;
        if (layerMediaState.has(key)) return;
        const layerEl = heroLayerElements.get(key);
        if (!layerEl) return;
        layerMediaState.set(key, "requested");
        layerEl.dataset.mediaState = "requested";
        const url = preferMobileDerivative && layer.srcMobile ? layer.srcMobile : layer.src;
        const probe = new Image();
        probe.onload = () => {
          layerMediaState.set(key, "loaded");
          layerEl.dataset.mediaState = "loaded";
          layerEl.style.backgroundImage = `url(${url})`;
        };
        probe.onerror = () => {
          layerMediaState.set(key, "failed");
          layerEl.dataset.mediaState = "failed";
          // No backgroundImage assigned: `.scene`'s own background-color (#080c11, the
          // same charcoal the whole Hero already stands on) shows through instead of a
          // broken-image icon or a transparent hole — a designed fallback, not an
          // accidental blank frame. There is no <img> element anywhere in this
          // architecture, so a broken-image icon is structurally impossible here.
        };
        probe.src = url;
      };

      /**
       * The camera state is plain data. ScrollTrigger drives the same normalized
       * progress used by A and B; only the interpretation is 3D. Distance is in sphere
       * radii, so 1.34 is a genuine low orbit rather than a CSS scale factor.
       */
      const camera: GlobeState = { dist: 4.6, lat: 4, lon: -52, brazilMix: 0 };
      let dirty = true;

      const timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      timeline
        // 0–8%: hold. The whole planet keeps a margin, so the establishing frame reads
        // as a planet in space instead of being cropped by the stage edges.
        // Distances are solved from the lens rather than guessed: for a subject whose
        // half-arc on the sphere is t to sit inside the half-FOV f,
        //   d = sin(t) / tan(f) + cos(t).
        .to(camera, { dist: 4.6, duration: 0.08 }, 0)
        .to(camera, { dist: 4.15, duration: 0.04, ease: "sine.in" }, 0.08)
        // 12–28%: descend until South America spans the frame with the limb still
        // readable. Closer than d = 2.8 the globe stops looking spherical and the
        // continent flattens into a silhouette.
        .to(camera, { dist: 2.8, lat: -14, lon: -60, duration: 0.16 }, 0.12)
        // 28–38%: Brazil takes the frame, emerging from the same approach, not a cut.
        .to(camera, { dist: 2.3, lat: -12, lon: -52, duration: 0.1 }, 0.28)
        // 38–44%: close onto the Rio anchor so the handover at 44% is already framed on
        // the destination. Without this the camera stayed over central Brazil and Rio
        // fell outside the frustum exactly where the landscape has to take over.
        .to(camera, { dist: 1.95, lat: -17, lon: -47, duration: 0.06 }, 0.38)
        .to(camera, { brazilMix: 1, duration: 0.12 }, 0.28)
        .to(stars, { scale: 1.12, opacity: 0.7, duration: 0.44 }, 0)
        .to(copy, { opacity: 0.22, duration: 0.16 }, 0.28)
        // 44%: the Earth releases into the first cinematic Rio plate. Camera drift stays
        // continuous through the blend, so the location feels reached instead of cut to.
        .to(camera, { dist: 1.72, duration: 0.09, ease: "sine.in" }, 0.44)
        .to(globeWrap, { opacity: 0, duration: 0.09, ease: "sine.in" }, 0.44)
        // 58–76%: cross the bay through the helicopter windshield; the cabin frame is
        // part of the scene while a measured camera glide carries us towards Corcovado.
        .to(copy, { opacity: mobile ? 0.06 : 0.22, duration: 0.08 }, 0.58)
        // 76–100%: the windshield falls away into a close, warm landmark reveal.
        .to(copy, { opacity: mobile ? 0.06 : 0.88, duration: 0.08 }, 0.84)
        .to({}, { duration: 0.1 }, 0.9);

      // RT-27: the Rio/Helicopter/Christ layer tweens themselves — previously nine
      // `.to(rioScene|flightScene|finaleScene, ...)` calls hardcoded inline — are now
      // applied from each layer's own `keyframes` (app/.../hero-media.ts). The values are
      // unchanged; only their home moved from inline literals to data the animation
      // system consumes. Order doesn't matter: every position below is an absolute
      // timeline time, identical in meaning to the chained calls above.
      for (const scene of heroScenes) {
        for (const layer of scene.layers) {
          const layerEl = heroLayerElements.get(`${scene.id}:${layer.id}`);
          if (!layerEl) continue;
          for (const keyframe of layer.keyframes) {
            timeline.to(layerEl, keyframe.vars, keyframe.at);
          }
        }
      }

      // Pointer depth state: the pointer only writes the normalized target; the ticker eases
      // `depth` towards target × weight, where the weight is read from scroll progress.
      const depth = { x: 0, y: 0, targetX: 0, targetY: 0, weight: 1 };
      const rendered: GlobeState = { ...camera };

      let previous = -1;
      const update = (p: number) => {
        timeline.progress(p);
        for (const scene of heroScenes) {
          for (const layer of scene.layers) {
            if (layer.prepareAt !== undefined && p >= layer.prepareAt) prepareLayer(scene, layer);
          }
        }
        const fade = gsap.utils.clamp(0, 1, (p - pointerDepth.holdEnd) / (pointerDepth.fadeEnd - pointerDepth.holdEnd));
        depth.weight = 1 - fade * fade * (3 - 2 * fade);
        element.dataset.progress = p.toFixed(5);
        // ScrollTrigger progress is quantized by the browser's integer scroll position.
        // One pixel of tolerance keeps an exact storyboard checkpoint on its boundary
        // stage without changing the timeline or adding a second progress calculation.
        const boundaryTolerance = 1 / Math.max(1, section.offsetHeight - stage.offsetHeight);
        const index = boundaries.reduce((acc, boundary, i) => p + boundaryTolerance >= boundary ? i : acc, 0);
        element.dataset.state = String(index);
        if (progressIndicator.current) {
          progressIndicator.current.style.setProperty("--journey-progress", `${p * 100}%`);
          progressIndicator.current.setAttribute("aria-valuenow", String(Math.round(p * 100)));
        }
        if (index !== previous) {
          if (activeText.current) activeText.current.textContent = `${String(index + 1).padStart(2, "0")} / 06 · ${labels[index]}`;
          progressIndicator.current?.setAttribute("aria-valuetext", `${t.stage} ${index + 1} ${t.of} 6: ${labels[index]}`);
          element.querySelectorAll<HTMLElement>("[data-progress-step]").forEach(step => {
            const stepIndex = Number(step.dataset.progressStep);
            step.dataset.status = stepIndex === index ? "current" : stepIndex < index ? "complete" : "upcoming";
          });
          previous = index;
        }
        if (progressText.current) progressText.current.textContent = `${Math.round(p * 100)}%`;
        dirty = true;
      };

      // Drawing is decoupled from the scroll callback so a fast flick coalesces into one
      // frame instead of queueing a redraw per wheel event.
      const draw = (_time: number, deltaTime: number) => {
        if (finePointer) {
          const goalX = depth.targetX * depth.weight;
          const goalY = depth.targetY * depth.weight;
          if (depth.x !== goalX || depth.y !== goalY) {
            const ease = 1 - Math.exp(-Math.min(deltaTime, 100) / 1000 / pointerDepth.tau);
            depth.x += (goalX - depth.x) * ease;
            depth.y += (goalY - depth.y) * ease;
            // Settle exactly so the loop goes idle instead of redrawing sub-pixel drift.
            if (Math.abs(goalX - depth.x) < 1e-4) depth.x = goalX;
            if (Math.abs(goalY - depth.y) < 1e-4) depth.y = goalY;
            stars.style.translate = `${(depth.x * pointerDepth.starsX).toFixed(2)}px ${(depth.y * pointerDepth.starsY).toFixed(2)}px`;
            dirty = true;
          }
        }
        if (!dirty || !globe) return;
        dirty = false;
        // Scroll-owned camera + small pointer orbit. `camera` itself is never modified.
        rendered.dist = camera.dist;
        rendered.brazilMix = camera.brazilMix;
        rendered.lon = camera.lon + depth.x * pointerDepth.lon;
        rendered.lat = camera.lat - depth.y * pointerDepth.lat;
        const projected = globe.render(rendered);
        marker.dataset.visible = String(projected.visible);
        if (projected.visible) {
          marker.style.transform = `translate(${projected.x}px, ${projected.y}px)`;
        }
      };
      gsap.ticker.add(draw);

      const trigger = ScrollTrigger.create({
        trigger: section, start: "top top",
        end: () => `+=${section.offsetHeight - stage.offsetHeight}`,
        invalidateOnRefresh: true,
        onUpdate: self => update(self.progress),
        onRefresh: self => update(self.progress),
      });
      update(trigger.progress);
      const onResize = () => { dirty = true; };
      window.addEventListener("resize", onResize);
      const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

      // Pointer handlers only store a normalized target: no layout reads, no React state,
      // no scroll or timeline access. Touch input is ignored even on hybrid devices.
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        depth.targetX = gsap.utils.clamp(-1, 1, (event.clientX / window.innerWidth) * 2 - 1);
        depth.targetY = gsap.utils.clamp(-1, 1, (event.clientY / window.innerHeight) * 2 - 1);
      };
      const onPointerLeave = () => { depth.targetX = 0; depth.targetY = 0; };
      if (finePointer) {
        stage.addEventListener("pointermove", onPointerMove, { passive: true });
        stage.addEventListener("pointerleave", onPointerLeave);
        element.dataset.pointerDepth = "on";
      }

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("pointerleave", onPointerLeave);
        stars.style.translate = "";
        delete element.dataset.pointerDepth;
        gsap.ticker.remove(draw);
        trigger.kill();
        timeline.kill();
        globe?.dispose();
        delete element.dataset.mode;
        delete element.dataset.webgl;
      };
    }, element);
    return () => media.revert();
  }, [labels, t.of, t.stage]);

  return <div ref={root} className={styles.root} data-testid="globe-journey" data-progress="0" data-state="0">
    <section className={styles.runway} data-runway aria-label={t.regionLabel}>
      <div className={styles.stage} data-stage>
        <div className={styles.visual}>
          <div className={styles.starField} data-layer="stars" aria-hidden="true"/>
          <StaticGlobe/>
          <div className={styles.globe} data-globe>
            <canvas data-globe-canvas aria-hidden="true"/>
            <div className={styles.glow} aria-hidden="true"/>
            <div className={styles.marker} data-rio-marker data-visible="false" aria-hidden="true"/>
          </div>
          {/* RT-28: no `backgroundImage` here — a layer's image is only assigned once
              loaded (app/.../hero-media.ts `prepareAt`, applied in the effect below),
              not at first render, so later scenes are never fetched at initial load. */}
          {heroScenesForRender.map(scene => scene.layers.map(layer => (
            <div
              key={`${scene.id}-${layer.id}`}
              className={layer.type === "bridge" ? styles.bridge : styles.scene}
              data-scene={scene.id}
              data-layer={layer.id}
              data-media-status={scene.mediaStatus.productionStatus}
              data-media-state={layer.src ? "idle" : undefined}
              aria-hidden="true"
            />
          )))}
          <div className={styles.sceneAtmosphere} aria-hidden="true" />
        </div>
        <div className={styles.shade}/>
        <div className={styles.topline}><span>RICK TRAVEL</span><span>RIO DE JANEIRO · BRASIL</span></div>
        <div className={styles.heroCopy} data-hero-copy><p>{t.badge}</p><h1>Rio<br/><em>From Another</em><br/>Perspective</h1></div>
        <div className={styles.bottom}>
          <p className={styles.media}>{t.media}</p>
          <div className={styles.readout}><span ref={activeText} aria-live="polite" aria-atomic="true">01 / 06 · {t.labels[0]}</span><output ref={progressText} aria-label={t.progress}>0%</output></div>
          <div
            ref={progressIndicator}
            className={styles.progressIndicator}
            data-journey-progress
            role="progressbar"
            aria-label={t.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            aria-valuetext={`${t.stage} 1 ${t.of} 6: ${t.labels[0]}`}
          >
            <span className={styles.progressTrack} aria-hidden="true">
              <span className={styles.progressFill}/>
              {boundaries.map((boundary, index) => <span
                key={boundary}
                className={styles.progressStep}
                data-progress-step={index}
                data-status={index === 0 ? "current" : "upcoming"}
                style={{ left: `${boundary * 100}%` }}
              />)}
            </span>
          </div>
          <ol className={styles.stageList} data-stage-list>
            {t.labels.map((label, i) => <li key={label}><span>0{i + 1}</span> {label}</li>)}
          </ol>
          <p className={styles.hint}>{t.scroll}</p>
          <p className={styles.staticNote}>{t.static}</p>
          <p className={styles.fallbackNote}>{t.fallback}</p>
          <a href="#globe-next">{t.skip}</a>
        </div>
      </div>
    </section>
    {/* Compact planner bridge; the future Flight Planner mounts in this slot. */}
    <section id="globe-next" className={styles.next} tabIndex={-1} aria-labelledby="globe-next-title">
      <div>
        <p className={styles.planEyebrow}>{t.planEyebrow}</p>
        <h2 id="globe-next-title">{t.next}</h2>
      </div>
      <p className={styles.planBody}>{t.nextBody}</p>
    </section>
  </div>;
}
