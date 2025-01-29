import "@blocknote/core/fonts/inter.css";
// TODO: eventually move to shadcn instead of mantime,  @blocknote/shadcn
// TODO: although this means we will have to edit styles again of editor component
import { BlockNoteView } from "@blocknote/mantine";
// this will use shadcn styles ex: @blocknote/shadcn/style.css
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteEditor } from "@blocknote/core";
import { useEffect, useState, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";

import "@fontsource/monaspace-neon/400.css";
import "@fontsource/monaspace-neon/500.css";
import "@fontsource/monaspace-neon/700.css";

interface EditorProps {
  content: string;  // Change to expect string since that's how it's stored
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any[]) => void;
  onSave?: () => void;
  editorRef?: React.MutableRefObject<BlockNoteEditor | null>;
}

export default function Editor({ content, onChange, onSave, editorRef }: EditorProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );



  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: useMemo(() => 
      content ? JSON.parse(content) : [{
        type: 'paragraph',
        content: []
      }]
    , [content]),
  });
  // Set editor reference if provided
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

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
    // Set initial theme
    setIsDarkMode(document.documentElement.classList.contains('dark'));

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
  }, []); // Empty dependency array since we only want to set this up once

  // Force theme update when component mounts
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background overflow-hidden">
      <BlockNoteView 
        editor={editor} 
        theme={isDarkMode ? "dark" : "light"}
        onChange={() => debouncedSave(editor)}
        className="flex-1 h-full bg-background overflow-y-auto mobile-editor relative
          [&_.ProseMirror]:text-xl
          [&_.ProseMirror]:sm:text-2xl
          [&_p]:text-xl
          [&_p]:sm:text-2xl
          [&_p]:leading-relaxed
          [&_h1]:text-5xl
          [&_h2]:text-4xl
          [&_h3]:text-3xl
          [&_li]:text-xl
          [&_li]:sm:text-2xl
          [&_code]:text-xl
          [&_code]:sm:text-2xl
          [&_.ProseMirror]:px-4
          [&_.ProseMirror]:sm:px-8
          [&_.ProseMirror]:py-4
          [&_*]:!leading-relaxed
          [&_*]:font-['Monaspace_Neon']"
      />
    </div>
  );
} 