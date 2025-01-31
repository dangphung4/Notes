import "@blocknote/core/fonts/inter.css";
// TODO: eventually move to shadcn instead of mantime,  @blocknote/shadcn
// TODO: although this means we will have to edit styles again of editor component
// import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteView } from "@blocknote/shadcn";

// this will use shadcn styles ex: @blocknote/shadcn/style.css
// import "@blocknote/mantine/style.css";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteEditor } from "@blocknote/core";
import { useEffect, useState, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import { useAuth } from '../Auth/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { cn } from '@/lib/utils';
import { useTheme } from "../Theme/ThemeProvider";
import { themes, ThemeName } from "../Theme/themes";

import "@fontsource/monaspace-neon/400.css";
import "@fontsource/monaspace-neon/500.css";
import "@fontsource/monaspace-neon/700.css";

import "@fontsource/fira-code/500.css";
import "@fontsource/fira-code/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/700.css";
import "@fontsource/dancing-script/400.css";
import "@fontsource/dancing-script/500.css";
import "@fontsource/dancing-script/700.css";
import "@fontsource/anonymous-pro/400.css";
import "@fontsource/anonymous-pro/700.css";
import "@fontsource/ubuntu-mono/400.css";
import "@fontsource/ubuntu-mono/700.css";
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/700.css";
import "@fontsource/handlee/400.css";
import "@fontsource/patrick-hand/400.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource/indie-flower/400.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "@fontsource/overpass-mono/400.css";
import "@fontsource/overpass-mono/700.css";

// Import shadcn components
import * as Button from "@/components/ui/button";
import * as Select from "@/components/ui/select";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import * as Popover from "@/components/ui/popover";
import * as Toggle from "@/components/ui/toggle";
import * as Form from "@/components/ui/form";
import * as Input from "@/components/ui/input";
import * as Label from "@/components/ui/label";
import * as Card from "@/components/ui/card";
import * as Tabs from "@/components/ui/tabs";
import * as Badge from "@/components/ui/badge";

import "@/styles/editor.css";

interface EditorProps {
  content: string; // Change to expect string since that's how it's stored
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any[]) => void;
  onSave?: () => void;
  editorRef?: React.MutableRefObject<BlockNoteEditor | null>;
}

/**
 *
 * @param root0
 * @param root0.content
 * @param root0.onChange
 * @param root0.onSave
 * @param root0.editorRef
 */

// First, let's define a proper type for the BlockNote theme
type BlockNoteTheme = {
  colors: {
    editor: {
      text: string;
      background: string;
    };
    menu: {
      text: string;
      background: string;
    };
    tooltip: {
      text: string;
      background: string;
    };
    hovered: {
      text: string;
      background: string;
    };
    selected: {
      text: string;
      background: string;
    };
    disabled: {
      text: string;
      background: string;
    };
    shadow: string;
    border: string;
  };
  borderRadius: number;
  fontFamily: string;
};

// Then update the createBlockNoteTheme function
const createBlockNoteTheme = (mode: 'light' | 'dark', currentTheme: string): "light" | "dark" | BlockNoteTheme => {
  // First try using the basic theme
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }

  // If that doesn't work, create a custom theme
  return {
    colors: {
      editor: {
        text: `hsl(${themes[currentTheme][mode].foreground})`,
        background: `hsl(${themes[currentTheme][mode].background})`,
      },
      menu: {
        text: `hsl(${themes[currentTheme][mode].popoverForeground})`,
        background: `hsl(${themes[currentTheme][mode].popover})`,
      },
      tooltip: {
        text: `hsl(${themes[currentTheme][mode].popoverForeground})`,
        background: `hsl(${themes[currentTheme][mode].popover})`,
      },
      hovered: {
        text: `hsl(${themes[currentTheme][mode].accent})`,
        background: `hsl(${themes[currentTheme][mode].accent}/10)`,
      },
      selected: {
        text: `hsl(${themes[currentTheme][mode].primary})`,
        background: `hsl(${themes[currentTheme][mode].primary}/10)`,
      },
      disabled: {
        text: `hsl(${themes[currentTheme][mode].mutedForeground})`,
        background: `hsl(${themes[currentTheme][mode].muted})`,
      },
      shadow: `hsl(${themes[currentTheme][mode].border})`,
      border: `hsl(${themes[currentTheme][mode].border})`,
    },
    borderRadius: 4,
    fontFamily: 'var(--editor-font)',
  };
};

export default function Editor({
  content,
  onChange,
  onSave,
  editorRef,
}: EditorProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const getEffectiveTheme = useCallback(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  }, [theme]);

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: useMemo(
      () =>
        content
          ? JSON.parse(content)
          : [{ type: "paragraph", content: [] }],
      [content]
    ),
  });

  // Set editor reference if provided
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Load user's font preference and sync with localStorage
  useEffect(() => {
    const loadFontPreference = async () => {
      if (!user) {
        // If no user, use localStorage preference
        const savedFont = localStorage.getItem('editor-font');
        if (savedFont) {
          document.documentElement.style.setProperty('--editor-font', savedFont);
        }
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        const preferences = userDoc.data()?.preferences;
        if (preferences?.editorFont) {
          document.documentElement.style.setProperty('--editor-font', preferences.editorFont);
          localStorage.setItem('editor-font', preferences.editorFont);
        }
      } catch (error) {
        console.error('Error loading font preference:', error);
        // Fallback to localStorage if Firestore fails
        const savedFont = localStorage.getItem('editor-font');
        if (savedFont) {
          document.documentElement.style.setProperty('--editor-font', savedFont);
        }
      }
    };

    loadFontPreference();
  }, [user]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((editor: BlockNoteEditor) => {
      try {
        const blocks = editor.document;
        onChange(blocks);
        onSave?.();
      } catch (error) {
        console.error("Error saving editor content:", error);
      }
    }, 500),
    [onChange, onSave]
  );

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background overflow-hidden">
      <BlockNoteView
        editor={editor}
        theme={getEffectiveTheme()}
        onChange={() => debouncedSave(editor)}
        shadCNComponents={{
          Button,
          Select,
          DropdownMenu,
          Popover,
          Toggle,
          Form,
          Input,
          Label,
          Card,
          Tabs,
          Badge
        }}
        className={cn(
          "flex-1 h-full overflow-y-auto mobile-editor relative",
          // Base styles
          "bg-background text-foreground",
          // Editor specific styles
          "[&_.bn-container]:h-full [&_.bn-container]:bg-background",
          "[&_.ProseMirror]:min-h-[calc(100vh-8rem)] [&_.ProseMirror]:p-4",
          "[&_.ProseMirror]:text-xl [&_.ProseMirror]:sm:text-2xl",
          "[&_.ProseMirror]:font-[var(--editor-font)]",
          // Content styling
          "[&_.ProseMirror_a]:text-primary hover:[&_.ProseMirror_a]:text-primary/80",
          "[&_.ProseMirror_blockquote]:border-l-primary [&_.ProseMirror_blockquote]:bg-muted/50",
          "[&_.ProseMirror_pre]:bg-muted",
          "[&_.ProseMirror_hr]:border-border",
          // Toolbar styling
          "[&_.bn-toolbar]:bg-background [&_.bn-toolbar]:border-border",
          "[&_.bn-toolbar-button]:text-muted-foreground",
          "[&_.bn-toolbar-button:hover]:bg-accent hover:[&_.bn-toolbar-button]:text-accent-foreground",
          "[&_.bn-toolbar-button.active]:bg-primary [&_.bn-toolbar-button.active]:text-primary-foreground",
          // Menu styling
          "[&_.bn-menu]:bg-popover [&_.bn-menu]:border-border [&_.bn-menu]:text-popover-foreground",
          "[&_.bn-menu-item]:text-sm [&_.bn-menu-item]:leading-none",
          "[&_.bn-menu-item:hover]:bg-accent [&_.bn-menu-item:hover]:text-accent-foreground",
          // Button styling
          "[&_.bn-button]:bg-background [&_.bn-button]:text-foreground",
          "[&_.bn-button]:border-input hover:[&_.bn-button]:bg-accent",
          "[&_.bn-button]:rounded-md [&_.bn-button]:px-3 [&_.bn-button]:py-2",
          // Dark mode overrides
          "dark:[&_.ProseMirror]:bg-background dark:[&_.ProseMirror]:text-foreground",
          "dark:[&_.bn-toolbar]:bg-background/95 dark:[&_.bn-toolbar]:backdrop-blur",
          "dark:[&_.bn-menu]:bg-popover dark:[&_.bn-menu]:text-popover-foreground",
          "dark:[&_.bn-button]:bg-background dark:[&_.bn-button]:text-foreground",
          // Prose styles
          "prose dark:prose-invert prose-headings:font-[var(--editor-font)]",
          "prose-p:my-2 prose-headings:my-4"
        )}
      />
    </div>
  );
}
