import QuestLog from "@/components/QuestLog";
import SetupNotice from "@/components/SetupNotice";
import { getQuests, getStats } from "./actions";

// The quest list is read from Neon on every request.
export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const [quests, stats] = await Promise.all([getQuests(), getStats()]);
    return (
      <main className="page">
        <QuestLog initialQuests={quests} initialStats={stats} />
      </main>
    );
  } catch (err) {
    // No DATABASE_URL, unreachable database, or tables not yet created:
    // show setup instructions instead of crashing.
    return (
      <main className="page">
        <SetupNotice detail={err instanceof Error ? err.message : undefined} />
      </main>
    );
  }
}
