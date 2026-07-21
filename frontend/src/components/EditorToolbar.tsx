import { Bold, Italic, Link, List, Redo2, Underline, Undo2 } from 'lucide-react'

export function EditorToolbar({ onCommand }: { onCommand: (command: string, value?: string) => void }) {
  return <div className="toolbar" aria-label="Formatting toolbar">
    <button title="Undo" onClick={() => onCommand('undo')}><Undo2 size={16} /></button>
    <button title="Redo" onClick={() => onCommand('redo')}><Redo2 size={16} /></button>
    <button title="Bold" onClick={() => onCommand('bold')}><Bold size={16} /></button>
    <button title="Italic" onClick={() => onCommand('italic')}><Italic size={16} /></button>
    <button title="Underline" onClick={() => onCommand('underline')}><Underline size={16} /></button>
    <button title="Heading" onClick={() => onCommand('formatBlock', 'h2')}>H2</button>
    <button title="Paragraph" onClick={() => onCommand('formatBlock', 'p')}>P</button>
    <button title="Checklist" onClick={() => onCommand('insertHTML', '<label><input type="checkbox"> Task</label><br>')}>Check</button>
    <button title="Bullet list" onClick={() => onCommand('insertUnorderedList')}><List size={16} /></button>
    <button title="Link" onClick={() => onCommand('createLink', prompt('URL') ?? '')}><Link size={16} /></button>
  </div>
}