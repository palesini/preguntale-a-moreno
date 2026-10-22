// Historial en memoria por usuario/chat (LRU). Lo usan WhatsApp y Telegram.
// En serverless se pierde al reciclarse la instancia; alcanza para charlas cortas.
import type { ChatTurn } from "./reply";

export interface ConversationStore {
  add(id: string, turn: ChatTurn): ChatTurn[];
  clear(id: string): void;
  clearAll(): void;
}

export function createConversationStore({ maxTurns = 12, maxUsers = 500 } = {}): ConversationStore {
  const map = new Map<string, ChatTurn[]>();
  return {
    add(id, turn) {
      const conv = map.get(id) ?? [];
      map.delete(id); // re-insertar para mantener el orden LRU
      conv.push(turn);
      const trimmed = conv.slice(-maxTurns);
      map.set(id, trimmed);
      if (map.size > maxUsers) map.delete(map.keys().next().value!);
      return [...trimmed]; // copia: el llamador no ve mutaciones posteriores
    },
    clear: (id) => void map.delete(id),
    clearAll: () => map.clear(),
  };
}
