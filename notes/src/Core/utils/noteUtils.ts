/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Note } from '../Database/db';

/**
 *
 * @param content
 * @param maxLength
 */
export function getPreviewText(content: string, maxLength: number = 200): string {
  try {
    const blocks = JSON.parse(content);
    let preview = '';

    blocks.forEach((block: any) => {
      if (block.type === 'heading') {
        preview += `# ${block.content.map((c: any) => c.text).join('')}\n`;
      } else if (block.type === 'bulletListItem') {
        preview += `• ${block.content.map((c: any) => c.text).join('')}\n`;
      } else if (block.type === 'numberedListItem') {
        preview += `1. ${block.content.map((c: any) => c.text).join('')}\n`;
      } else if (block.type === 'checkListItem') {
        preview += `☐ ${block.content.map((c: any) => c.text).join('')}\n`;
      } else if (block.type === 'paragraph') {
        preview += `${block.content.map((c: any) => {
          let text = c.text;
          if (c.styles) {
            if (c.styles.bold) text = `**${text}**`;
            if (c.styles.italic) text = `_${text}_`;
            if (c.styles.underline) text = `__${text}__`;
            if (c.styles.strikethrough) text = `~~${text}~~`;
          }
          return text;
        }).join('')}\n`;
      }
    });

    return preview.length > maxLength 
      ? preview.slice(0, maxLength) + '...'
      : preview;
  } catch (e) {
    return '';
  }
}

/**
 * Formats a date into a localized string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

/**
 * Formats the last edited information for a note
 * @param {Note} note - The note object
 * @returns {string} Formatted string showing who last edited the note and when
 * @see {@link formatTimeAgo} for time formatting
 */
export function formatLastEdited(note: Note): string {
  const date = note.lastEditedAt || note.updatedAt;
  const timeAgo = formatTimeAgo(date);
  
  if (note.lastEditedByUserId) {
    const editor = note.lastEditedByDisplayName || note?.lastEditedByEmail?.split('@')[0];
    return `Edited by ${editor} • ${timeAgo}`;
  }
  
  // If no lastEditedBy, show last updated
  return `Updated ${timeAgo}`;
}

/**
 *
 * @param date
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
} 