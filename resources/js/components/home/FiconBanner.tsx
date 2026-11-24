import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Promotional video of the partner. Put the MP4 in public/videos and set its path here, e.g.
 * '/videos/ficon.mp4'; while it is null the banner shows an animated fibre illustration.
 */
const FICON_VIDEO: string | null = null;

/** Name shown until the partner sends its logo. */
export function FiconWordmark() {
  return (
    <span className="ficon-wordmark" aria-label="Ficon">
      <i aria-hidden="true" />
      FICON
    </span>
  );
}

/** Animated beams of light standing for fibre optic internet. */
function FibreAnimation() {
  return (
    <svg className="ficon-fibre" viewBox="0 0 640 360" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((line) => (
        <path
          key={line}
          className="ficon-fibre-line"
          style={{ animationDelay: `${line * 0.45}s` }}
          d={`M-40 ${300 - line * 30} C 160 ${220 - line * 26}, 320 ${330 - line * 34}, 680 ${120 + line * 18}`}
        />
      ))}
      <text x="320" y="170" textAnchor="middle" className="ficon-fibre-speed">
        hasta 1 Gbps
      </text>
      <text x="320" y="206" textAnchor="middle" className="ficon-fibre-note">
        Internet de fibra óptica
      </text>
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" strokeWidth="2" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" />
      ) : (
        <path
          d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

/** Home banner of Ficon, the partner that brings fibre optic internet (Mercado Play style). */
export function FiconBanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  return (
    <section className="ficon-banner" aria-labelledby="home-ficon">
      <div className="ficon-banner-copy">
        <FiconWordmark />
        <h2 id="home-ficon">¡Internet de fibra óptica para tu casa y tu empresa!</h2>
        <span className="ficon-banner-tag">ALIADO</span>
        <p>Con Ficon, nuestra empresa aliada: planes desde 200 Mbps y conexión empresarial.</p>
        <Link className="ficon-banner-cta" to="/ficon">
          Ver planes de Ficon
        </Link>
      </div>
      <div className="ficon-banner-media">
        <span className="ficon-banner-caption">Ficon · Fibra óptica</span>
        {FICON_VIDEO ? (
          <>
            <video ref={video} src={FICON_VIDEO} autoPlay muted loop playsInline />
            <button
              type="button"
              className="ficon-banner-sound"
              aria-pressed={!muted}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              onClick={() => {
                if (!video.current) return;
                video.current.muted = !muted;
                setMuted(!muted);
              }}
            >
              <SoundIcon muted={muted} />
            </button>
          </>
        ) : (
          <FibreAnimation />
        )}
      </div>
    </section>
  );
}
