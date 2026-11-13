import type { RequestStatus } from "@/lib/generated/prisma/client";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "New",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  NEW: "bg-st-new-bg text-st-new-fg",
  QUOTED: "bg-st-progress-bg text-st-progress-fg",
  ACCEPTED: "bg-st-done-bg text-st-done-fg",
  DECLINED: "bg-st-off-bg text-st-off-fg",
};

export const REQUEST_STATUSES: RequestStatus[] = ["NEW", "QUOTED", "ACCEPTED", "DECLINED"];

export function requestAge(date: Date): string {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}
