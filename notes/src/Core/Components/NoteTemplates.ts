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
        content: [{ type: "text", text: "📅 ", styles: {} }, { type: "text", text: new Date().toLocaleDateString(), styles: { italic: true } }]
      },
      {
        id: "meeting-time",
        type: "paragraph",
        content: [{ type: "text", text: "⏰ ", styles: {} }, { type: "text", text: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), styles: { italic: true } }]
      },
      {
        id: "meeting-attendees-header",
        type: "heading",
        content: [{ type: "text", text: "Attendees", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-attendees",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-agenda-header",
        type: "heading",
        content: [{ type: "text", text: "Agenda", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-agenda-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-notes-header",
        type: "heading",
        content: [{ type: "text", text: "Discussion", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-notes-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-actions-header",
        type: "heading",
        content: [{ type: "text", text: "Action Items", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "meeting-actions-items",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
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
        content: [{ type: "text", text: "📅 ", styles: {} }, { type: "text", text: new Date().toLocaleDateString(), styles: { italic: true } }]
      },
      {
        id: "daily-focus-header",
        type: "heading",
        content: [{ type: "text", text: "Focus Areas", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-focus-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "daily-tasks-header",
        type: "heading",
        content: [{ type: "text", text: "Tasks", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-tasks",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
        props: { checked: false }
      },
      {
        id: "daily-notes-header",
        type: "heading",
        content: [{ type: "text", text: "Notes", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "daily-notes-content",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  },
  project: {
    title: "Project Plan",
    description: "Simple project planning",
    icon: "📊",
    content: [
      {
        id: "project-overview-header",
        type: "heading",
        content: [{ type: "text", text: "Overview", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "project-name",
        type: "paragraph",
        content: [{ type: "text", text: "Project: ", styles: { bold: true } }]
      },
      {
        id: "project-timeline",
        type: "paragraph",
        content: [{ type: "text", text: "Timeline: ", styles: { bold: true } }]
      },
      {
        id: "project-goals-header",
        type: "heading",
        content: [{ type: "text", text: "Goals", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "project-goals-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "project-tasks-header",
        type: "heading",
        content: [{ type: "text", text: "Tasks & Milestones", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "project-tasks-items",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
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
        id: "todo-now-header",
        type: "heading",
        content: [{ type: "text", text: "Now", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "todo-now-items",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-next-header",
        type: "heading",
        content: [{ type: "text", text: "Next", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "todo-next-items",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-later-header",
        type: "heading",
        content: [{ type: "text", text: "Later", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "todo-later-items",
        type: "checkListItem",
        content: [{ type: "text", text: "[ ] ", styles: {} }],
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
        id: "code-overview-header",
        type: "heading",
        content: [{ type: "text", text: "Overview", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "code-description",
        type: "paragraph",
        content: []
      },
      {
        id: "code-implementation-header",
        type: "heading",
        content: [{ type: "text", text: "Implementation", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "code-snippet",
        type: "codeBlock",
        content: [{ type: "text", text: "// Add code here", styles: {} }],
        props: { language: "typescript" }
      },
      {
        id: "code-notes-header",
        type: "heading",
        content: [{ type: "text", text: "Notes", styles: {} }],
        props: { level: 2 }
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
        id: "research-overview-header",
        type: "heading",
        content: [{ type: "text", text: "Overview", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "research-topic",
        type: "paragraph",
        content: [{ type: "text", text: "Topic: ", styles: { bold: true } }]
      },
      {
        id: "research-findings-header",
        type: "heading",
        content: [{ type: "text", text: "Key Findings", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "research-points",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "research-sources-header",
        type: "heading",
        content: [{ type: "text", text: "Sources", styles: {} }],
        props: { level: 2 }
      },
      {
        id: "research-sources-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  }
}; 