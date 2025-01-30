import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { noteTemplates, NoteTemplate } from "./NoteTemplates";
import { useState } from "react";
import { ReactNode } from "react";

interface TemplateDialogProps {
  onSelectTemplate: (template: NoteTemplate) => void;
  children: ReactNode;
}

/**
 *
 * @param root0
 * @param root0.onSelectTemplate
 * @param root0.children
 */
export default function TemplateDialog({ onSelectTemplate, children }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);

  const handleTemplateSelect = (template: NoteTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Template</DialogTitle>
          <DialogDescription>
            Select a template to start with or create a blank note.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="grid gap-4">
            {Object.entries(noteTemplates).map(([key, template]) => (
              <Button
                key={key}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="text-left">
                    <h3 className="font-semibold">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 