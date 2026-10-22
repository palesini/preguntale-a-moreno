// Sol de Mayo: 32 rayos alternados, rectos y flamígeros, como en la bandera. Dibujo propio en SVG.
// Con `cara`, lleva en el centro el sticker de Moreno sobre un disco blanco.
const RAYOS = Array.from({ length: 32 }, (_, i) => i);

export function SolDeMayo({ className, title, cara = false }: { className?: string; title?: string; cara?: boolean }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <g fill="var(--sol)" stroke="var(--sol-borde)" strokeWidth="0.6" strokeLinejoin="round">
        {RAYOS.map((i) =>
          i % 2 === 0 ? (
            <polygon key={i} points="-2.6,-27 2.6,-27 0,-49" transform={`rotate(${i * 11.25})`} />
          ) : (
            <path
              key={i}
              d="M -2 -27 C 1.5 -31 -2.5 -35 0.6 -39 C 2.8 -42 -1 -44.5 0.4 -47 C -0.6 -44.5 3.2 -42 1.2 -38.6 C -1.6 -34.6 2.6 -31 2 -27 Z"
              transform={`rotate(${i * 11.25})`}
            />
          )
        )}
        <circle r="26" />
      </g>
      {cara ? (
        <>
          <circle r="23" fill="var(--blanco)" stroke="var(--sol-borde)" strokeWidth="0.6" />
          <image href="/moreno-cara.png" x="-14.6" y="-21.5" width="29.2" height="42.3" />
        </>
      ) : (
        <circle r="21.5" fill="none" stroke="var(--sol-borde)" strokeWidth="0.6" opacity="0.55" />
      )}
    </svg>
  );
}
