/**
 * Your free time slots — edit this file to match your real availability.
 *
 * days:          days of week (lowercase)
 * startHour/Min: slot start in 24h format
 * endHour/Min:   slot end in 24h format
 * capacityHours: realistic usable hours within the slot (can be less than the full window)
 */
export const FREE_TIME_SLOTS = [
  {
    name: 'Weekday Evenings',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startHour: 19, startMinute: 0,
    endHour: 21,   endMinute: 0,
    capacityHours: 1.5,
  },
  {
    name: 'Saturday Morning',
    days: ['saturday'],
    startHour: 9,  startMinute: 0,
    endHour: 12,   endMinute: 0,
    capacityHours: 2.5,
  },
  {
    name: 'Sunday Planning',
    days: ['sunday'],
    startHour: 10, startMinute: 0,
    endHour: 11,   endMinute: 0,
    capacityHours: 0.75,
  },
];
