import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import FlowStepItem from './FlowStepItem'

export default function FlowList({ fields, remove, move }) {
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.key === active.id)
      const newIndex = fields.findIndex(f => f.key === over.id)
      move(oldIndex, newIndex)
    }
  }

  if (fields.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
      暂无步骤，点击"添加步骤"开始配置
    </div>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
        {fields.map((field, index) => (
          <FlowStepItem
            key={field.key}
            field={field}
            index={index}
            onRemove={() => remove(field.name)}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
