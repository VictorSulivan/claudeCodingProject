const TZ = "Europe/Paris";

/**
 * Convertit une valeur datetime-local ("YYYY-MM-DDTHH:mm") en Date UTC,
 * en interprétant l'heure comme heure française (Europe/Paris, DST compris).
 */
export function parseParisDateTime(localStr: string): Date {
  const [datePart, timePart] = localStr.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);

  // Première approximation : on traite la valeur comme UTC
  const approxUtc = new Date(Date.UTC(y, mo - 1, d, h, mi));

  // On mesure le décalage Paris↔UTC à cet instant (tient compte du DST)
  const offsetMin = getParisOffsetMinutes(approxUtc);

  // UTC réel = heure Paris − décalage
  return new Date(approxUtc.getTime() - offsetMin * 60_000);
}

/**
 * Formate une Date UTC en string datetime-local ("YYYY-MM-DDTHH:mm")
 * exprimée en heure de Paris — pour pré-remplir les <input type="datetime-local">.
 */
export function formatParisDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Offset Europe/Paris en minutes par rapport à UTC (ex : +60 en hiver, +120 en été). */
function getParisOffsetMinutes(utcDate: Date): number {
  const fmt = (tz: string) =>
    utcDate
      .toLocaleString("sv-SE", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(" ", "T");

  const utcMs = new Date(fmt("UTC") + "Z").getTime();
  const parisMs = new Date(fmt(TZ) + "Z").getTime();
  return (parisMs - utcMs) / 60_000;
}
