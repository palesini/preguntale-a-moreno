"use client";

import { Flag, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-primary bg-card/40 py-4">
      {/* Tira de bandera inferior */}
      <div className="flag-strip h-1.5 w-full mb-3" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">
          <Flag className="h-3 w-3" />
          <span>Los días más felices fueron, son y serán peronistas</span>
          <Heart className="h-3 w-3" />
        </div>
        <div className="text-[10px] text-muted-foreground/70 font-body italic">
          Prototipo de chatbot doctrinario · Corpus: 2564 frases · 95.040 palabras ·
          Sin fines de lucro · Hecho con orgullo peronista
        </div>
      </div>
    </footer>
  );
}
