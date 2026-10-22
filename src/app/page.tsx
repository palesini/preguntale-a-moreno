"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/moreno/header";
import { Chat } from "@/components/moreno/chat";
import { TopTopics } from "@/components/moreno/top-topics";
import { WhatsAppPanel } from "@/components/moreno/whatsapp-panel";
import { Footer } from "@/components/moreno/footer";

export default function Home() {
  const [stats, setStats] = useState<{ total_frases?: number }>({});

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((d) => setStats(d.stats || {}))
      .catch(() => {});
  }, []);

  const fetchRandom = async () => {
    const r = await fetch("/api/random");
    return r.json();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header stats={stats} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Layout: chat principal + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal: Chat */}
          <div className="lg:col-span-2">
            <Chat randomPhrase={fetchRandom} />
          </div>

          {/* Sidebar: Top Topics + WhatsApp */}
          <aside className="space-y-6">
            <TopTopics />
            <WhatsAppPanel />
          </aside>
        </div>

        {/* Pie editorial */}
        <div className="mt-8 border-t border-b border-primary/40 py-4 px-2 text-center">
          <p
            className="font-body italic text-sm text-foreground/70 leading-relaxed"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            “La única doctrina nueva es el peronismo. Todas estas son viejas: la
            liberal, la marxista, la socialdemócrata, la neo liberal, son todas del
            siglo XIX. La única del siglo XX es el peronismo.”
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-body">
            — Guillermo Moreno
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
