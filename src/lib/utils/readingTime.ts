export function readingTime(words: number): number {
  const wpm = 200;
  return Math.max(1, Math.round(words / wpm));
}
