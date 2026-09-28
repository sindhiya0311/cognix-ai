import React, { useState, useRef, useEffect } from 'react';

export function CustomSpaceSelect({ spaces, activeSpace, onSelect, onCreate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="customSelectWrapper" ref={ref}>
      <button
        className={`customSelectTrigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Switch Learning Space"
      >
        <span className="spaceIconBadge">✦</span>
        <div className="triggerText">
          <small>LEARNING SPACE</small>
          <span>{activeSpace?.name || 'Select Space'}</span>
        </div>
        <span className="chevronArrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="customSelectDropdown">
          <div className="dropdownHeader">
            <span>YOUR LEARNING SPACES</span>
            <small>{spaces.length} total</small>
          </div>

          <div className="dropdownList">
            {spaces.map((s) => {
              const isSelected = s.id === activeSpace?.id;
              const masteryPct = Math.round((s.learner?.mastery || 0) * 100);
              const worldCount = s.worlds?.length || 0;

              return (
                <button
                  key={s.id}
                  className={`dropdownItem ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(s.id);
                    setOpen(false);
                  }}
                >
                  <span className="itemIcon">✦</span>
                  <div className="itemInfo">
                    <b>{s.name}</b>
                    <small>
                      {worldCount > 0 ? `${worldCount} worlds • ${masteryPct}% mastery` : 'No syllabus rendered yet'}
                    </small>
                  </div>
                  {isSelected && <span className="checkMark">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="dropdownFooter">
            <button
              className="createSpaceDropdownBtn"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              ＋ Create Learning Space
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
