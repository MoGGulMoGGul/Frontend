import { getPublicTips, type PublicTipItem } from "@/lib/tips";
import HomeClient from "./HomeClient";

export const revalidate = 60; // ISR: 60초마다 백그라운드 갱신

export default async function Home() {
  const initial: PublicTipItem[] = await getPublicTips(); // 서버에서 먼저 가져오기
  return <HomeClient initial={initial} />;
}
