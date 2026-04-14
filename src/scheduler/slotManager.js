import { FREE_TIME_SLOTS } from '../../config/schedule.js';
import { format, addDays, getDay } from 'date-fns';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

/**
 * Resolve concrete date+time slots for the next N days.
 * Each returned slot tracks usedHours so the scheduler can fill it.
 *
 * @param {Date}   fromDate  - start date (inclusive)
 * @param {number} days      - how many days to look ahead (default 7)
 * @returns {Array<{ name, date, startTime, endTime, capacityHours, usedHours, label }>}
 */
export function getAvailableSlots(fromDate = new Date(), days = 7) {
  const slots = [];

  for (let d = 0; d < days; d++) {
    const date    = addDays(fromDate, d);
    const dayName = DAY_NAMES[getDay(date)];
    const dateStr = format(date, 'yyyy-MM-dd');

    for (const slot of FREE_TIME_SLOTS) {
      if (!slot.days.includes(dayName)) continue;

      const startTime = `${pad(slot.startHour)}:${pad(slot.startMinute)}`;
      const endTime   = `${pad(slot.endHour)}:${pad(slot.endMinute)}`;

      slots.push({
        name:          slot.name,
        date:          dateStr,
        startTime,
        endTime,
        capacityHours: slot.capacityHours,
        usedHours:     0,
        label:         `${dateStr} ${startTime}–${endTime}`,
      });
    }
  }

  return slots;
}

function pad(n) {
  return String(n).padStart(2, '0');
}
