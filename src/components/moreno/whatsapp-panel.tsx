"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export function WhatsAppPanel() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = `# 1) Crear cuenta en Twilio y activar el WhatsApp Sandbox
# https://console.twilio.com → Messaging → Try it out → WhatsApp

# 2) En el .env del servidor:
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WEBHOOK_URL=https://TU_DOMINIO/api/whatsapp

# 3) En Twilio, "When a message comes in":
#   POST https://TU_DOMINIO/api/whatsapp

# 4) Probar en local (modo demo, sin token):
curl -X POST http://localhost:3000/api/whatsapp \\
  -d "Body=¿Qué pensás de Milei?" \\
  -d "From=whatsapp:+54911XXXXXXXX"`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="border-2 border-accent bg-card/60 p-4 sm:p-6">
      <header className="border-b-2 border-accent pb-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <h2
            className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-accent"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Conectar a WhatsApp
          </h2>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-accent hover:opacity-70"
          aria-label="Expandir"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </header>

      <p className="text-sm font-body italic text-foreground/80 mb-3">
        El webhook ya está armado en <code className="bg-secondary/60 px-1 py-0.5 text-xs">/api/whatsapp</code>.
        Solo necesitás creds de Twilio y un servidor siempre corriendo.
        Acá tenés el paso a paso.
      </p>

      {expanded && (
        <div className="bg-secondary/40 border border-accent/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-accent font-body">
              Guía de activación
            </div>
            <button
              onClick={copy}
              className="text-xs flex items-center gap-1 hover:text-accent uppercase tracking-wider"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <pre className="text-[10px] sm:text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-background/60 p-2 border border-primary/20">
{code}
          </pre>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-body">
        <div className="border border-primary/30 p-1.5 text-center">
          <div className="font-bold text-accent text-base">POST</div>
          <div>/api/whatsapp</div>
        </div>
        <div className="border border-primary/30 p-1.5 text-center">
          <div className="font-bold text-primary text-base">Twilio</div>
          <div>WhatsApp API</div>
        </div>
      </div>
    </section>
  );
}
