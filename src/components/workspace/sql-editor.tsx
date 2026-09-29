'use client'

import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const theme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: '#101010', color: '#d4d4d4', fontSize: '12px' },
    '.cm-scroller': {
      fontFamily: 'IBM Plex Mono, monospace',
      lineHeight: '1.85',
      overflow: 'auto',
    },
    '.cm-content': { padding: '18px 0', caretColor: '#ffffff' },
    '.cm-line': { padding: '0 18px' },
    '.cm-gutters': {
      backgroundColor: '#101010',
      color: '#555555',
      borderRight: '1px solid #222222',
      paddingRight: '8px',
    },
    '.cm-activeLineGutter': { backgroundColor: '#191919', color: '#bbbbbb' },
    '.cm-activeLine': { backgroundColor: '#ffffff03' },
    '&.cm-focused': { outline: 'none' },
    '.cm-cursor': { borderLeftColor: '#ffffff' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: '#ffffff20',
    },
    '.cm-tooltip': { backgroundColor: '#202020', border: '1px solid #444444' },
  },
  { dark: true },
)
const highlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.operatorKeyword], color: '#ffffff', fontWeight: '600' },
    { tag: [tags.string, tags.special(tags.string)], color: '#999999' },
    { tag: [tags.number, tags.bool, tags.null], color: '#e5e5e5' },
    { tag: tags.comment, color: '#666666', fontStyle: 'italic' },
    { tag: [tags.function(tags.variableName), tags.typeName], color: '#bfbfbf' },
  ]),
)

export function SqlEditor({
  value,
  onChange,
  onRun,
}: {
  value: string
  onChange: (value: string) => void
  onRun: () => void
}) {
  const extensions = useMemo(
    () => [
      sql(),
      highlighting,
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            onRun()
            return true
          },
        },
      ]),
      EditorView.contentAttributes.of({ 'aria-label': 'SQL query' }),
    ],
    [onRun],
  )
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={theme}
      height="100%"
      className="h-full"
      basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: true }}
    />
  )
}
