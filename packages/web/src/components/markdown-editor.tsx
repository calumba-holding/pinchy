"use client";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  return (
    <div className={`rounded-md border border-input bg-background ${className ?? ""}`}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlight(code, languages.markdown, "markdown")}
        padding={12}
        className="font-mono text-sm min-h-[15rem] [&_textarea]:outline-none"
        textareaClassName="focus:outline-none"
      />
    </div>
  );
}
