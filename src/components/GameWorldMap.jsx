import React, { useState } from 'react';

export function GameWorldMap({ space, onWorld, onSetup }) {
  const worlds = space.worlds || [];
  const [hoveredWorld, setHoveredWorld] = useState(null);

  if (!worlds.length) {
    return (
      <section className="panelPage">
        <div className="empty glass">
          <h2>No worlds generated yet</h2>
          <p>Render your syllabus to generate dynamic learning worlds for {space.name}.</p>
          <button className="primary" onClick={onSetup}>⚙ Setup Syllabus</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panelPage gameWorldSection">
      <div className="mapHeader">
        <div>
          <div className="eyebrow">GAME WORLD MAP • {space.name}</div>
          <h1>{space.name} Adventure Path</h1>
          <p className="muted">Master concepts to advance along the winding learning path.</p>
        </div>
        <div className="headerActions">
          <div className="spaceStatsBadge">
            <span>✨ Level {space.level}</span>
            <span>⚡ {space.xp} XP</span>
            <span>🔥 {space.streak} Streak</span>
          </div>
          <button className="ghostBtn" onClick={onSetup}>⚙ Syllabus</button>
        </div>
      </div>

      <div className="gameMapContainer">
        <div className="windingPathSvg">
          <svg viewBox="0 0 800 1200" preserveAspectRatio="none">
            <path
              d={generatePathD(worlds.length)}
              fill="none"
              stroke="rgba(99, 102, 241, 0.3)"
              strokeWidth="12"
              strokeDasharray="16 10"
            />
            <path
              d={generatePathD(worlds.length)}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="6"
            />
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="nodesGrid">
          {worlds.map((w, index) => {
            const isFirst = index === 0;
            const prevWorld = index > 0 ? worlds[index - 1] : null;
            const unlocked = isFirst || (prevWorld && (prevWorld.mastery || 0) >= 0.7);
            const isMastered = (w.mastery || 0) >= 0.72;
            const isCurrent = unlocked && !isMastered && (!prevWorld || (prevWorld.mastery || 0) >= 0.7);

            const nodeClass = isMastered
              ? 'nodeMastered'
              : isCurrent
              ? 'nodeCurrent'
              : unlocked
              ? 'nodeAvailable'
              : 'nodeLocked';

            const pos = getNodePosition(index, worlds.length);

            return (
              <div
                key={w.id || w._id || index}
                className={`mapNodeWrapper ${nodeClass}`}
                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                onMouseEnter={() => setHoveredWorld(w)}
                onMouseLeave={() => setHoveredWorld(null)}
              >
                {isCurrent && <div className="avatarBadge">✦ CURRENT QUEST</div>}

                <button
                  className="mapNodeButton"
                  disabled={!unlocked}
                  onClick={() => onWorld(w)}
                >
                  <div className="nodeInner">
                    {isMastered ? (
                      <span className="icon">⭐</span>
                    ) : !unlocked ? (
                      <span className="icon">🔒</span>
                    ) : (
                      <span className="nodeNumber">{index + 1}</span>
                    )}
                  </div>
                </button>

                <div className="nodeLabelCard">
                  <small>{w.unitName || `Unit ${Math.floor(index / 3) + 1}`}</small>
                  <h3>{w.name}</h3>
                  <div className="miniProgressBar">
                    <i style={{ width: `${Math.round((w.mastery || 0) * 100)}%` }} />
                  </div>
                  <span className="masteryText">{Math.round((w.mastery || 0) * 100)}% Mastery</span>
                </div>
              </div>
            );
          })}

          {/* Final Boss Gateway Node */}
          <div
            className="mapNodeWrapper nodeBoss"
            style={{ top: `${getNodePosition(worlds.length, worlds.length).y}%`, left: `${getNodePosition(worlds.length, worlds.length).x}%` }}
          >
            <div className="bossBadge">⚔ FINAL BOSS</div>
            <button className="mapNodeButton bossButton" disabled={!worlds.every(w => (w.mastery || 0) >= 0.7)}>
              <div className="nodeInner">👑</div>
            </button>
            <div className="nodeLabelCard">
              <small>CITADEL</small>
              <h3>Guardian Encounter</h3>
              <span className="masteryText">Unlock at 70%+ All Worlds</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getNodePosition(index, total) {
  const row = index;
  const y = Math.min(90, 8 + row * (80 / Math.max(1, total)));
  // Alternate left and right winding curve
  const x = 50 + Math.sin(index * 1.2) * 32;
  return { x, y };
}

function generatePathD(total) {
  let d = '';
  for (let i = 0; i <= total; i++) {
    const pos = getNodePosition(i, total);
    const px = (pos.x / 100) * 800;
    const py = (pos.y / 100) * 1200;
    if (i === 0) d += `M ${px} ${py}`;
    else {
      const prev = getNodePosition(i - 1, total);
      const prevPx = (prev.x / 100) * 800;
      const prevPy = (prev.y / 100) * 1200;
      const cy1 = prevPy + (py - prevPy) / 2;
      const cy2 = prevPy + (py - prevPy) / 2;
      d += ` C ${prevPx} ${cy1}, ${px} ${cy2}, ${px} ${py}`;
    }
  }
  return d;
}
