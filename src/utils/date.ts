export const addDays = (d: Date, n: number) => new Date(d.getTime() + n*24*3600*1000);
export const startOfDayUtc = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0));
export const toIso = (d: Date) => d.toISOString().split(".")[0] + "Z"; // без миллисекунд
export const formatHm = (isoUtc: string) => new Date(isoUtc).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
export const formatWeekday = (d: Date) => d.toLocaleDateString([], { weekday:"short", day:"2-digit", month:"short" });

