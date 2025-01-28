import { PartialBlock } from "@blocknote/core";

export type NoteTemplate = {
  title: string;
  description: string;
  icon: string;
  content: PartialBlock[];
};

export const noteTemplates: Record<string, NoteTemplate> = {
  blank: {
    title: "Blank Note",
    description: "Start with a clean slate",
    icon: "📝",
    content: [{
      id: "blank",
      type: "paragraph",
      content: []
    }]
  },
  meeting: {
    title: "Meeting Notes",
    description: "Template for meeting minutes and action items",
    icon: "👥",
    content: [
      {
        id: "meeting-1",
        type: "heading",
        content: [{ type: "text", text: "Meeting Summary", styles: {} }],
        props: { level: 1 }
      },
      {
        id: "meeting-2",
        type: "paragraph",
        content: [{ type: "text", text: "Date: ", styles: {} }]
      },
      {
        id: "meeting-3",
        type: "heading",
        content: [{ type: "text", text: "Attendees", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-4",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-5",
        type: "heading",
        content: [{ type: "text", text: "Agenda", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-6",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-7",
        type: "heading",
        content: [{ type: "text", text: "Action Items", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-8",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  daily: {
    title: "Daily Journal",
    description: "Template for daily reflections and tasks",
    icon: "📅",
    content: [
      {
        id: "daily-1",
        type: "heading",
        content: [{ type: "text", text: "Daily Journal", styles: {} }],
        props: { level: 1 }
      },
      {
        id: "daily-2",
        type: "paragraph",
        content: [{ type: "text", text: "Date: ", styles: {} }]
      },
      {
        id: "daily-3",
        type: "heading",
        content: [{ type: "text", text: "Today's Goals", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-4",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "daily-5",
        type: "heading",
        content: [{ type: "text", text: "Notes & Thoughts", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-6",
        type: "paragraph",
        content: []
      },
      {
        id: "daily-7",
        type: "heading",
        content: [{ type: "text", text: "Tomorrow's Plan", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-8",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  },
  checklist: {
    title: "Checklist",
    description: "Simple checklist for tasks and todos",
    icon: "✅",
    content: [
      {
        id: "checklist-1",
        type: "heading",
        content: [{ type: "text", text: "Checklist", styles: {} }],
        props: { level: 1 }
      },
      {
        id: "checklist-2",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  }
}; 