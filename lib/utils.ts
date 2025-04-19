// lib/utils.ts

/**
 * Une classes condicionais numa string
 */
export function cn(...classes: (string | false | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
  }
  