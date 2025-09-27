export const NOTE_PRIORITIES = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  } as const;
  
  export type NotePriority = (typeof NOTE_PRIORITIES)[keyof typeof NOTE_PRIORITIES];
  