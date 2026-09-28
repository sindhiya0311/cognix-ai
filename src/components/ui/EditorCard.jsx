import React, { useState } from 'react';

export function EditorCard({
  value,
  onChange,
  onSave,
  title,
  onTitleChange,
  placeholder = "Paste your notes, formulas, code snippets, or study material...",
  isSaving = false
}) {
  const charCount = value ? value.length : 0;
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="editorCard glass">
      <div className="editorHeader">
        <div className="editorHeaderLeft">
          <span className="editorIcon">📝</span>
          <input
            type="text"
            className="editorTitleInput"
            placeholder="Note Title (Optional)..."
            value={title || ''}
            onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
          />
        </div>
        <div className="editorStats">
          <span className="statBadge">{wordCount} words</span>
          <span className="statBadge">{charCount} chars</span>
        </div>
      </div>

      <div className="editorBody">
        <textarea
          className="saasTextArea"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
        />
      </div>

      <div className="editorFooter">
        <div className="editorFooterInfo">
          <span className="aiHint">✦ Automatically indexed into space context for Nova & Question generation</span>
        </div>
        <div className="editorActions">
          {value && (
            <button
              type="button"
              className="ghostBtn textBtn"
              onClick={() => onChange('')}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="primaryBtn saveNoteBtn"
            disabled={!value || isSaving}
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : '💾 Save & Index Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
