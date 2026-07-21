import { CheckCircle2, History, MessageSquarePlus, PanelRight } from 'lucide-react'
import type { CommentThread, VersionRecord } from '../types'

type Props = {
  sidePanel: 'comments' | 'versions'
  shareUrl: string
  commentDraft: string
  versionLabel: string
  comments: CommentThread[]
  versions: VersionRecord[]
  onPanelChange: (panel: 'comments' | 'versions') => void
  onCommentDraftChange: (value: string) => void
  onVersionLabelChange: (value: string) => void
  onAddComment: () => void
  onToggleComment: (comment: CommentThread) => void
  onSaveVersion: () => void
  onRestoreVersion: (versionId: string) => void
}

export function Inspector(props: Props) {
  return <aside className="inspector">
    <div className="panel-tabs">
      <button className={props.sidePanel === 'comments' ? 'active' : ''} onClick={() => props.onPanelChange('comments')}><MessageSquarePlus size={16} />Comments</button>
      <button className={props.sidePanel === 'versions' ? 'active' : ''} onClick={() => props.onPanelChange('versions')}><History size={16} />Versions</button>
    </div>
    {props.shareUrl && <p className="share-result">{props.shareUrl}</p>}
    {props.sidePanel === 'comments'
      ? <section className="panel-body">
          <textarea value={props.commentDraft} onChange={(event) => props.onCommentDraftChange(event.target.value)} placeholder="Comment or @mention by user id" />
          <button className="primary" onClick={props.onAddComment}><MessageSquarePlus size={16} />Add comment</button>
          {props.comments.map((comment) => <div className="thread" key={comment._id}><p>{comment.body}</p>{comment.quotedText && <blockquote>{comment.quotedText}</blockquote>}<small>{comment.status}</small><button onClick={() => props.onToggleComment(comment)}><CheckCircle2 size={15} />Toggle</button></div>)}
        </section>
      : <section className="panel-body">
          <input value={props.versionLabel} onChange={(event) => props.onVersionLabelChange(event.target.value)} />
          <button className="primary" onClick={props.onSaveVersion}><History size={16} />Save version</button>
          {props.versions.map((version) => <div className="thread" key={version._id}><p>{version.label}</p><small>{new Date(version.createdAt).toLocaleString()} update {version.updateCount}</small><button onClick={() => props.onRestoreVersion(version._id)}><PanelRight size={15} />Restore</button></div>)}
        </section>}
  </aside>
}