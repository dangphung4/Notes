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
        id: "meeting-title",
        type: "heading",
        content: [{ type: "text", text: "📅 Meeting Notes", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
      },
      {
        id: "meeting-meta",
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "text", text: new Date().toLocaleDateString(), styles: { italic: true } },
          { type: "text", text: " • Time: ", styles: { bold: true } },
          { type: "text", text: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), styles: { italic: true } }
        ]
      },
      {
        id: "meeting-attendees-header",
        type: "heading",
        content: [{ type: "text", text: "👥 Attendees", styles: { bold: true, textColor: "purple" } }],
        props: { level: 2 }
      },
      {
        id: "meeting-attendees",
        type: "bulletListItem",
        content: [{ type: "text", text: "@", styles: { textColor: "blue" } }]
      },
      {
        id: "meeting-agenda-header",
        type: "heading",
        content: [{ type: "text", text: "📋 Agenda", styles: { bold: true, textColor: "green" } }],
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
        content: [{ type: "text", text: "💡 Discussion Points", styles: { bold: true, textColor: "blue" } }],
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
        content: [{ type: "text", text: "✅ Action Items", styles: { bold: true, textColor: "red" } }],
        props: { level: 2 }
      },
      {
        id: "meeting-actions-items",
        type: "checkListItem",
        content: [{ type: "text", text: "@", styles: { textColor: "blue" } }],
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
        id: "daily-title",
        type: "heading",
        content: [{ type: "text", text: "📅 Daily Log", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
      },
      {
        id: "daily-date",
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "text", text: new Date().toLocaleDateString(), styles: { italic: true } }
        ]
      },
      {
        id: "daily-priorities-header",
        type: "heading",
        content: [{ type: "text", text: "🎯 Top Priorities", styles: { bold: true, textColor: "red" } }],
        props: { level: 2 }
      },
      {
        id: "daily-priorities",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: { textColor: "red" } }]
      },
      {
        id: "daily-tasks-header",
        type: "heading",
        content: [{ type: "text", text: "📋 Tasks", styles: { bold: true, textColor: "green" } }],
        props: { level: 2 }
      },
      {
        id: "daily-tasks",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "daily-notes-header",
        type: "heading",
        content: [{ type: "text", text: "📝 Notes", styles: { bold: true, textColor: "blue" } }],
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
        id: "project-title",
        type: "heading",
        content: [{ type: "text", text: "🚀 Project Plan", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
      },
      {
        id: "project-meta",
        type: "paragraph",
        content: [
          { type: "text", text: "Status: ", styles: { bold: true } },
          { type: "text", text: "Planning", styles: { italic: true, textColor: "orange" } }
        ]
      },
      {
        id: "project-goals-header",
        type: "heading",
        content: [{ type: "text", text: "🎯 Goals", styles: { bold: true, textColor: "purple" } }],
        props: { level: 2 }
      },
      {
        id: "project-goals-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: { textColor: "purple" } }]
      },
      {
        id: "project-timeline-header",
        type: "heading",
        content: [{ type: "text", text: "📅 Timeline", styles: { bold: true, textColor: "green" } }],
        props: { level: 2 }
      },
      {
        id: "project-timeline-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "project-tasks-header",
        type: "heading",
        content: [{ type: "text", text: "✅ Tasks", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
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
    description: "Priority-based task tracking",
    icon: "✅",
    content: [
      {
        id: "todo-high",
        type: "heading",
        content: [{ type: "text", text: "🔴 High Priority", styles: { bold: true, textColor: "red" } }],
        props: { level: 2 }
      },
      {
        id: "todo-high-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: { textColor: "red" } }],
        props: { checked: false }
      },
      {
        id: "todo-medium",
        type: "heading",
        content: [{ type: "text", text: "🟠 Medium Priority", styles: { bold: true, textColor: "orange" } }],
        props: { level: 2 }
      },
      {
        id: "todo-medium-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: { textColor: "orange" } }],
        props: { checked: false }
      },
      {
        id: "todo-low",
        type: "heading",
        content: [{ type: "text", text: "🟢 Low Priority", styles: { bold: true, textColor: "green" } }],
        props: { level: 2 }
      },
      {
        id: "todo-low-items",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: { textColor: "green" } }],
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
        id: "code-title",
        type: "heading",
        content: [{ type: "text", text: "💻 Code Documentation", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
      },
      {
        id: "code-description-header",
        type: "heading",
        content: [{ type: "text", text: "📝 Description", styles: { bold: true, textColor: "purple" } }],
        props: { level: 2 }
      },
      {
        id: "code-description",
        type: "paragraph",
        content: []
      },
      {
        id: "code-snippet-header",
        type: "heading",
        content: [{ type: "text", text: "🔍 Code", styles: { bold: true, textColor: "green" } }],
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
        content: [{ type: "text", text: "📌 Notes", styles: { bold: true, textColor: "red" } }],
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
        id: "research-title",
        type: "heading",
        content: [{ type: "text", text: "🔍 Research", styles: { bold: true, textColor: "blue" } }],
        props: { level: 2 }
      },
      {
        id: "research-topic-header",
        type: "heading",
        content: [{ type: "text", text: "📚 Topic", styles: { bold: true, textColor: "purple" } }],
        props: { level: 2 }
      },
      {
        id: "research-topic",
        type: "paragraph",
        content: [{ type: "text", text: "", styles: { textColor: "purple" } }]
      },
      {
        id: "research-findings-header",
        type: "heading",
        content: [{ type: "text", text: "💡 Key Findings", styles: { bold: true, textColor: "green" } }],
        props: { level: 2 }
      },
      {
        id: "research-findings",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: { textColor: "green" } }]
      },
      {
        id: "research-sources-header",
        type: "heading",
        content: [{ type: "text", text: "🔗 Sources", styles: { bold: true, textColor: "orange" } }],
        props: { level: 2 }
      },
      {
        id: "research-sources-items",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: { textColor: "blue" } }]
      }
    ]
  }
}; 