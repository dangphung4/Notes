import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteEditor } from "@blocknote/core";
import { useEffect, useState, useCallback } from "react";
import debounce from "lodash/debounce";

interface EditorProps {
  content: string;  // Change to expect string since that's how it's stored
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any[]) => void;
  onSave?: () => void;
}

export default function Editor({ content, onChange, onSave }: EditorProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Parse the content string to object for BlockNote
  const editor = useCreateBlockNote({
    initialContent: content ? JSON.parse(content) : [{
      type: 'paragraph',
      content: []
    }],
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((editor: BlockNoteEditor) => {
      try {
        const blocks = editor.document;
        onChange(blocks);
        onSave?.();
      } catch (error) {
        console.error('Error saving editor content:', error);
      }
    }, 500),
    [onChange, onSave]
  );

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background overflow-hidden">
      <BlockNoteView 
        editor={editor} 
        theme={isDarkMode ? "dark" : "light"}
        onChange={() => debouncedSave(editor)}
        className="flex-1 h-full bg-background overflow-y-auto mobile-editor relative"
      />
    </div>
  );
} 