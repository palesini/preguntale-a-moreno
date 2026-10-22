"use client";

import { Newspaper, Radio, Zap } from "lucide-react";

interface HeaderProps {
  stats?: {
    total_frases?: number;
    palabras_totales?: number;
  };
}

export function Header({ stats }: HeaderProps) {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b-2 border-primary bg-card/50">
      {/* Tira de bandera */}
      <div className="flag-strip h-1.5 w-full" />

      {/* Cabecera tipo diario */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-3 items-center text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1">
            <Newspaper className="h-3 w-3" />
            <span className="hidden sm:inline">Edición Extraordinaria</span>
            <span className="sm:hidden">Edición</span>
          </div>
          <div className="text-center capitalize">{today}</div>
          <div className="text-right flex items-center justify-end gap-1">
            <Radio className="h-3 w-3" />
            <span className="hidden sm:inline">Transmisión en Vivo</span>
            <span className="sm:hidden">En Vivo</span>
          </div>
        </div>

        <div className="text-center py-4">
          <h1
            className="font-display font-black tracking-tight leading-none text-4xl sm:text-6xl md:text-7xl"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--primary)",
            }}
          >
            EL MODO GUILLERMO
          </h1>
          <p
            className="font-body italic text-sm sm:text-lg text-foreground/80 mt-2"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            “La única doctrina nueva es el peronismo. Las demás son del siglo XIX.”
          </p>
        </div>

        {/* Subcabecera estilo diario */}
        <div className="border-t border-b border-primary/40 py-2 flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>Año I · Nº 1</span>
          <span className="hidden sm:inline">Órgano de difusión doctrinaria</span>
          <span className="hidden sm:inline">Precio: dos ratificaciones de Perón</span>
          <span>{stats?.total_frases ?? "—"} frases archivadas</span>
        </div>
      </div>
    </header>
  );
}
