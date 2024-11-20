import React, { useEffect, useState } from 'react'

interface SidePanelProps {
  selectionText: string
}

const SidePanel: React.FC<SidePanelProps> = ({ selectionText }) => {
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetch(
      `http://127.0.0.1:8000/comment?request=${encodeURIComponent(
        selectionText
      )}`,
      {
        method: 'POST',
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setComment(data.response)
      })
  }, [selectionText])

  return (
    <div>
      <h1>Comment Builder</h1>
      <textarea value={comment} readOnly></textarea>
    </div>
  )
}

export default SidePanel
