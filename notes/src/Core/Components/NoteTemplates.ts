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
        content: [{ type: "text", text: "Meeting Summary", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "meeting-2",
        type: "paragraph",
        content: [{ type: "text", text: "Date: ", styles: { italic: true } }]
      },
      {
        id: "meeting-3",
        type: "paragraph",
        content: [{ type: "text", text: "Duration: ", styles: { italic: true } }]
      },
      {
        id: "meeting-4",
        type: "heading",
        content: [{ type: "text", text: "Attendees", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "meeting-5",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-6",
        type: "heading",
        content: [{ type: "text", text: "Key Discussion Points", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "meeting-7",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-8",
        type: "heading",
        content: [{ type: "text", text: "Decisions Made", styles: { bold: true, backgroundColor: "yellow" } }],
        props: { level: 2 }
      },
      {
        id: "meeting-9",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "meeting-10",
        type: "heading",
        content: [{ type: "text", text: "Action Items", styles: { bold: true, textColor: "red" } }],
        props: { level: 2 }
      },
      {
        id: "meeting-11",
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
        content: [{ type: "text", text: "Daily Journal", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "daily-2",
        type: "paragraph",
        content: [{ type: "text", text: "Date: ", styles: { italic: true } }]
      },
      {
        id: "daily-3",
        type: "heading",
        content: [{ type: "text", text: "Today's Goals", styles: { bold: true } }],
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
        content: [{ type: "text", text: "Notes & Thoughts", styles: { bold: true } }],
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
        content: [{ type: "text", text: "Tomorrow's Plan", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "daily-8",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  },
  project: {
    title: "Project Plan",
    description: "Structured template for project planning",
    icon: "📊",
    content: [
      {
        id: "project-1",
        type: "heading",
        content: [{ type: "text", text: "Project Overview", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "project-2",
        type: "heading",
        content: [{ type: "text", text: "Project Details", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "project-3",
        type: "paragraph",
        content: [
          { type: "text", text: "Project Name: ", styles: { bold: true } },
          { type: "text", text: "", styles: {} }
        ]
      },
      {
        id: "project-4",
        type: "paragraph",
        content: [
          { type: "text", text: "Start Date: ", styles: { bold: true } },
          { type: "text", text: "", styles: {} }
        ]
      },
      {
        id: "project-5",
        type: "paragraph",
        content: [
          { type: "text", text: "End Date: ", styles: { bold: true } },
          { type: "text", text: "", styles: {} }
        ]
      },
      {
        id: "project-6",
        type: "heading",
        content: [{ type: "text", text: "Objectives", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "project-7",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "project-8",
        type: "heading",
        content: [{ type: "text", text: "Timeline & Milestones", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "project-9",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  class: {
    title: "Class Notes",
    description: "Template for taking notes during class",
    icon: "📚",
    content: [
      {
        id: "class-1",
        type: "heading",
        content: [{ type: "text", text: "Class Notes", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "class-2",
        type: "paragraph",
        content: [
          { type: "text", text: "Course: ", styles: { bold: true } },
          { type: "text", text: "", styles: {} }
        ]
      },
      {
        id: "class-3",
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "text", text: "", styles: {} }
        ]
      },
      {
        id: "class-4",
        type: "heading",
        content: [{ type: "text", text: "Topics Covered", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "class-5",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "class-6",
        type: "heading",
        content: [{ type: "text", text: "Key Points", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "class-7",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "class-8",
        type: "heading",
        content: [{ type: "text", text: "Questions", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "class-9",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  },
  todo: {
    title: "Todo List",
    description: "Simple checklist for tasks and todos",
    icon: "✅",
    content: [
      {
        id: "todo-1",
        type: "heading",
        content: [{ type: "text", text: "Todo List", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "todo-2",
        type: "heading",
        content: [{ type: "text", text: "High Priority", styles: { bold: true, textColor: "red" } }],
        props: { level: 2 }
      },
      {
        id: "todo-3",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-4",
        type: "heading",
        content: [{ type: "text", text: "Medium Priority", styles: { bold: true, textColor: "orange" } }],
        props: { level: 2 }
      },
      {
        id: "todo-5",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      },
      {
        id: "todo-6",
        type: "heading",
        content: [{ type: "text", text: "Low Priority", styles: { bold: true, textColor: "green" } }],
        props: { level: 2 }
      },
      {
        id: "todo-7",
        type: "checkListItem",
        content: [{ type: "text", text: "", styles: {} }],
        props: { checked: false }
      }
    ]
  },
  codeSnippet: {
    title: "Code Documentation",
    description: "Template for code documentation with syntax highlighting",
    icon: "💻",
    content: [
      {
        id: "code-1",
        type: "heading",
        content: [{ type: "text", text: "Code Documentation", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "code-2",
        type: "paragraph",
        content: [{ type: "text", text: "Description:", styles: { bold: true } }]
      },
      {
        id: "code-3",
        type: "paragraph",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "code-4",
        type: "heading",
        content: [{ type: "text", text: "Implementation", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "code-5",
        type: "codeBlock",
        content: [{ type: "text", text: "// Add your code here", styles: {} }],
        props: { language: "typescript" }
      },
      {
        id: "code-6",
        type: "heading",
        content: [{ type: "text", text: "Usage Example", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "code-7",
        type: "codeBlock",
        content: [{ type: "text", text: "// Usage example", styles: {} }],
        props: { language: "typescript" }
      }
    ]
  },
  research: {
    title: "Research Notes",
    description: "Template for research and study notes",
    icon: "🔍",
    content: [
      {
        id: "research-1",
        type: "heading",
        content: [{ type: "text", text: "Research Topic", styles: { bold: true } }],
        props: { level: 1 }
      },
      {
        id: "research-2",
        type: "heading",
        content: [{ type: "text", text: "Key Concepts", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "research-3",
        type: "bulletListItem",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "research-4",
        type: "heading",
        content: [{ type: "text", text: "Summary", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "research-5",
        type: "paragraph",
        content: [{ type: "text", text: "", styles: {} }]
      },
      {
        id: "research-6",
        type: "heading",
        content: [{ type: "text", text: "References", styles: { bold: true } }],
        props: { level: 2 }
      },
      {
        id: "research-7",
        type: "numberedListItem",
        content: [{ type: "text", text: "", styles: {} }]
      }
    ]
  }
}; 