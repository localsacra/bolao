export function formatMatchTime(utcDateString: string): string {
  const date = new Date(utcDateString);
  // Convert to BRT (UTC-3)
  const brtDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const day = brtDate.getUTCDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[brtDate.getUTCMonth()];
  const hours = String(brtDate.getUTCHours()).padStart(2, '0');
  const minutes = String(brtDate.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes} BRT`;
}

export function formatProfileDate(utcDateString: string): string {
  const date = new Date(utcDateString);
  // Convert to BRT (UTC-3)
  const brtDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const day = brtDate.getUTCDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[brtDate.getUTCMonth()];
  const year = brtDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
