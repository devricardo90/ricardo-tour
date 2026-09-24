"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createGlobe, type Globe, type GlobeState } from "./globe-3d";
import rioArrival from "./assets/rio-aerial-arrival.webp";
import rioFlight from "./assets/rio-helicopter-cockpit.webp";
import rioFinale from "./assets/rio-christ-finale.webp";
import styles from "./globe-journey.module.css";

const translations = {
  pt: {
    labels: ["Globo", "América do Sul", "Brasil", "Rio de Janeiro", "Helicóptero", "Cristo Redentor"],
    preview: "Rick Travel · Uma jornada pelo Rio", media: "Uma jornada cinematográfica pelo Rio",
    scroll: "Role para entrar na jornada", skip: "Ir para a próxima seção ↓", next: "Planeje sua viagem",
    nextBody: "O Rio convida você a desenhar uma viagem à sua própria medida.",
    static: "Uma jornada visual pelo Rio, em um quadro estático.",
    fallback: "Uma vista estática da jornada — continue para descobrir o Rio.",
    badge: "UM NOVO OLHAR SOBRE O RIO",
  },
  en: {
    labels: ["Globe", "South America", "Brazil", "Rio de Janeiro", "Helicopter", "Christ the Redeemer"],
    preview: "Rick Travel · A journey through Rio", media: "A cinematic journey through Rio",
    scroll: "Scroll into the journey", skip: "Go to the next section ↓", next: "Plan your trip",
    nextBody: "Let Rio inspire a journey shaped around the way you want to travel.",
    static: "A visual journey through Rio, held in a still frame.",
    fallback: "A still view of the journey — continue to discover Rio.",
    badge: "A CLOSER LOOK AT RIO",
  },
  es: {
    labels: ["Globo", "América del Sur", "Brasil", "Río de Janeiro", "Helicóptero", "Cristo Redentor"],
    preview: "Rick Travel · Un viaje por Río", media: "Un viaje cinematográfico por Río",
    scroll: "Desplázate para entrar en el recorrido", skip: "Ir a la siguiente sección ↓", next: "Planifica tu viaje",
    nextBody: "Deja que Río inspire un viaje hecho a tu manera.",
    static: "Un viaje visual por Río, detenido en un instante.",
    fallback: "Una vista fija del viaje — continúa para descubrir Río.",
    badge: "UNA MIRADA MÁS CERCANA A RÍO",
  },
};

/** RT-16 boundaries, byte-for-byte the same contract Version A and Version B honour. */
const boundaries = [0, 0.12, 0.28, 0.44, 0.62, 0.78];

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

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current!;
    const media = gsap.matchMedia();
    media.add({ reduce: "(prefers-reduced-motion: reduce)", mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" }, context => {
      const { reduce, mobile } = context.conditions!;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (reduce || connection?.saveData) { element.dataset.mode = "static"; return; }

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
      const rioScene = element.querySelector<HTMLElement>("[data-scene='rio']")!;
      const flightScene = element.querySelector<HTMLElement>("[data-scene='flight']")!;
      const finaleScene = element.querySelector<HTMLElement>("[data-scene='finale']")!;
      const copy = element.querySelector<HTMLElement>("[data-hero-copy]")!;

      gsap.set(rioScene, { scale: 1.12, xPercent: 0, yPercent: 0, opacity: 0 });
      gsap.set(flightScene, { scale: 1.12, xPercent: 0, yPercent: 0, opacity: 0 });
      gsap.set(finaleScene, { scale: 1.1, xPercent: 0, yPercent: 0, opacity: 0 });

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
        .to(rioScene, { opacity: 1, duration: 0.1 }, 0.44)
        .to(rioScene, { scale: mobile ? 1.03 : 1.01, xPercent: mobile ? 0 : 1.5, yPercent: -1.2, duration: 0.2, ease: "sine.inOut" }, 0.44)
        // 58–76%: cross the bay through the helicopter windshield; the cabin frame is
        // part of the scene while a measured camera glide carries us towards Corcovado.
        .to(rioScene, { opacity: 0, duration: 0.08 }, 0.58)
        .to(flightScene, { opacity: 1, duration: 0.09 }, 0.58)
        .to(flightScene, { scale: mobile ? 1.08 : 1.04, xPercent: mobile ? 0 : -1.2, yPercent: -1.8, duration: 0.2, ease: "sine.inOut" }, 0.58)
        .to(copy, { opacity: mobile ? 0.06 : 0.22, duration: 0.08 }, 0.58)
        // 76–100%: the windshield falls away into a close, warm landmark reveal.
        .to(flightScene, { opacity: 0, duration: 0.1 }, 0.75)
        .to(finaleScene, { opacity: 1, duration: 0.12 }, 0.75)
        .to(finaleScene, { scale: mobile ? 1.05 : 1.02, xPercent: mobile ? -1 : 0.8, yPercent: -0.8, duration: 0.2, ease: "sine.inOut" }, 0.75)
        .to(finaleScene, { scale: 1.08, yPercent: -1.4, duration: 0.12, ease: "sine.inOut" }, 0.88)
        .to(copy, { opacity: mobile ? 0.06 : 0.88, duration: 0.08 }, 0.84)
        .to({}, { duration: 0.1 }, 0.9);

      let previous = -1;
      const update = (p: number) => {
        timeline.progress(p);
        element.dataset.progress = p.toFixed(5);
        const index = boundaries.reduce((acc, boundary, i) => p >= boundary ? i : acc, 0);
        element.dataset.state = String(index);
        if (index !== previous) {
          if (activeText.current) activeText.current.textContent = `${String(index + 1).padStart(2, "0")} / 06 · ${labels[index]}`;
          previous = index;
        }
        if (progressText.current) progressText.current.textContent = `${Math.round(p * 100)}%`;
        dirty = true;
      };

      // Drawing is decoupled from the scroll callback so a fast flick coalesces into one
      // frame instead of queueing a redraw per wheel event.
      const draw = () => {
        if (!dirty || !globe) return;
        dirty = false;
        const projected = globe.render(camera);
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

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        gsap.ticker.remove(draw);
        trigger.kill();
        timeline.kill();
        globe?.dispose();
        delete element.dataset.mode;
        delete element.dataset.webgl;
      };
    }, element);
    return () => media.revert();
  }, [labels]);

  return <div ref={root} className={styles.root} data-testid="globe-journey" data-progress="0" data-state="0">
    <div className={styles.review}><span>{t.preview}</span><nav aria-label="Language">{["pt", "en", "es"].map(l => <a key={l} href={`/${l}/rebuild-lab/cinematic-3d-poc`} aria-current={locale === l ? "page" : undefined}>{l.toUpperCase()}</a>)}</nav></div>
    <section className={styles.runway} data-runway aria-label={t.preview}>
      <div className={styles.stage} data-stage>
        <div className={styles.visual}>
          <div className={styles.starField} data-layer="stars" aria-hidden="true"/>
          <StaticGlobe/>
          <div className={styles.globe} data-globe>
            <canvas data-globe-canvas aria-hidden="true"/>
            <div className={styles.glow} aria-hidden="true"/>
            <div className={styles.marker} data-rio-marker data-visible="false" aria-hidden="true"/>
          </div>
          <div className={styles.scene} data-scene="rio" style={{ backgroundImage: `url(${rioArrival.src})` }} aria-hidden="true" />
          <div className={styles.scene} data-scene="flight" style={{ backgroundImage: `url(${rioFlight.src})` }} aria-hidden="true" />
          <div className={styles.scene} data-scene="finale" style={{ backgroundImage: `url(${rioFinale.src})` }} aria-hidden="true" />
          <div className={styles.sceneAtmosphere} aria-hidden="true" />
        </div>
        <div className={styles.shade}/>
        <div className={styles.topline}><span>RICK TRAVEL</span><span>RIO DE JANEIRO · BRASIL</span></div>
        <div className={styles.heroCopy} data-hero-copy><p>{t.badge}</p><h1>Rio<br/><em>From Another</em><br/>Perspective</h1></div>
        <div className={styles.bottom}>
          <p className={styles.media}>{t.media}</p>
          <div className={styles.readout}><span ref={activeText}>01 / 06 · {t.labels[0]}</span><output ref={progressText} aria-label="Scroll progress">0%</output></div>
          <p className={styles.hint}>{t.scroll}</p>
          <p className={styles.staticNote}>{t.static}</p>
          <p className={styles.fallbackNote}>{t.fallback}</p>
          <a href="#globe-next">{t.skip}</a>
        </div>
      </div>
    </section>
    <section id="globe-next" className={styles.next} tabIndex={-1}>
      <p>RICK TRAVEL · {t.preview}</p><h2>{t.next}</h2><p>{t.nextBody}</p>
      <ol>{t.labels.map((label, i) => <li key={label}><span>0{i + 1}</span> {label}</li>)}</ol>
    </section>
  </div>;
}
