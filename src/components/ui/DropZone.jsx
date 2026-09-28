import React, { useState } from 'react';

export function DropZone({ onFileSelected, file, accept = '.txt,.pdf,.md', label = 'Upload syllabus PDF / TXT' }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileSelected({ target: { files: [droppedFile] } });
    }
  };

  return (
    <div
      className={`dropZoneCard ${dragOver ? 'dragActive' : ''} ${file ? 'hasFile' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className="dropZoneLabel">
        <input
          type="file"
          accept={accept}
          onChange={onFileSelected}
          className="hiddenFileInput"
        />

        <div className="dropZoneIconWrapper">
          <span className="uploadArrowIcon">↑</span>
        </div>

        <div className="dropZoneText">
          <b>{file ? file.name : label}</b>
          <p className="muted">
            {file
              ? `File selected (${(file.size / 1024).toFixed(1)} KB) • Ready for syllabus analysis`
              : 'Drag & drop your syllabus PDF, TXT, or MD here, or click to browse'}
          </p>
        </div>

        <div className="dropZoneBadges">
          <span className="fileBadge">PDF</span>
          <span className="fileBadge">TXT</span>
          <span className="fileBadge">MD</span>
        </div>

        <button type="button" className="ghostBtn browseBtn">
          {file ? 'Change File' : 'Browse Files'}
        </button>
      </label>
    </div>
  );
}
