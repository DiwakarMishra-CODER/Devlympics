/**
 * Tiny class-name joiner. Keeps the component layer dependency-free while
 * still letting callers pass conditional classes.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
