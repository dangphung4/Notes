export type CalendarEvent = {
  id?: string;
  firebaseId?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  reminderMinutes: number; // minutes before event to send reminder
  noteId?: string; // optional associated note
  ownerUserId: string;
  ownerEmail: string;
  color?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
}; 