import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_TZ = "Asia/Kolkata";

/**
 * Converts any date/timestamp to a UTC ISO string for storage.
 */
export const toUTC = (date?: string | Date | number): string => {
  return dayjs(date).utc().toISOString();
};

/**
 * Converts a UTC timestamp to an IST dayjs object.
 */
export const toIST = (utcDate: string | Date | number) => {
  return dayjs(utcDate).tz(IST_TZ);
};

/**
 * Formats a UTC timestamp in IST for display.
 */
export const formatIST = (utcDate: string | Date | number, formatStr = "DD MMM YYYY, hh:mm A") => {
  return toIST(utcDate).format(formatStr);
};

/**
 * Returns the start and end of the current month in UTC (based on IST perspective).
 */
export const getMonthRangeUTC = () => {
  const istNow = dayjs().tz(IST_TZ);
  const start = istNow.startOf("month").utc().toISOString();
  const end = istNow.endOf("month").utc().toISOString();
  return { start, end };
};

export default dayjs;
