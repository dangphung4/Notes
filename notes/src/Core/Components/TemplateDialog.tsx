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
import { Card } from "@/components/ui/card";

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
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold">Choose Template</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a template to start with or create a blank note.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] border-t px-4 pb-4">
          <div className="grid gap-2 pt-2">
            {Object.entries(noteTemplates).map(([key, template]) => (
              <Card
                key={key}
                className="group cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-lg">{template.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium leading-none mb-1">
                      {template.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 