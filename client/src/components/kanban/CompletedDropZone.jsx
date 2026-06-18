import { useDroppable } from '@dnd-kit/core'
import { CircleCheckBig } from 'lucide-react'

export const DROPZONE_ID = 'completed-dropzone'

// Drop target beside the dashboard. Dropping a card here completes it (sets its
// Finished date), moving it to Done Projects.
export default function CompletedDropZone({ receiving }) {
  const { setNodeRef, isOver } = useDroppable({ id: DROPZONE_ID })
  return (
    <div
      ref={setNodeRef}
      className={
        'completed-dropzone' +
        (isOver ? ' is-over' : '') +
        (receiving ? ' is-receiving' : '')
      }
    >
      <CircleCheckBig size={22} />
      <span>Drop here to complete</span>
    </div>
  )
}
