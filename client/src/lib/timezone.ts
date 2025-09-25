import { formatDistanceToNow } from "date-fns";

/**
 * Utility functions for handling dates consistently in CDT/CST timezone
 * (America/Chicago timezone which automatically handles daylight saving time)
 */

const CHICAGO_TIMEZONE = "America/Chicago";

/**
 * Format a date string for display in CDT timezone
 * @param dateString ISO date string
 * @param includeTime Whether to include time in the output
 */
export function formatDateCDT(dateString: string, includeTime = true): string {
  const date = new Date(dateString);
  
  if (includeTime) {
    return date.toLocaleDateString("en-US", {
      timeZone: CHICAGO_TIMEZONE,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      timeZone: CHICAGO_TIMEZONE,
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Format just the time portion in CDT timezone
 * @param dateString ISO date string
 */
export function formatTimeCDT(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    timeZone: CHICAGO_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 hours ago") 
 * Note: This returns relative time strings that already include "ago" suffix when appropriate
 * @param dateString ISO date string
 */
export function formatDistanceToNowCDT(dateString: string): string {
  // For relative times, we use the actual UTC times for accurate calculation
  // The timezone doesn't affect relative time calculations
  const targetDate = new Date(dateString);
  return formatDistanceToNow(targetDate, { addSuffix: true });
}