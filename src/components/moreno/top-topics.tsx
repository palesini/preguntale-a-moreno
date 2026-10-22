"use client";

import { useState, useEffect } from "react";
import { Hash } from "lucide-react";

interface Topic {
  topic: string;
  count: number;
}

interface Stats {
  total_frases?: number;
  palabras_totales?: number;
  longitud_promedio?: number;
}

export function TopTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics || []);
        setStats(data.stats || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxCount = topics[0]?.count || 1;

  return (
    <section className="newspaper-frame bg-card/60 p-4 sm:p-6">
      <header className="border-b-2 border-primary pb-2 mb-4 flex items-center gap-2">
        <Hash className="h-5 w-5 text-primary" />
        <h2
          className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-primary"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Top Topics del Corpus
        </h2>
      </header>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center border border-primary/30 bg-secondary/40 p-2">
        <div>
          <div className="font-display text-2xl font-bold text-primary">
            {stats.total_frases?.toLocaleString() ?? "—"}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
            Frases
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-primary">
            {stats.palabras_totales?.toLocaleString() ?? "—"}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
            Palabras
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-primary">
            {stats.longitud_promedio ?? "—"}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
            Carácter/Frase
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground font-body italic text-sm">
          Cargando doctrina...
        </div>
      ) : (
        <>
          {/* Bar chart vertical */}
          <div className="space-y-1">
            {topics.slice(0, 30).map((t) => (
              <button
                key={t.topic}
                onClick={() => setSelected(selected === t.topic ? null : t.topic)}
                className="block w-full text-left group"
              >
                <div className="flex items-baseline gap-2 text-sm font-body">
                  <span className="font-bold text-primary uppercase text-xs w-32 sm:w-40 truncate">
                    {t.topic}
                  </span>
                  <div className="flex-1 h-4 bg-secondary/60 border border-primary/20 overflow-hidden">
                    <div
                      className="h-full bg-primary group-hover:bg-accent transition-all"
                      style={{ width: `${(t.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-body w-10 text-right">
                    {t.count}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Topic expandido */}
          {selected && <TopicDetail topic={selected} />}

          <footer className="border-t border-primary/40 mt-4 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-body">
            Análisis temático sobre 2564 frases originales · Búsqueda por palabra clave
          </footer>
        </>
      )}
    </section>
  );
}

function TopicDetail({ topic }: { topic: string }) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(topic)}&limit=5`);
        const data = await r.json();
        if (!cancelled) {
          setResults(data.results || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  return (
    <div className="mt-4 border-l-4 border-accent pl-3 bg-secondary/30 p-3">
      <div className="font-display font-bold text-sm uppercase tracking-wide text-accent mb-2">
        Frases que mencionan &quot;{topic}&quot;
      </div>
      {loading ? (
        <div className="text-xs italic text-muted-foreground">Buscando...</div>
      ) : results.length === 0 ? (
        <div className="text-xs italic text-muted-foreground">
          No hay frases para este término.
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="text-xs italic text-foreground/80 font-body leading-snug"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              “{r.slice(0, 240)}{r.length > 240 ? "…" : ""}”
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
