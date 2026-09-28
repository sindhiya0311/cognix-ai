import React from 'react';

export function ResourceCard({ resource, onDelete }) {
  const isPDF = resource?.type?.includes('pdf') || resource?.name?.toLowerCase().endsWith('.pdf') || (resource?.text && resource.text.startsWith('%PDF-'));
  const isCode = resource?.type?.includes('code') || resource?.name?.toLowerCase().endsWith('.js') || resource?.name?.toLowerCase().endsWith('.py');
  const isFile = resource?.type === 'file' || isPDF || isCode;

  // Protect against displaying raw PDF metadata (%PDF-1.4, producer, etc.)
  const cleanPreview = () => {
    if (!resource?.text) return 'No preview text provided.';
    if (isPDF || resource.text.startsWith('%PDF-') || resource.text.includes('endobj') || resource.text.includes('/Type /Catalog')) {
      return 'PDF Document • Uploaded and processed for AI syllabus analysis and RAG context.';
    }
    return resource.text.length > 180 ? `${resource.text.slice(0, 180)}...` : resource.text;
  };

  const getIcon = () => {
    if (isPDF) return '📄';
    if (isCode) return '💻';
    if (isFile) return '📁';
    return '📝';
  };

  const getTypeLabel = () => {
    if (isPDF) return 'PDF DOCUMENT';
    if (isCode) return 'SOURCE CODE';
    if (isFile) return 'FILE RESOURCE';
    return 'TEXT NOTE';
  };

  return (
    <article className="saasResourceCard glass">
      <div className="cardHeaderRow">
        <div className="resourceIconBox">{getIcon()}</div>
        <div className="cardTitleMeta">
          <div className="badgeRow">
            <span className={`typeBadge ${isPDF ? 'pdf' : isFile ? 'file' : 'note'}`}>
              {getTypeLabel()}
            </span>
          </div>
          <h3 className="resourceTitle">{resource.name || 'Untitled Resource'}</h3>
        </div>

        {onDelete && (
          <button
            className="deleteResourceBtn"
            onClick={() => onDelete(resource.id || resource._id)}
            title="Remove Resource"
          >
            ×
          </button>
        )}
      </div>

      <div className="cardBodyText">
        <p>{cleanPreview()}</p>
      </div>

      <div className="cardFooterRow">
        <span className="timestampText">
          {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Active Resource'}
        </span>
        <button className="textLink viewResourceBtn">
          View Details →
        </button>
      </div>
    </article>
  );
}
