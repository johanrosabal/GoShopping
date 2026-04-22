'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, Link as LinkIcon, Type } from 'lucide-react';
import StatusModal from '../common/StatusModal';
import styles from './RichText.module.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  // Sync internal content with external value only when necessary
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setShowLinkModal(true);
    } else {
      setModal({
        isOpen: true,
        title: 'Selección Necesaria',
        message: 'Por favor, selecciona primero el texto que deseas convertir en enlace.'
      });
    }
  };

  const confirmLink = () => {
    if (linkUrl && linkUrl !== 'https://') {
      execCommand('createLink', linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('https://');
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => execCommand('bold')} title="Negrita">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} title="Cursiva">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Lista">
          <List size={16} />
        </button>
        <button type="button" onClick={openLinkModal} title="Enlace">
          <LinkIcon size={16} />
        </button>
        <button type="button" onClick={() => execCommand('formatBlock', '<h2>')} title="Título">
          <Type size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        className={styles.editable}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
      />

      {showLinkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.linkModal}>
            <h4>Insertar Enlace</h4>
            <input 
              type="text" 
              value={linkUrl} 
              onChange={e => setLinkUrl(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && confirmLink()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowLinkModal(false)}>Cancelar</button>
              <button type="button" onClick={confirmLink} className={styles.confirmBtn}>Insertar</button>
            </div>
          </div>
        </div>
      )}

      <StatusModal 
        isOpen={modal.isOpen}
        type="warning"
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
