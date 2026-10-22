import { ModoMoreno } from "@/components/moreno/modo-moreno";

export default function Home() {
  return <ModoMoreno telegramUrl={process.env.NEXT_PUBLIC_TELEGRAM_URL} />;
}
