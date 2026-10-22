"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Quote, RefreshCw, RotateCcw, Send, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Kind = "chat" | "corpus" | "error";

interface Message {
  role: "user" | "assistant";
  content: string;
  kind?: Kind; // "corpus" (frase real pedida) y "error" no viajan al LLM como historial
  modo?: "ia" | "archivo";
  frasesFuente?: string[];
  retryText?: string;
}

const SUGERENCIAS = [
  "¿Cómo salimos de la pobreza?",
  "¿Qué pensás de Milei?",
  "¿Por qué hay que reindustrializar?",
  "¿Quién tiene que pagar la deuda?",
  "¿Trump es peronista?",
  "¿Qué pasa con la Pampa Húmeda?",
  "¿Qué hora es?",
];

const AVISO = "Asistente de IA entrenado con frases públicas de Guillermo Moreno. Las respuestas se generan automáticamente.";

export function ModoMoreno({ telegramUrl }: { telegramUrl?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length === 0) el.scrollTo({ top: 0 });
    else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // textarea que crece con el texto (hasta ~5 líneas)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const send = useCallback(
    async (text: string, base: Message[] = messages) => {
      const content = text.trim();
      if (!content || loading) return;
      const next: Message[] = [...base, { role: "user", content }];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const history = next
          .filter((m) => (m.kind ?? "chat") === "chat")
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.response) throw new Error(data.error || `Error ${res.status}`);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.response, modo: data.modo, frasesFuente: data.frases_fuente || [] },
        ]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            kind: "error",
            content: (err as Error).message || "No hay conexión con el servidor.",
            retryText: content,
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [messages, loading]
  );

  const retry = (idx: number) => {
    const msg = messages[idx];
    if (msg.retryText) send(msg.retryText, messages.slice(0, idx - 1));
  };

  const fraseReal = async () => {
    try {
      const data = await (await fetch("/api/random")).json();
      setMessages((m) => [...m, { role: "assistant", kind: "corpus", content: data.frase }]);
    } catch {
      toast({ title: "No se pudo traer una frase", variant: "destructive" });
    }
  };

  const share = async (msg: Message) => {
    const real = msg.kind === "corpus" || msg.modo === "archivo";
    const firma = real ? "— Guillermo Moreno" : "— El Modo Moreno (IA entrenada con frases de Guillermo Moreno)";
    const text = `“${msg.content}”\n${firma}\n${window.location.origin}`;
    try {
      if (navigator.share) await navigator.share({ title: "El Modo Moreno", text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "Pegalo donde quieras." });
      }
    } catch {
      /* compartir cancelado */
    }
  };

  const nuevaCharla = () => {
    setMessages([]);
    setOpen({});
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-dvh flex-col bg-azul">
      <header className="flex items-center gap-3 border-b border-azul-3 px-4 py-2.5 sm:px-6">
        <img src="/pyv-logo.png" alt="Principios y Valores" width={40} height={40} className="h-10 w-10" />
        <span className="font-display text-2xl font-bold leading-none tracking-tight">El Modo Moreno</span>
        <nav className="ml-auto flex items-center gap-2">
          {!empty && (
            <button
              onClick={nuevaCharla}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-niebla hover:bg-azul-2 hover:text-blanco"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Nueva charla</span>
            </button>
          )}
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-celeste px-3 py-1.5 text-sm font-medium text-celeste hover:bg-celeste hover:text-azul"
            >
              <Send className="h-4 w-4" aria-hidden />
              <span>Telegram</span>
            </a>
          )}
        </nav>
      </header>

      <main ref={scrollRef} className="scroll-fino flex-1 overflow-y-auto" aria-live="polite">
        {empty ? (
          <Portada onPick={(q) => send(q)} />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
            {messages.map((m, i) => (
              <Burbuja
                key={i}
                m={m}
                open={!!open[i]}
                onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                onShare={() => share(m)}
                onRetry={() => retry(i)}
                busy={loading}
              />
            ))}
            {loading && (
              <div
                className="flex items-center gap-1.5 self-start rounded-2xl rounded-tl-sm bg-azul-2 px-4 py-3.5"
                aria-label="Moreno está escribiendo"
              >
                <span className="typing-dot h-2 w-2 rounded-full bg-celeste" />
                <span className="typing-dot h-2 w-2 rounded-full bg-celeste" />
                <span className="typing-dot h-2 w-2 rounded-full bg-celeste" />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-azul-3 bg-azul px-4 pb-3 pt-3 sm:px-6">
        <form
          className="mx-auto flex max-w-2xl items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <button
            type="button"
            onClick={fraseReal}
            title="Una frase real de Guillermo Moreno"
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm text-niebla hover:bg-azul-2 hover:text-blanco"
          >
            <Quote className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Frase real</span>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Preguntale a Moreno…"
            aria-label="Tu pregunta"
            disabled={loading}
            className="min-h-12 flex-1 resize-none rounded-3xl bg-blanco px-5 py-3 text-base text-azul placeholder:text-azul/50 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Enviar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-celeste text-azul hover:bg-blanco disabled:opacity-40"
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-niebla">{AVISO}</p>
      </footer>
    </div>
  );
}

function Portada({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-8 text-center">
      <div className="relative flex aspect-square w-full max-w-[min(26rem,72vw)] items-center justify-center">
        <Anillos />
        <h1 className="banda relative z-10 w-[112%] py-2 font-display font-extrabold uppercase leading-[0.86] tracking-tight">
          <span className="block text-[clamp(2.6rem,11vw,4.6rem)]">Preguntale a</span>
          <span className="block text-[clamp(3.6rem,16vw,6.6rem)] text-celeste">Moreno</span>
        </h1>
      </div>
      <p className="mt-2 max-w-md text-lg text-niebla">
        La economía es producción y trabajo, no especulación y renta. Preguntá lo que quieras: política, economía o lo que se
        te ocurra.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Preguntas para empezar">
        {SUGERENCIAS.map((q, i) => (
          <li key={q} className={i >= 4 ? "hidden sm:block" : undefined}>
            <button
              onClick={() => onPick(q)}
              className="rounded-full border border-azul-3 bg-azul-2 px-4 py-2 text-sm text-blanco hover:border-celeste hover:text-celeste"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Doble anillo celeste-blanco-celeste del logo de Principios y Valores.
function Anillos() {
  return (
    <svg viewBox="0 0 100 100" className="anillos absolute inset-0 h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="46.5" fill="none" stroke="var(--celeste)" strokeWidth="3" />
      <circle cx="50" cy="50" r="43.5" fill="none" stroke="var(--blanco)" strokeWidth="3" />
      <circle cx="50" cy="50" r="40.5" fill="none" stroke="var(--celeste)" strokeWidth="3" />
    </svg>
  );
}

function Burbuja({
  m,
  open,
  onToggle,
  onShare,
  onRetry,
  busy,
}: {
  m: Message;
  open: boolean;
  onToggle: () => void;
  onShare: () => void;
  onRetry: () => void;
  busy: boolean;
}) {
  if (m.role === "user") {
    return (
      <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-celeste px-4 py-3 text-base font-medium text-azul">
        {m.content}
      </div>
    );
  }

  if (m.kind === "error") {
    return (
      <div
        role="alert"
        className="flex max-w-[85%] items-start gap-2 self-start rounded-2xl border border-alerta/60 px-4 py-3 text-alerta"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p>{m.content}</p>
          {m.retryText && (
            <button
              onClick={onRetry}
              disabled={busy}
              className="mt-1 flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (m.kind === "corpus") {
    return (
      <figure className="max-w-[90%] self-start rounded-2xl bg-blanco px-5 pb-3 pt-4 text-azul">
        <Quote className="h-6 w-6 text-sol" aria-hidden />
        <blockquote className="mt-1 text-lg font-medium leading-snug first-letter:uppercase">{m.content}</blockquote>
        <figcaption className="mt-2 flex items-center justify-between gap-3 text-sm text-azul/70">
          <span>Frase real de Guillermo Moreno</span>
          <button onClick={onShare} className="flex items-center gap-1 hover:text-azul">
            <Share2 className="h-4 w-4" aria-hidden /> Compartir
          </button>
        </figcaption>
      </figure>
    );
  }

  const fuentes = m.frasesFuente ?? [];
  return (
    <div className="flex max-w-[90%] flex-col self-start">
      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-azul-2 px-4 py-3 text-base leading-relaxed">
        {m.content}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-niebla">
        {m.modo === "archivo" && (
          <span className="text-sol" title="La IA estaba ocupada: esta respuesta cita frases reales.">
            Cita real del archivo
          </span>
        )}
        {fuentes.length > 0 && (
          <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-1 hover:text-blanco">
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
            En qué se basó
          </button>
        )}
        <button onClick={onShare} className="flex items-center gap-1 hover:text-blanco">
          <Share2 className="h-4 w-4" aria-hidden /> Compartir
        </button>
      </div>
      {open && fuentes.length > 0 && (
        <ul className="mt-2 space-y-2 border-l-2 border-celeste pl-3 text-sm text-niebla">
          {fuentes.map((f, i) => (
            <li key={i} className="italic first-letter:uppercase">
              “{f.length > 260 ? f.slice(0, 260) + "…" : f}”
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
