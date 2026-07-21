import { forwardRef } from 'react'

type Props = {
  title: string
  onTitleChange: (title: string) => void
  onInput: () => void
}

export const DocumentEditor = forwardRef<HTMLDivElement, Props>(function DocumentEditor({ title, onTitleChange, onInput }, ref) {
  return <article className="document-canvas">
    <input className="title-input" value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Untitled" />
    <div ref={ref} className="rich-editor" contentEditable suppressContentEditableWarning onInput={onInput} />
  </article>
})