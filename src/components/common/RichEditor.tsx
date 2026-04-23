'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichEditor({ value, onChange, placeholder, minHeight = '150px' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.02)'
    }}>
      {/* Toolbar */}
      <div style={{ 
        padding: '8px', 
        background: 'rgba(255,255,255,0.03)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: '8px'
      }}>
        <button 
          type="button" 
          onClick={() => execCommand('bold')}
          style={{ padding: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'white', opacity: 0.7, borderRadius: '4px' }}
          className="editor-btn"
        >
          <Bold size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => execCommand('italic')}
          style={{ padding: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'white', opacity: 0.7, borderRadius: '4px' }}
          className="editor-btn"
        >
          <Italic size={16} />
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
        <button 
          type="button" 
          onClick={() => execCommand('insertUnorderedList')}
          style={{ padding: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'white', opacity: 0.7, borderRadius: '4px' }}
          className="editor-btn"
        >
          <List size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => execCommand('insertOrderedList')}
          style={{ padding: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'white', opacity: 0.7, borderRadius: '4px' }}
          className="editor-btn"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ 
          padding: '20px', 
          minHeight, 
          outline: 'none', 
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        .editor-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          opacity: 1 !important;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.2);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
