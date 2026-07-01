import Link from "next/link";

type Event = {
  id: string;
  title: string;
  startDate: Date;
  location: string | null;
  isPublic: boolean;
};

type Props = {
  events: Event[];
};

export function UpcomingEventsList({ events }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">Prochains événements</h4>
        <Link href="/dashboard/events" className="text-sm text-blue-600 hover:underline transition-colors">
          Voir tout
        </Link>
      </div>
      <div className="space-y-3">
        {events.length === 0 && (
          <p className="text-slate-400 text-sm">Aucun événement à venir.</p>
        )}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/dashboard/events/${e.id}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-600">
                {e.startDate.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "Europe/Paris" })}
              </span>
              <span className="text-xs text-blue-400">
                {e.startDate.toLocaleDateString("fr-FR", { month: "short", timeZone: "Europe/Paris" })}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
              <p className="text-xs text-slate-400">
                {e.startDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Paris",
                })}
                {e.location && ` · ${e.location}`}
              </p>
              {e.isPublic && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                  Public
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
