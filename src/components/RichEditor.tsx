"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || "Write your email…" }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[160px] px-3 py-2 focus:outline-none text-[15px] leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="overflow-hidden rounded-lg border border-(--border) bg-white" aria-busy="true">
        <div className="flex flex-wrap gap-1 border-b border-(--border) bg-(--surface) px-2 py-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-12 rounded" />
          ))}
        </div>
        <div className="min-h-[160px] space-y-2 px-3 py-3">
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-white">
      <div className="flex flex-wrap gap-1 border-b border-(--border) bg-(--surface) px-2 py-1.5">
        {(
          [
            ["Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
            ["Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic")],
            ["Underline", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline")],
            ["List", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList")],
            ["Numbered", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList")],
          ] as const
        ).map(([label, action, active]) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`rounded px-2 py-1 text-xs font-medium ${
              active ? "bg-(--ink) text-white" : "bg-white text-(--ink) border border-(--border)"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded border border-(--border) bg-white px-2 py-1 text-xs font-medium"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (!url) return;
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
