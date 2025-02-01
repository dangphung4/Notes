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
    description: "Quick capture for meetings",
    icon: "👥",
    content: [
      {
        id: "meeting-date",
        type: "paragraph",
        content: [{ type: "text", text: "📅 ", styles: {} }, { type: "text", text: "", styles: { italic: true } }]
      },
      {
        id: "meeting-attendees",
        type: "paragraph",
        content: [{ type: "text", text: "👥 Attendees: ", styles: { bold: true } }]
      },
      {
        id: "meeting-agenda",
        type: "paragraph",
        content: [{ type: "text", text: "📋 Agenda", styles: { bold: true } }]
      },
      {
        id: "meeting-agenda-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-notes",
        type: "paragraph",
        content: [{ type: "text", text: "📝 Notes", styles: { bold: true } }]
      },
      {
        id: "meeting-notes-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-actions",
        type: "paragraph",
        content: [{ type: "text", text: "✅ Action Items", styles: { bold: true } }]
      },
      {
        id: "meeting-actions-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  daily: {
    title: "Daily Log",
    description: "Track your day",
    icon: "📅",
    content: [
      {
        id: "daily-date",
        type: "paragraph",
        content: [{ type: "text", text: "📅 ", styles: {} }, { type: "text", text: "", styles: { italic: true } }]
      },
      {
        id: "daily-focus",
        type: "paragraph",
        content: [{ type: "text", text: "🎯 Today's Focus", styles: { bold: true } }]
      },
      {
        id: "daily-tasks",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "daily-notes",
        type: "paragraph",
        content: [{ type: "text", text: "📝 Notes & Thoughts", styles: { bold: true } }]
      },
      {
        id: "daily-notes-content",
        type: "paragraph",
        content: []
      }
    ]
  },
  project: {
    title: "Project Plan",
    description: "Simple project planning",
    icon: "📊",
    content: [
      {
        id: "project-overview",
        type: "paragraph",
        content: [{ type: "text", text: "🎯 Project: ", styles: { bold: true } }]
      },
      {
        id: "project-dates",
        type: "paragraph",
        content: [{ type: "text", text: "📅 Timeline: ", styles: { bold: true } }]
      },
      {
        id: "project-goals",
        type: "paragraph",
        content: [{ type: "text", text: "🎯 Goals", styles: { bold: true } }]
      },
      {
        id: "project-goals-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "project-tasks",
        type: "paragraph",
        content: [{ type: "text", text: "✅ Tasks", styles: { bold: true } }]
      },
      {
        id: "project-tasks-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  todo: {
    title: "Todo List",
    description: "Simple task tracking",
    icon: "✅",
    content: [
      {
        id: "todo-now",
        type: "paragraph",
        content: [{ type: "text", text: "🔥 Now", styles: { bold: true } }]
      },
      {
        id: "todo-now-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-next",
        type: "paragraph",
        content: [{ type: "text", text: "⏱️ Next", styles: { bold: true } }]
      },
      {
        id: "todo-next-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-later",
        type: "paragraph",
        content: [{ type: "text", text: "📋 Later", styles: { bold: true } }]
      },
      {
        id: "todo-later-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  code: {
    title: "Code Snippet",
    description: "Document code with syntax highlighting",
    icon: "💻",
    content: [
      {
        id: "code-description",
        type: "paragraph",
        content: [{ type: "text", text: "📝 Description", styles: { bold: true } }]
      },
      {
        id: "code-description-content",
        type: "paragraph",
        content: []
      },
      {
        id: "code-snippet",
        type: "codeBlock",
        content: [{ type: "text", text: "// Add code here", styles: {} }],
        props: { language: "typescript" }
      },
      {
        id: "code-notes",
        type: "paragraph",
        content: [{ type: "text", text: "📌 Notes", styles: { bold: true } }]
      },
      {
        id: "code-notes-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  },
  research: {
    title: "Research Note",
    description: "Capture research and findings",
    icon: "🔍",
    content: [
      {
        id: "research-topic",
        type: "paragraph",
        content: [{ type: "text", text: "🔍 Topic: ", styles: { bold: true } }]
      },
      {
        id: "research-summary",
        type: "paragraph",
        content: [{ type: "text", text: "📝 Key Points", styles: { bold: true } }]
      },
      {
        id: "research-points",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "research-sources",
        type: "paragraph",
        content: [{ type: "text", text: "📚 Sources", styles: { bold: true } }]
      },
      {
        id: "research-sources-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  }
}; 