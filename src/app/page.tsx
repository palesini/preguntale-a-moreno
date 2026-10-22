import { PreguntaleAMoreno } from "@/components/moreno/preguntale-a-moreno";

export default function Home() {
  return <PreguntaleAMoreno telegramUrl={process.env.NEXT_PUBLIC_TELEGRAM_URL} />;
}
