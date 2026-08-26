// Polling day runs 9:00 AM to 6:30 PM (18:30)
export function getPollingStatus(now = new Date()) {
  const start = new Date(now);
  start.setHours(9, 0, 0, 0);
  const end = new Date(now);
  end.setHours(18, 30, 0, 0);

  if (now < start) {
    return { phase: 'before', label: 'Polling opens at 9:00 AM', minutesLeft: null };
  }
  if (now > end) {
    return { phase: 'after', label: 'Polling closed at 6:30 PM', minutesLeft: 0 };
  }
  const minutesLeft = Math.round((end - now) / 60000);
  const totalMinutes = Math.round((end - start) / 60000);
  const elapsedMinutes = totalMinutes - minutesLeft;
  const timeElapsedPercent = Math.round((elapsedMinutes / totalMinutes) * 100);
  return {
    phase: 'live',
    label: `Polling closes in ${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`,
    minutesLeft,
    timeElapsedPercent,
  };
}
