"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Quote, RotateCcw, Share2, ChevronDown, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Kind = "chat" | "corpus" | "error";

interface Message {
  role: "user" | "assistant";
  content: string;
  kind?: Kind; // "corpus" (frase real) y "error" no se mandan al LLM como historial
  frasesFuente?: string[];
  retryText?: string;
}

interface ChatProps {
  randomPhrase?: () => Promise<{ frase: string }>;
}

const SUGGESTED_PROMPTS = [
  "¿Cómo salir de la pobreza?",
  "¿Qué pensás de Milei?",
  "¿Qué hacer con Kicillof?",
  "¿Por qué reindustrializar?",
  "¿Quién paga la deuda?",
  "¿Trump es peronista?",
  "¿Qué hora es?",
];

const WELCOME: Message = {
  role: "assistant",
  content:
    "Mirá, yo soy Guillermo Moreno. Preguntame lo que quieras, que la economía es producción y trabajo, no especulación y renta. Hablá, muchacho.",
};

export function Chat({ randomPhrase }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string, base: Message[] = messages) => {
      const content = text.trim();
      if (!content || loading) return;
      const userMsg: Message = { role: "user", content };
      const next = [...base, userMsg];
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
        if (!res.ok || !data.response) {
          throw new Error(data.error || `Error ${res.status}`);
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.response, frasesFuente: data.frases_fuente || [] },
        ]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            kind: "error",
            content: (err as Error).message || "No se pudo conectar con el servidor.",
            retryText: content,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  // Reintentar: saca el error y el mensaje del usuario que lo causó, y vuelve a mandarlo.
  const retry = (idx: number) => {
    const msg = messages[idx];
    if (!msg.retryText) return;
    send(msg.retryText, messages.slice(0, idx - 1));
  };

  const handleRandom = async () => {
    if (!randomPhrase) return;
    try {
      const data = await randomPhrase();
      setMessages((m) => [...m, { role: "assistant", kind: "corpus", content: data.frase }]);
    } catch {
      toast({ title: "No se pudo traer una frase", variant: "destructive" });
    }
  };

  const handleShare = async (msg: Message) => {
    const firma =
      msg.kind === "corpus"
        ? "— Guillermo Moreno (frase real del corpus)"
        : "— El Modo Guillermo (respuesta generada por IA, no es una declaración real)";
    const text = `"${msg.content}"\n${firma}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "El Modo Guillermo", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "Pegalo donde quieras." });
      }
    } catch {
      /* el usuario canceló el share */
    }
  };

  const handleReset = () => {
    setMessages([WELCOME]);
    setShowSources({});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="newspaper-frame bg-card/60 backdrop-blur-sm flex flex-col h-[70vh] min-h-[500px]">
      <div className="border-b border-primary/40 px-4 py-2 flex items-center justify-between bg-secondary/50">
        <span className="font-display font-bold text-sm uppercase tracking-wider text-primary">
          Conversación con Moreno
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandom}
            className="text-xs px-2 py-1 border border-primary/40 hover:bg-primary hover:text-primary-foreground transition uppercase tracking-wider font-body flex items-center gap-1"
            title="Traer una frase real del corpus"
          >
            <Quote className="h-3 w-3" />
            <span className="hidden sm:inline">Frase real</span>
          </button>
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 border border-primary/40 hover:bg-primary hover:text-primary-foreground transition uppercase tracking-wider font-body flex items-center gap-1"
            title="Reiniciar conversación"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto vintage-scroll p-3 sm:p-4 space-y-4 bg-background/30"
        aria-live="polite"
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            first={idx === 0}
            showSource={showSources[idx] || false}
            onToggleSource={() => setShowSources((s) => ({ ...s, [idx]: !s[idx] }))}
            onShare={() => handleShare(msg)}
            onRetry={() => retry(idx)}
            disabled={loading}
          />
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="text-xs uppercase text-muted-foreground font-body min-w-[60px] text-right pt-1">
              Guillermo
            </div>
            <div className="bubble-moreno px-4 py-3 flex items-center gap-1" aria-label="Escribiendo">
              <span className="typing-dot inline-block h-2 w-2 bg-primary rounded-full" />
              <span className="typing-dot inline-block h-2 w-2 bg-primary rounded-full" />
              <span className="typing-dot inline-block h-2 w-2 bg-primary rounded-full" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-3 sm:px-4 py-2 border-t border-primary/40 bg-secondary/30">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-body">
            Sugerencias para arrancar
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs px-2 py-1 border border-primary/30 hover:bg-primary hover:text-primary-foreground transition font-body italic"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-primary/40 p-3 sm:p-4 bg-secondary/50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntale a Guillermo..."
            rows={1}
            maxLength={2000}
            aria-label="Tu pregunta"
            className="flex-1 resize-none border border-primary/40 bg-card px-3 py-2 font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70 max-h-32"
            disabled={loading}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 hover:bg-accent transition flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed uppercase text-xs tracking-wider font-body border-2 border-primary"
            title="Enviar mensaje"
          >
            <Send className="h-3 w-3" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground font-body italic">
          Respuestas generadas por IA a partir de frases públicas. No son declaraciones reales de
          Guillermo Moreno.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  first,
  showSource,
  onToggleSource,
  onShare,
  onRetry,
  disabled,
}: {
  message: Message;
  first: boolean;
  showSource: boolean;
  onToggleSource: () => void;
  onShare: () => void;
  onRetry: () => void;
  disabled: boolean;
}) {
  const isUser = message.role === "user";
  const kind = message.kind ?? "chat";

  if (kind === "error") {
    return (
      <div className="flex items-start gap-2" role="alert">
        <div className="min-w-[60px]" />
        <div className="flex-1 max-w-[85%] border border-accent/60 bg-accent/5 px-3 py-2 text-sm font-body flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <div>{message.content}</div>
            {message.retryText && (
              <button
                onClick={onRetry}
                disabled={disabled}
                className="mt-1 text-xs uppercase tracking-wider text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" /> Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "corpus") {
    return (
      <div className="flex items-start gap-2">
        <div className="text-xs uppercase text-muted-foreground font-body whitespace-nowrap pt-1 min-w-[60px] text-right">
          Archivo
        </div>
        <figure className="flex-1 max-w-[85%] border-y-2 border-primary/50 bg-card px-4 py-3">
          <figcaption className="text-xs uppercase tracking-wider text-primary font-body font-bold mb-1">
            Frase real del corpus
          </figcaption>
          <blockquote className="font-body italic text-sm sm:text-base leading-relaxed">
            “{message.content}”
          </blockquote>
          <button
            onClick={onShare}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition uppercase tracking-wider"
          >
            <Share2 className="h-3 w-3" /> Compartir
          </button>
        </figure>
      </div>
    );
  }

  const sources = message.frasesFuente ?? [];
  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="text-xs uppercase text-muted-foreground font-body whitespace-nowrap pt-1 min-w-[60px] text-right">
        {isUser ? "Vos" : "Guillermo"}
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className={`px-4 py-3 ${isUser ? "bubble-user" : "bubble-moreno"} ${first ? "drop-cap" : ""}`}>
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-body">
            {message.content}
          </div>
        </div>

        {!isUser && !first && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
            {sources.length > 0 && (
              <button
                onClick={onToggleSource}
                aria-expanded={showSource}
                className="flex items-center gap-1 hover:text-primary transition uppercase tracking-wider"
              >
                <ChevronDown className={`h-3 w-3 transition ${showSource ? "rotate-180" : ""}`} />
                En qué se basó ({sources.length})
              </button>
            )}
            <button
              onClick={onShare}
              className="flex items-center gap-1 hover:text-primary transition uppercase tracking-wider"
            >
              <Share2 className="h-3 w-3" />
              Compartir
            </button>
          </div>
        )}

        {!isUser && showSource && sources.length > 0 && (
          <div className="mt-2 border-l-2 border-accent pl-3 space-y-1.5 bg-secondary/40 p-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-body font-bold">
              Frases reales del corpus usadas como base:
            </div>
            {sources.map((f, i) => (
              <div key={i} className="text-xs italic text-foreground/80 font-body leading-snug">
                “{f.length > 280 ? f.slice(0, 280) + "…" : f}”
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
