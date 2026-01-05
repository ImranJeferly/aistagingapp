'use client';

import React, { useRef } from 'react';

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = textarea.value;
    const selectedText = previousValue.substring(start, end);

    const newValue = 
      previousValue.substring(0, start) +
      before + selectedText + after +
      previousValue.substring(end);

    onChange(newValue);
    
    // Restore focus and selection
    setTimeout(() => {
        textarea.focus();
        // If text was selected, keep it selected (wrapped). If point, put cursor inside.
        if (start !== end) {
             textarea.setSelectionRange(start, end + before.length + after.length);
        } else {
             textarea.setSelectionRange(start + before.length, start + before.length);
        }
    }, 0);
  };

  return (
    <div className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b-2 border-black p-2 flex gap-2 flex-wrap items-center">
        <span className="text-xs font-bold text-gray-500 mr-1 uppercase tracking-wider">Format:</span>
        <button 
            type="button"
            onClick={() => insertText('## ')}
            className="px-3 py-1 bg-white border-2 border-black font-bold text-sm hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            title="Heading 2"
        >
            H2
        </button>
        <button 
            type="button"
            onClick={() => insertText('### ')}
            className="px-3 py-1 bg-white border-2 border-black font-bold text-sm hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            title="Heading 3"
        >
            H3
        </button>
         <button 
            type="button"
            onClick={() => insertText('#### ')}
            className="px-3 py-1 bg-white border-2 border-black font-bold text-sm hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            title="Heading 4"
        >
            H4
        </button>
        
        <div className="w-px h-6 bg-gray-400 mx-2"></div>
        
        <button 
            type="button"
            onClick={() => insertText('**', '**')}
            className="px-3 py-1 bg-white border-2 border-black font-bold text-sm hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all font-serif italic"
            title="Bold"
        >
            B
        </button>
        
        <button 
            type="button"
            onClick={() => insertText('<span class="brand-highlight">', '</span>')}
            className="px-3 py-1 bg-[#FDE047] border-2 border-black font-bold text-sm hover:brightness-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            title="Highlight Text (Container)"
        >
            Highlighter
        </button>
        
        <div className="w-px h-6 bg-gray-400 mx-2"></div>

        <button 
            type="button"
            onClick={() => insertText('\n<CTA />\n')}
            className="px-3 py-1 bg-[#A3E635] border-2 border-black font-bold text-sm hover:brightness-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all float-right ml-auto"
            title="Insert Call to Action"
        >
            + CTA
        </button>
      </div>

      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 px-4 py-3 focus:outline-none font-mono resize-y text-base"
        placeholder="Write your blog content here..."
      />
      
      {/* Footer Info */}
      <div className="bg-gray-50 border-t-2 border-black p-2 px-4 flex justify-between items-center text-xs text-gray-500 font-bold">
        <span>Markdown Supported</span>
        <span>{value.length} chars</span>
      </div>
    </div>
  );
}
