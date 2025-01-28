import { Note } from '../Database/db';

export function getPreviewText(content: string, maxLength = 300): string {
  try {
    const blocks = JSON.parse(content);
    const text = blocks
      .map((block: any) => {
        // BlockNote structure has content array with text property
        if (block.content) {
          const blockText = block.content
            .map((item: any) => {
              if (typeof item === 'string') return item;
              return item.text || '';
            })
            .join('');

          // Add formatting based on block type
          switch (block.type) {
            case 'heading':
              return `# ${blockText}\n`;
            case 'bulletListItem':
              return `• ${blockText}\n`;
            case 'numberedListItem':
              return `1. ${blockText}\n`;
            case 'paragraph':
            default:
              return `${blockText}\n`;
          }
        }
        return '';
      })
      .filter(Boolean)
      .join('')
      .trim();

    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  } catch (error) {
    return '';
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

export function formatLastEdited(note: Note): string {
  const date = note.lastEditedBy?.timestamp || note.updatedAt;
  const timeAgo = formatTimeAgo(date);
  
  if (note.lastEditedBy) {
    const editor = note.lastEditedBy.displayName || note.lastEditedBy.email.split('@')[0];
    return `Edited by ${editor} • ${timeAgo}`;
  }
  
  // If no lastEditedBy, show last updated
  return `Updated ${timeAgo}`;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
} 