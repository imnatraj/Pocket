import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const toUTC = (date: string | Date) => dayjs(date).utc().toDate();
export const formatUTC = (date: Date) => dayjs(date).utc().format();

export default dayjs;
