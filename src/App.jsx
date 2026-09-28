import React, { useEffect, useMemo, useState, useRef } from "react";
import { DEMO_SYLLABUS, makeWorlds, worldGames, GAME_LABELS, GAME_ICONS } from "./data/v2data.js";
import { loadSpaces, saveSpaces, setActiveUser, userIdFromToken, dropLegacyGlobalSpaces } from "./services/v2storage.js";
import { decideNextActivity as decideNext, applyGameResult, misconception, signalsForWorld as signalsFor } from "./shared/domain/adaptive.js";
import { apiSpaces, apiSyllabus, apiGame, apiResources, apiNova, apiAuth, setAuthToken, setUnauthorizedHandler } from "./services/api.js";
import { GameWorldMap } from "./components/GameWorldMap.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { CustomSpaceSelect } from "./components/ui/Select.jsx";
import { DropZone } from "./components/ui/DropZone.jsx";
import { ResourceCard } from "./components/ui/ResourceCard.jsx";
import { EditorCard } from "./components/ui/EditorCard.jsx";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const clone = o => JSON.parse(JSON.stringify(o));
const blankSpace = (name = "New Learning Space") => ({
  id: uid(),
  name,
  subject: name,
  createdAt: Date.now(),
  syllabus: null,
  units: [],
  worlds: [],
  notes: [],
  xp: 0,
  level: 1,
  streak: 0,
  games: 0,
  lastAction: null,
  learner: { mastery: 0, accuracy: 0, avgTime: 0, attempts: 0, errors: 0, hints: 0, preferredGame: "quiz", struggleRisk: "LOW", misconceptions: [] }
});

function seedSpace() {
  const s = blankSpace("Programming");
  s.syllabus = { name: "Programming Demo Syllabus", type: "demo" };
  s.units = clone(DEMO_SYLLABUS.units);
  s.worlds = makeWorlds(s.units, "Programming");
  return s;
}

// Phase 1 storage isolation: scope the local cache to whoever is signed in
// (namespace seeded from the stored token before first paint) and drop the
// legacy global cache, whose ownership cannot be proven.
setActiveUser(userIdFromToken(localStorage.getItem("cognix_token")));
dropLegacyGlobalSpaces();

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [spaces, setSpaces] = useState(() => loadSpaces() || [seedSpace()]);
  const [spaceId, setSpaceId] = useState(() => { const x = loadSpaces(); return x?.[0]?.id || null; });
  const [page, setPage] = useState("spaces");
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [toast, setToast] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [newName, setNewName] = useState("");
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaInput, setNovaInput] = useState("");
  const [novaReply, setNovaReply] = useState("I’m Nova. I travel with your learning state and help decide what happens next.");
  const [isNovaThinking, setIsNovaThinking] = useState(false);
  const [previewUnits, setPreviewUnits] = useState([]);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [boss, setBoss] = useState(null);

  // 401 from an active session → clear auth state and land on a safe
  // unauthenticated screen instead of rendering protected data.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setActiveUser(null);      // detach: the account's cache stays under its own key
      setSpaceId(null);
      setSpaces([seedSpace()]); // saved under the anonymous key from now on
      setPage("spaces");
      notify("Session expired. Please sign in again.");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Authentication check on startup
  useEffect(() => {
    apiAuth.getMe().then(res => {
      if (res?.success && res?.data) {
        setUser(res.data);
        setActiveUser(res.data._id); // authoritative cache namespace for this account
        fetchRemoteSpaces();
      }
      // A 401 here (missing/invalid token) is not an error: it is the normal
      // signed-out path, already handled by setUnauthorizedHandler above.
    }).catch(() => {
      // Offline/unexpected boot failure: there is no session to restore.
      // A 401 caused by an active-but-invalid token was already handled by
      // setUnauthorizedHandler (clears auth state, safe transition).
    }).finally(() => {
      setAuthChecked(true);
    });
  }, []);

  const fetchRemoteSpaces = async () => {
    try {
      const remoteSpaces = await apiSpaces.getSpaces();
      if (remoteSpaces && Array.isArray(remoteSpaces) && remoteSpaces.length) {
        const formatted = remoteSpaces.map(s => ({
          ...blankSpace(s.name),
          ...s,
          id: s._id || s.id,
          worlds: s.worlds && s.worlds.length ? s.worlds.map(w => ({ ...w, id: w._id || w.id || w.topicId })) : [],
          notes: s.notes || []
        }));
        setSpaces(formatted);
        if (!spaceId || !formatted.some(x => x.id === spaceId)) {
          setSpaceId(formatted[0].id);
        }
      }
    } catch (e) {
      if (e?.status === 403) notify("You are not authorized to load that learning space.");
      // 401 is handled globally by setUnauthorizedHandler; offline requests
      // return null above and keep the local cache.
    }
  };

  useEffect(() => saveSpaces(spaces), [spaces]);
  const space = spaces.find(s => s.id === spaceId) || spaces[0];
  useEffect(() => { if (space && !spaceId) setSpaceId(space.id); }, [space, spaceId]);
  const updateSpace = fn => setSpaces(all => all.map(s => s.id === space.id ? fn(clone(s)) : s));
  const notify = t => { setToast(t); setTimeout(() => setToast(""), 2400); };
  const openSpace = id => { setSpaceId(id); setPage("world"); setSelectedWorld(null); };

  const handleLogout = () => {
    setAuthToken(null);
    setActiveUser(null); // detach this account's cached state (stays under cognix_v2:<id>)
    setUser(null);
    setSpaceId(null);
    setSpaces([seedSpace()]); // anonymous safe state → saved under the anonymous key
    notify("Logged out");
  };

  const createSpace = async () => {
    const s = blankSpace(newName.trim() || "Untitled Learning Space");
    let remote = null;
    try {
      remote = await apiSpaces.createSpace(s.name, s.name);
    } catch (err) {
      if (err?.status && err.status !== 401) notify(err.message || "Could not create the space on the server");
    }
    const finalSpace = remote ? { ...s, ...remote, id: remote._id || s.id, worlds: remote.worlds || s.worlds } : s;
    setSpaces(a => [finalSpace, ...a]);
    setSpaceId(finalSpace.id);
    setNewName("");
    setShowCreate(false);
    setPage("setup");
    notify(`Created space ${finalSpace.name}`);
  };

  const deleteSpace = async id => {
    await apiSpaces.deleteSpace(id).catch(err => {
      if (err?.status && err.status !== 401) notify(err.message || "Could not delete the space on the server");
    });
    setSpaces(all => {
      const filtered = all.filter(s => s.id !== id);
      return filtered.length ? filtered : [seedSpace()];
    });
    if (spaceId === id) {
      const remaining = spaces.filter(s => s.id !== id);
      setSpaceId(remaining[0]?.id || null);
    }
    notify("Learning Space deleted");
  };

  const renderDemo = () => {
    const demoUnits = parseSyllabus("", space?.name || "Web Technologies");
    setPreviewUnits(demoUnits);
    setShowSyllabus(true);
  };

  const handleSyllabusFile = e => {
    const f = e.target.files?.[0]; if (!f) return; setSyllabusFile(f);
    if (f.type === "text/plain" || f.name.toLowerCase().endsWith(".txt") || f.name.toLowerCase().endsWith(".md")) {
      const r = new FileReader();
      r.onload = () => {
        const textContent = String(r.result);
        const parsed = parseSyllabus(textContent, space?.name || "Custom Course");
        setPreviewUnits(parsed);
      };
      r.readAsText(f);
    } else {
      const parsed = parseSyllabus(f.name, space?.name || "Custom Course");
      setPreviewUnits(parsed);
    }
  };

  const renderSyllabus = async () => {
    const units = previewUnits.length ? previewUnits : parseSyllabus("", space?.name || "Learning Space");
    let rawContent = "";
    if (syllabusFile) {
      try {
        rawContent = await syllabusFile.text();
      } catch (e) {}
    }

    const remoteRes = await apiSyllabus.renderSyllabus(space.id, syllabusFile?.name || `${space.name} Syllabus`, units, rawContent)
      .catch(err => {
        if (err?.status && err.status !== 401) notify(err.message || "Could not render the syllabus on the server");
        return null;
      });
    const finalWorlds = remoteRes?.worlds && remoteRes.worlds.length ? remoteRes.worlds.map(w => ({ ...w, id: w._id || w.id || w.topicId })) : makeWorlds(units, space.name);
    
    updateSpace(s => ({
      ...s,
      syllabus: { name: syllabusFile?.name || `${space.name} Syllabus`, type: syllabusFile ? "custom" : "rendered" },
      units,
      worlds: finalWorlds
    }));
    
    setShowSyllabus(false); setPage("world"); notify("Syllabus rendered into learning worlds");
  };

  const selectWorld = w => { setSelectedWorld(w.id || w._id); setPage("worldDetail"); };

  const playGame = (world, game = null) => {
    const targetId = world.id || world._id;
    const fresh = space.worlds.find(w => (w.id === targetId || w._id === targetId));
    const d = decideNext(space, fresh);
    setSelectedWorld(targetId);
    setActiveGame(game || d.game);
    setPage("game");
  };

  const finishGame = async result => {
    updateSpace(s => {
      const w = s.worlds.find(x => (x.id === selectedWorld || x._id === selectedWorld)); if (!w) return s;
      const before = w.mastery; result.id = uid(); result.timestamp = Date.now();
      applyGameResult(w, result);
      s.games++; if (result.hintUsed) s.learner.hints = (s.learner.hints || 0) + 1; s.gamesCompleted = (s.gamesCompleted || 0) + 1; s.xp += result.correct ? Math.round(20 * (result.difficulty || 1)) : 5; s.level = Math.floor(s.xp / 150) + 1;
      if (result.correct) s.streak++; else s.streak = 0;
      const allAttempts = s.worlds.flatMap(x => x.history || []);
      s.learner.attempts = allAttempts.length; s.learner.errors = allAttempts.filter(x => !x.correct).length;
      s.learner.accuracy = s.learner.attempts ? 1 - s.learner.errors / s.learner.attempts : 0;
      s.learner.mastery = s.worlds.length ? s.worlds.reduce((a, x) => a + x.mastery, 0) / s.worlds.length : 0;
      s.learner.avgTime = s.learner.attempts ? allAttempts.reduce((a, x) => a + (x.seconds || 0), 0) / s.learner.attempts : 0;
      s.learner.preferredGame = mostPlayed(allAttempts);
      const risk = w.history.filter(x => !x.correct).length >= 2 ? "HIGH" : w.history.some(x => !x.correct) ? "MEDIUM" : "LOW"; s.learner.struggleRisk = risk;
      const mis = misconception(w); if (mis && !s.learner.misconceptions.includes(mis)) s.learner.misconceptions.push(mis);
      s.lastAction = { world: w.name, game: result.game, correct: result.correct, fromMastery: before, toMastery: w.mastery, decision: decideNext(s, w) };
      return s;
    });

    const remoteData = await apiGame.submitAttempt(space.id, selectedWorld, result).catch(err => {
      if (err?.status === 403) notify("Attempt rejected: you are not authorized for this learning space.");
      else if (err?.status && err.status !== 401) notify(err.message || "Attempt could not be synced");
      return null;
    });
    if (remoteData?.space || remoteData?.world) {
      updateSpace(s => ({
        ...s,
        ...(remoteData.space || {}),
        worlds: s.worlds.map(w => (w.id === selectedWorld || w._id === selectedWorld) ? { ...w, ...(remoteData.world || {}) } : w),
        learner: remoteData.learnerDNA || s.learner
      }));
    }
    setPage("worldDetail"); notify(result.correct ? "Mastery state updated • next experience adapted" : "Recovery signal recorded • next game will change");
  };

  const completeBoss = won => {
    updateSpace(s => {
      const w = s.worlds.find(x => (x.id === selectedWorld || x._id === selectedWorld));
      if (w) { w.mastery = 1; w.bossComplete = true; }
      const i = s.worlds.findIndex(x => (x.id === selectedWorld || x._id === selectedWorld));
      if (i >= 0 && s.worlds[i + 1]) s.worlds[i + 1].unlocked = true;
      s.xp += 200; s.level = Math.floor(s.xp / 150) + 1;
      return s;
    });
    setBoss(null); setPage("world"); notify(won ? "Boss defeated • next world unlocked" : "Boss attempt recorded");
  };

  const askNova = async (queryOverride = null) => {
    const q = (typeof queryOverride === "string" ? queryOverride : novaInput).trim();
    if (!q) return;

    setNovaInput("");
    setIsNovaThinking(true);

    const w = space.worlds.find(x => (x.id === selectedWorld || x._id === selectedWorld));
    const d = w ? decideNext(space, w) : null;

    const activeContext = {
      learningSpace: { id: space.id, name: space.name, subject: space.subject || space.name },
      world: w ? { id: w.id || w._id, name: w.name, topicId: w.topicId || w.id, unitName: w.unitName } : null,
      game: activeGame ? { type: activeGame, difficulty: w?.difficulty || 1 } : null,
      currentTask: window.__currentTaskContext || null,
      learner: {
        mastery: space.learner?.mastery || 0,
        accuracy: space.learner?.accuracy || 0,
        struggleRisk: space.learner?.struggleRisk || "LOW",
        misconceptions: space.learner?.misconceptions || []
      }
    };

    try {
      const remoteReply = await apiNova.askContextual(activeContext, q);
      if (remoteReply) { setNovaReply(remoteReply); setIsNovaThinking(false); return; }
    } catch (e) {
      if (e?.status === 403) notify("Nova can't access that learning space.");
      // 401 is handled globally; other failures fall through to the local
      // keyword fallback below (offline resilience preserved).
    }

    const taskCtx = window.__currentTaskContext;
    if ((q.toLowerCase().includes("why") || q.toLowerCase().includes("wrong") || q.toLowerCase().includes("mistake")) && taskCtx?.learnerAnswer) {
      setNovaReply(`For "${taskCtx.prompt}", you selected "${taskCtx.learnerAnswer}". In ${w?.name || space.name}, "${taskCtx.expectedAnswer}" is correct because it directly satisfies the core requirement.`);
    } else if (q.toLowerCase().includes("hint")) {
      setNovaReply(taskCtx?.prompt ? `Hint for "${taskCtx.prompt}": Focus on the core objective of ${w?.name || space.name} rather than secondary options.` : `Open a world activity first and I'll give you a direct hint!`);
    } else if (q.toLowerCase().includes("doing") || q.toLowerCase().includes("progress")) {
      setNovaReply(`You're at ${Math.round(space.learner.mastery * 100)}% overall mastery in ${space.name} with ${space.games} games completed and Level ${space.level}.`);
    } else if (q.toLowerCase().includes("why this") || q.toLowerCase().includes("next")) {
      setNovaReply(`For ${w?.name || space.name}, the adaptive engine selected ${activeGame ? GAME_LABELS[activeGame] : 'this activity'} based on your struggle risk (${space.learner.struggleRisk}).`);
    } else {
      setNovaReply(`I'm tracking your learning state in ${w?.name || space.name}. Ask me about hints, mistakes, or progression anytime!`);
    }
    setIsNovaThinking(false);
  };

  const nav = p => { setPage(p); setBoss(null); };

  if (!authChecked) return null;

  if (!user) {
    return <AuthScreen onAuthenticated={(authedUser) => {
      setUser(authedUser);
      setActiveUser(authedUser._id);      // switch cache namespace to this account
      setSpaces(loadSpaces() || [seedSpace()]);
      fetchRemoteSpaces();
    }} />;
  }

  if (!space) return null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => setPage("spaces")}>
          <span className="brandMark">✦</span>
          <div><b>COGNIX</b><small>GAMELEARN AI</small></div>
        </div>
        <CustomSpaceSelect
          spaces={spaces}
          activeSpace={space}
          onSelect={openSpace}
          onCreate={() => setShowCreate(true)}
        />
        <nav>
          {[["world", "World"], ["notes", "Notes"], ["progress", "Progress"], ["analytics", "Analytics"]].map(([id, l]) => (
            <button className={page === id || (page === "worldDetail" && id === "world") ? "navOn" : ""} key={id} onClick={() => nav(id)}>
              {l}
            </button>
          ))}
        </nav>

        <div className="userBadgeNav">
          <div className="userAvatarBubble">
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="userInfoText">
            <span className="userName">{user.name || user.email}</span>
            <small className="userRole">LEARNER</small>
          </div>
          <button className="logoutBtn" onClick={handleLogout} title="Log Out">
            Exit ➔
          </button>
        </div>

        <button className="novaMini" onClick={() => setNovaOpen(x => !x)}>◉ Nova</button>
      </header>

      <main>
        {page === "spaces" && <Spaces spaces={spaces} onOpen={openSpace} onCreate={() => setShowCreate(true)} onDelete={deleteSpace} />}
        {page === "setup" && <Setup space={space} onRender={renderDemo} onFile={handleSyllabusFile} file={syllabusFile} onBack={() => setPage("spaces")} />}
        {page === "world" && <GameWorldMap space={space} onWorld={selectWorld} onSetup={() => setPage("setup")} />}
        {page === "worldDetail" && <WorldDetail space={space} worldId={selectedWorld} onPlay={g => playGame(space.worlds.find(w => (w.id === selectedWorld || w._id === selectedWorld)), g)} onBack={() => setPage("world")} onBoss={() => setBoss("start")} />}
        {page === "game" && <GameScreen space={space} worldId={selectedWorld} game={activeGame} onDone={finishGame} onBack={() => setPage("worldDetail")} />}
        {page === "notes" && <Notes space={space} update={updateSpace} text={noteText} setText={setNoteText} notify={notify} />}
        {page === "progress" && <Progress space={space} />}
        {page === "analytics" && <Analytics space={space} />}
      </main>

      <Nova open={novaOpen} setOpen={setNovaOpen} input={novaInput} setInput={setNovaInput} reply={novaReply} ask={askNova} isThinking={isNovaThinking} />
      
      {showCreate && (
        <Modal title="Create Learning Space" close={() => setShowCreate(false)}>
          <p className="muted">Each space keeps its own syllabus, worlds, history and Learner DNA.</p>
          <input autoFocus placeholder="e.g. Web Technologies / Machine Learning" value={newName} onChange={e => setNewName(e.target.value)} />
          <button className="primary" onClick={createSpace}>Create Space</button>
        </Modal>
      )}

      {showSyllabus && (
        <Modal title="Render Syllabus" close={() => setShowSyllabus(false)} wide>
          <div className="renderGrid">
            {previewUnits.map((u, i) => (
              <div className="unitCard" key={u.id || i}>
                <input value={u.name} onChange={e => setPreviewUnits(a => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                {u.topics.map((t, j) => (
                  <div className="topicEdit" key={t.id || j}>
                    <span>🌍</span>
                    <input value={t.name} onChange={e => setPreviewUnits(a => a.map((x, k) => k === i ? { ...x, topics: x.topics.map((z, l) => l === j ? { ...z, name: e.target.value } : z) } : x))} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button className="primary" onClick={renderSyllabus}>Create Worlds</button>
        </Modal>
      )}

      {boss && <BossModal space={space} worldId={selectedWorld} onClose={() => setBoss(null)} onFinish={completeBoss} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function parseSyllabus(text, name = 'Learning Space') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return generateFallbackSyllabusUnits(name);
  }

  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const units = [];
  let current = null;

  for (const line of lines) {
    const um = line.match(/^(unit|module|chapter|part|section|block)\s*([ivxlcdm\d]+)?\s*[:\-–]?\s*(.+)$/i);
    if (um) {
      const unitNum = um[2] ? um[2].toUpperCase() : String(units.length + 1);
      const unitTitle = um[3] ? um[3].trim() : line;
      current = { id: "u" + (units.length + 1), name: `Unit ${unitNum}: ${unitTitle}`, topics: [] };
      units.push(current);
      continue;
    }

    const topic = line.replace(/^(?:[-•*]|\d+[.)])\s+/, "").trim();
    if (topic.length > 2 && topic.length < 120 && !topic.toLowerCase().includes('course:')) {
      if (!current) {
        current = { id: "u1", name: `${name} Topics`, topics: [] };
        units.push(current);
      }
      current.topics.push({
        id: topic.toLowerCase().replace(/\W+/g, "-"),
        name: topic,
        objective: `Build core understanding and application of ${topic}.`,
        skills: [topic, 'Implementation', 'Problem Solving']
      });
    }
  }

  const validUnits = units.filter(u => u.topics.length > 0);
  if (validUnits.length > 0) return validUnits;

  return generateFallbackSyllabusUnits(name);
}

function generateFallbackSyllabusUnits(name) {
  const nameLower = name.toLowerCase();

  // Web Technologies / WT Fallback
  if (nameLower.includes('web') || nameLower.includes('wt') || nameLower.includes('24cs502')) {
    return [
      {
        id: 'u1',
        name: 'UNIT I: HTML 5, CSS 3, JAVASCRIPT',
        topics: [
          { id: 'html5-controls', name: 'HTML5 & Control Elements', objective: 'Master HTML5 semantic elements, forms, audio/video, and drag and drop.', skills: ['HTML5', 'Forms', 'Media Controls'] },
          { id: 'css3-styling', name: 'CSS3 & Rule Cascading', objective: 'Apply CSS3 inline, embedded, and external stylesheets with inheritance.', skills: ['CSS3', 'Cascading', 'Flexbox/Grid'] },
          { id: 'js-dom-events', name: 'JavaScript DOM & Events', objective: 'Manipulate DOM elements, handle events, and validate form inputs.', skills: ['JavaScript', 'DOM Manipulation', 'Event Handling'] }
        ]
      },
      {
        id: 'u2',
        name: 'UNIT II: SERVER SIDE PROGRAMMING',
        topics: [
          { id: 'servlet-architecture', name: 'Servlet Architecture & Lifecycle', objective: 'Understand Java Servlet architecture, init(), service(), and destroy() lifecycle.', skills: ['Java Servlets', 'Servlet Lifecycle', 'HTTP Handling'] },
          { id: 'session-management', name: 'Servlet Sessions & Cookies', objective: 'Implement session tracking using Cookies, URL rewriting, and HttpSession.', skills: ['Session Tracking', 'Cookies', 'URL Rewriting'] },
          { id: 'jdbc-integration', name: 'JDBC Database Connectivity', objective: 'Connect Java Servlets to SQL databases using DriverManager and PreparedStatement.', skills: ['JDBC', 'SQL Queries', 'Connection Pooling'] }
        ]
      },
      {
        id: 'u3',
        name: 'UNIT III: PHP',
        topics: [
          { id: 'php-fundamentals', name: 'PHP Fundamentals & Control', objective: 'Write server-side PHP scripts with variables, control structures, and functions.', skills: ['PHP Syntax', 'Control Flow', 'Built-in Functions'] },
          { id: 'php-validation-files', name: 'PHP Validation & File Handling', objective: 'Process web forms, validate inputs with regex, and manage file operations.', skills: ['Form Validation', 'Regex', 'File I/O'] },
          { id: 'php-database', name: 'PHP Database Integration', objective: 'Connect PHP applications to MySQL databases and manage user sessions.', skills: ['PHP MySQL', 'Session Management', 'Cookies'] }
        ]
      },
      {
        id: 'u4',
        name: 'UNIT IV: XML AND AJAX',
        topics: [
          { id: 'xml-schema', name: 'XML, DTD & XML Schema', objective: 'Create structured XML documents validated with DTD and XML Schema.', skills: ['XML Syntax', 'DTD Validation', 'XSD'] },
          { id: 'xslt-transformation', name: 'XSL & XSLT Transformation', objective: 'Transform XML documents into HTML using XSLT templates.', skills: ['XSLT', 'XPath', 'XML Parsing'] },
          { id: 'ajax-architecture', name: 'AJAX & XMLHttpRequest', objective: 'Build asynchronous web interfaces using XMLHttpRequest and callback methods.', skills: ['AJAX', 'XMLHttpRequest', 'Asynchronous Requests'] }
        ]
      },
      {
        id: 'u5',
        name: 'UNIT V: INTRODUCTION TO REACT',
        topics: [
          { id: 'react-jsx', name: 'ReactJS & JSX Fundamentals', objective: 'Understand React architecture, JSX syntax, and component rendering.', skills: ['ReactJS', 'JSX Syntax', 'Virtual DOM'] },
          { id: 'react-components-props', name: 'React Components & Props', objective: 'Build modular functional components and transfer properties across hierarchy.', skills: ['React Components', 'Props Transfer', 'State Management'] }
        ]
      }
    ];
  }

  // Machine Learning / AIML Fallback
  if (nameLower.includes('aiml') || nameLower.includes('machine learning') || nameLower.includes('ai')) {
    return [
      {
        id: "u1",
        name: "Supervised Learning",
        topics: [
          { id: "linear-regression", name: "Linear Regression", objective: "Model continuous relationships and predict scalar targets.", skills: ["Regression", "Loss Functions", "Gradient Descent"] },
          { id: "logistic-regression", name: "Logistic Regression", objective: "Classify binary outcomes using sigmoid decision boundaries.", skills: ["Classification", "Log Loss", "Decision Boundary"] },
          { id: "decision-trees", name: "Decision Trees", objective: "Construct decision rules using entropy and information gain.", skills: ["Entropy", "Information Gain", "Pruning"] }
        ]
      },
      {
        id: "u2",
        name: "Deep Learning & Neural Networks",
        topics: [
          { id: "neural-networks", name: "Neural Networks Architecture", objective: "Understand perceptrons, hidden layers, and activation functions.", skills: ["Perceptrons", "Activation Functions", "Forward Pass"] },
          { id: "backpropagation", name: "Backpropagation & Optimization", objective: "Compute gradients via chain rule to update network weights.", skills: ["Gradient Calculation", "Chain Rule", "Weight Updates"] }
        ]
      },
      {
        id: "u3",
        name: "Model Evaluation & Regularization",
        topics: [
          { id: "overfitting-regularization", name: "Overfitting & Regularization", objective: "Prevent overfitting using L1/L2 regularization and dropout.", skills: ["L1/L2 Penalty", "Dropout", "Generalization"] },
          { id: "model-evaluation", name: "Model Evaluation Metrics", objective: "Evaluate models using Precision, Recall, F1-Score, and ROC-AUC.", skills: ["Confusion Matrix", "F1-Score", "ROC-AUC"] }
        ]
      }
    ];
  }

  return [
    {
      id: "u1",
      name: `${name} Fundamentals`,
      topics: [
        { id: `${name.toLowerCase().replace(/\W+/g, '-')}-concepts`, name: `${name} Core Principles`, objective: `Understand core principles of ${name}.`, skills: ['Fundamentals', 'Principles'] },
        { id: `${name.toLowerCase().replace(/\W+/g, '-')}-methods`, name: `${name} Methods & Analysis`, objective: `Apply key analytical methods in ${name}.`, skills: ['Methods', 'Analysis'] }
      ]
    },
    {
      id: "u2",
      name: `Applied ${name}`,
      topics: [
        { id: `${name.toLowerCase().replace(/\W+/g, '-')}-applications`, name: `${name} Practical Applications`, objective: `Solve practical problems using ${name}.`, skills: ['Problem Solving', 'Application'] }
      ]
    }
  ];
}

function mostPlayed(h) { const c = {}; h.forEach(x => c[x.game] = (c[x.game] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || "quiz"; }

function Spaces({ spaces, onOpen, onCreate, onDelete }) {
  return (
    <section className="hero">
      <div className="eyebrow">COGNIX • ADAPTIVE LEARNING ADVENTURE</div>
      <h1>Every learner gets a<br /><span>different journey.</span></h1>
      <p className="lead">Create a Learning Space, turn a syllabus into worlds, then let learner behavior decide what happens next.</p>
      <div className="actionRow"><button className="primary" onClick={onCreate}>＋ New Learning Space</button></div>
      <div className="spaceGrid">
        {spaces.map(s => (
          <div className="spaceCard" key={s.id} onClick={() => onOpen(s.id)}>
            <div className="spaceIcon">✦</div>
            <div>
              <small>LEARNING SPACE</small>
              <h3>{s.name}</h3>
              <p>{s.worlds?.length ? `${s.worlds.length} worlds • ${Math.round((s.learner?.mastery || 0) * 100)}% mastery • Level ${s.level || 1}` : "No syllabus rendered yet"}</p>
            </div>
            <button className="deleteSpaceBtn" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} title="Delete Learning Space">🗑️ Delete</button>
          </div>
        ))}
      </div>
      <div className="loop"><b>PLAY</b><i>→</i><b>OBSERVE</b><i>→</i><b>ADAPT</b><i>→</i><b>EXPERIENCE</b><i>→</i><b>UPDATE</b></div>
    </section>
  );
}

function Setup({ space, onRender, onFile, file, onBack }) {
  return (
    <section className="panelPage">
      <button className="back" onClick={onBack}>← Learning Spaces</button>
      <div className="setupHero">
        <span className="iconBig">◎</span>
        <div>
          <div className="eyebrow">LEARNING SPACE</div>
          <h1>{space.name}</h1>
          <p>Bring the syllabus. Cognix turns topics into worlds.</p>
        </div>
      </div>
      <div className="twoCol">
        <div className="glass">
          <h2>01 · Syllabus Upload</h2>
          <p className="muted">Upload a TXT/PDF syllabus (e.g. WT.txt) to turn curriculum topics directly into game worlds.</p>
          <DropZone onFileSelected={onFile} file={file} label="Upload syllabus PDF / TXT" />
          <button className="primary full" style={{ marginTop: '16px' }} onClick={onRender}>Render Syllabus Worlds</button>
        </div>
        <div className="glass">
          <h2>02 · Subject Structure</h2>
          <p className="muted">Preview and customize syllabus units/topics before worlds are initialized.</p>
          <div className="miniFlow">
            <span>SYLLABUS</span><i>→</i><span>UNITS</span><i>→</i><span>TOPICS</span><i>→</i><span>WORLDS</span>
          </div>
          <button className="ghostBtn full" onClick={onRender}>Generate {space.name} Syllabus</button>
        </div>
      </div>
    </section>
  );
}

function WorldDetail({ space, worldId, onPlay, onBack, onBoss }) {
  const w = space.worlds.find(x => (x.id === worldId || x._id === worldId));
  if (!w) return <Empty title="World not found" action={onBack} />;
  const d = decideNext(space, w);
  const sig = signalsFor(w);
  return (
    <section className="panelPage">
      <button className="back" onClick={onBack}>← World Map</button>
      <div className="worldHeader">
        <div>
          <div className="eyebrow">{w.unitName || 'WORLD'}</div>
          <h1>{w.name}</h1>
          <p>{w.objective}</p>
        </div>
        <div className="masteryOrb">
          <strong>{Math.round(w.mastery * 100)}%</strong>
          <small>MASTERY</small>
        </div>
      </div>
      <div className="detailGrid">
        <div>
          <div className="glass recommendation">
            <div className="recTag">NEXT BEST ACTION</div>
            <h2>{GAME_ICONS[d.game]} {GAME_LABELS[d.game]}</h2>
            <p>{d.reason}</p>
            <div className="whyState">
              <b>Knowledge state:</b> {d.mode.toUpperCase()} <span>→</span> <b>Game state:</b> {GAME_LABELS[d.game]}
            </div>
            <button className="primary" onClick={() => onPlay(d.game)}>Play recommended</button>
          </div>
          <div className="glass">
            <h2>Choose an experience</h2>
            <div className="gameGrid">
              {(w.games || Object.keys(GAME_LABELS)).map(g => (
                <button key={g} className={"gameTile " + (g === d.game ? "recommended" : "")} onClick={() => onPlay(g)}>
                  <span>{GAME_ICONS[g]}</span>
                  <div>
                    <b>{GAME_LABELS[g]}</b>
                    <small>{g === d.game ? "Adaptive next" : "Explore modality"}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <div className="glass">
            <h3>Learner signals</h3>
            <Stat label="Mastery" value={`${Math.round(w.mastery * 100)}%`} />
            <Stat label="Accuracy" value={`${Math.round(sig.accuracy * 100)}%`} />
            <Stat label="Attempts" value={sig.attempts} />
            <Stat label="Avg response" value={`${sig.avgTime.toFixed(1)}s`} />
            <Stat label="Struggle risk" value={sig.errors >= 2 ? "HIGH" : sig.errors ? "MEDIUM" : "LOW"} />
          </div>
          <div className="glass">
            <h3>Progression</h3>
            <p className="muted small">{w.mastery >= 0.72 ? "Boss gate reached." : "Reach 72% mastery to open the boss gate."}</p>
            {w.mastery >= 0.72 ? <button className="bossBtn" onClick={onBoss}>⚔ Enter Boss Battle</button> : <div className="lockLine">🔒 Boss locked</div>}
          </div>
        </aside>
      </div>
    </section>
  );
}

function GameScreen({ space, worldId, game, onDone, onBack }) {
  const w = space.worlds.find(x => (x.id === worldId || x._id === worldId));
  const pool = worldGames(w?.topicId || w?.id || '', w?.name || '', space?.subject || space?.name || '');
  const base = pool.find(x => x.type === game) || pool[0];
  return <GameRunner key={(w?.id || 'w') + "-" + game + "-" + (w?.history?.length || 0)} world={w} space={space} game={game} base={base} onDone={onDone} onBack={onBack} />;
}

function GameRunner({ world, space, game, base, onDone, onBack }) {
  const [answer, setAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [order, setOrder] = useState([]);
  const [matches, setMatches] = useState([]);
  const [clue, setClue] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [started] = useState(Date.now());
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    window.__currentTaskContext = {
      subject: space?.subject || space?.name || 'Web Technologies',
      learningSpace: space?.name || 'Web Technologies',
      unit: world?.unitName || 'Unit',
      world: world?.name || 'World',
      topic: world?.name || 'Topic',
      concept: world?.concepts?.[0] || world?.name,
      gameType: game,
      difficulty: world?.difficulty || 1,
      prompt: base?.prompt || base?.front || `Challenge for ${world?.name}`,
      options: base?.options || null,
      expectedAnswer: base?.answer || base?.back || null,
      learnerAnswer: answer || (order?.length ? order.join(" -> ") : null),
      learnerDNA: space?.learner || null
    };
  }, [base, answer, order, world, space, game]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((Date.now() - started) / 1000), 500);
    return () => clearInterval(t);
  }, [started]);

  const finish = (correct, confidence = 0.8, extra = {}) => onDone({ game, correct, confidence, seconds: Math.max(1, seconds), difficulty: world.difficulty || 1, ...extra });
  const common = (
    <>
      <div className="gameTop">
        <button className="back" onClick={onBack}>← Exit game</button>
        <span className="gameBadge">{GAME_ICONS[game]} {GAME_LABELS[game]}</span>
        <span className="timer">⏱ {seconds.toFixed(0)}s</span>
      </div>
      <div className="gameTitle">
        <small>{world.unitName}</small>
        <h1>{world.name}</h1>
      </div>
    </>
  );

  if (game === "quiz" || game === "scenario") {
    const ok = answer === base.answer;
    return (
      <section className="gamePage">
        {common}
        <div className="playCard">
          <div className="missionLabel">{game === "scenario" ? "MISSION" : "KNOWLEDGE CHECK"}</div>
          <h2>{base.prompt}</h2>
          <div className="options">
            {base.options.map(o => (
              <button className={answer === o ? "selected" : ""} key={o} onClick={() => setAnswer(o)}>
                {o}
              </button>
            ))}
          </div>
          <div className="gameActions">
            <button className="hintBtn" onClick={() => setRevealed(true)}>💡 Hint</button>
            <button className="primary" disabled={!answer} onClick={() => finish(ok, ok ? 0.95 : 0.45, { hintUsed: revealed })}>
              {ok ? "Submit" : "Submit answer"}
            </button>
          </div>
          {revealed && <div className="hintBox">{base.hint}</div>}
        </div>
      </section>
    );
  }

  if (game === "flashcards")
    return (
      <section className="gamePage">
        {common}
        <div className="playCard flashcard">
          <div className="missionLabel">RECALL</div>
          <div className="cardFace">{revealed ? base.back : base.front}</div>
          {!revealed ? (
            <button className="primary" onClick={() => setRevealed(true)}>Reveal</button>
          ) : (
            <div className="gameActions">
              <button className="ghostBtn" onClick={() => finish(false, 0.35)}>Still learning</button>
              <button className="primary" onClick={() => finish(true, 0.95)}>I knew it</button>
            </div>
          )}
        </div>
      </section>
    );

  if (game === "puzzle")
    return <OrderGame base={base} common={common} order={order} setOrder={setOrder} finish={finish} label="CONCEPT PUZZLE" />;

  if (game === "sequence")
    return <OrderGame base={base} common={common} order={order} setOrder={setOrder} finish={finish} label="SEQUENCE / BUILD" />;

  if (game === "match")
    return <MatchGame base={base} common={common} matches={matches} setMatches={setMatches} finish={finish} />;

  if (game === "explore")
    return <Explore base={base} common={common} clue={clue} setClue={setClue} finish={finish} />;

  if (game === "speed")
    return <Speed base={base} common={common} idx={speedIndex} setIdx={setSpeedIndex} score={score} setScore={setScore} finish={finish} />;

  return null;
}

function OrderGame({ base, common, order, setOrder, finish, label }) {
  const items = useMemo(() => shuffle(base?.pieces || base?.steps || []), [base]);
  const target = base?.answer || [];
  const add = x => setOrder(a => a.includes(x) ? a : [...a, x]);
  const done = order.length === target.length;
  return (
    <section className="gamePage">
      {common}
      <div className="playCard">
        <div className="missionLabel">{label}</div>
        <h2>{base?.prompt}</h2>
        <p className="muted">Build the correct chain. Your sequence becomes evidence of understanding.</p>
        <div className="buildPool">
          {items.map(x => <button key={x} disabled={order.includes(x)} onClick={() => add(x)}>{x}</button>)}
        </div>
        <div className="buildResult">
          {order.map((x, i) => <div key={x}><span>{i + 1}</span>{x}</div>)}
        </div>
        <div className="gameActions">
          <button className="ghostBtn" onClick={() => setOrder([])}>Reset</button>
          <button className="primary" disabled={!done} onClick={() => finish(order.every((x, i) => x === target[i]), 0.9)}>Check build</button>
        </div>
      </div>
    </section>
  );
}

function MatchGame({ base, common, matches, setMatches, finish }) {
  const [left, setLeft] = useState(null);
  const [wrong, setWrong] = useState(null);
  const rights = useMemo(() => shuffle(base?.pairs?.map(x => x[1]) || []), [base]);
  const clickRight = r => {
    if (left === null) return;
    const ok = base?.pairs?.[left]?.[1] === r;
    if (ok) {
      const next = [...matches, left];
      setMatches(next);
      setLeft(null);
      if (next.length === base?.pairs?.length) setTimeout(() => finish(true, 0.95), 300);
    } else {
      setWrong(r);
      setTimeout(() => setWrong(null), 400);
    }
  };
  return (
    <section className="gamePage">
      {common}
      <div className="playCard">
        <div className="missionLabel">MATCH & SORT</div>
        <h2>Connect the concepts</h2>
        <div className="matchBoard">
          <div>
            {base?.pairs?.map((p, i) => (
              <button className={matches.includes(i) ? "matched" : left === i ? "selected" : ""} disabled={matches.includes(i)} onClick={() => setLeft(i)} key={p[0]}>
                {p[0]}
              </button>
            ))}
          </div>
          <div>
            {rights.map(r => (
              <button className={matches.some(i => base?.pairs?.[i]?.[1] === r) ? "matched" : wrong === r ? "wrong" : ""} disabled={matches.some(i => base?.pairs?.[i]?.[1] === r)} onClick={() => clickRight(r)} key={r}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small">Select a term, then its matching meaning. {left === null ? "" : `Selected: ${base?.pairs?.[left]?.[0]}`}</p>
      </div>
    </section>
  );
}

function Explore({ base, common, clue, setClue, finish }) {
  return (
    <section className="gamePage">
      {common}
      <div className="playCard explore">
        <div className="missionLabel">EXPLORATION MISSION</div>
        <h2>Find the hidden concept</h2>
        <p className="muted">Move through the learning world. Each clue narrows the concept.</p>
        <div className="mapRooms">
          {(base?.clues || []).map((c, i) => (
            <button className={i <= clue ? "found" : ""} onClick={() => setClue(Math.max(clue, i))} key={c}>
              ◈ {c}
            </button>
          ))}
        </div>
        {clue >= (base?.clues?.length || 1) - 1 && (
          <div className="answerReveal">
            <b>Discovery:</b> {base?.answer}
            <button className="primary" onClick={() => finish(true, 0.9)}>Claim discovery</button>
          </div>
        )}
      </div>
    </section>
  );
}

function Speed({ base, common, idx, setIdx, score, setScore, finish }) {
  const q = base?.questions?.[idx] || "";
  const [answer, setAnswer] = useState("");
  const submit = a => {
    const ok = String(a).toLowerCase() === String(base?.answers?.[idx] || "").toLowerCase();
    const ns = score + (ok ? 1 : 0);
    setScore(ns);
    setAnswer("");
    if (idx + 1 >= (base?.questions?.length || 1)) finish(ns >= Math.ceil((base?.questions?.length || 1) * 0.75), ns / (base?.questions?.length || 1));
    else setIdx(idx + 1);
  };
  return (
    <section className="gamePage">
      {common}
      <div className="playCard speedCard">
        <div className="missionLabel">SPEED RUN</div>
        <div className="speedCount">{idx + 1}<small> / {base?.questions?.length || 1}</small></div>
        <h2>{q}</h2>
        <input autoFocus placeholder="Type a short answer..." value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === "Enter" && answer && submit(answer)} />
        <div className="speedHints"><span>Fast recall challenge</span><span>Score: {score}</span></div>
        <button className="primary full" disabled={!answer} onClick={() => submit(answer)}>Submit & Continue</button>
        <div className="muted small">Speed is used as a challenge only after stable performance.</div>
      </div>
    </section>
  );
}

function BossModal({ space, worldId, onClose, onFinish }) {
  const w = space.worlds.find(x => (x.id === worldId || x._id === worldId));
  const [stage, setStage] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const rounds = [
    worldGames(w.id, w.name, space.name).find(x => x.type === "scenario"),
    worldGames(w.id, w.name, space.name).find(x => x.type === "sequence"),
    worldGames(w.id, w.name, space.name).find(x => x.type === "quiz")
  ];
  const r = rounds[stage];
  const submit = () => {
    let ok;
    if (stage === 1) ok = answer.split("|").map(x => x.trim()).join("|") === (r?.answer || []).join("|");
    else ok = answer === (r?.answer || "");
    if (ok) setScore(x => x + 1);
    if (stage === 2) { onFinish(score + (ok ? 1 : 0) >= 2); return; }
    setAnswer(""); setStage(x => x + 1);
  };
  return (
    <div className="overlay">
      <div className="bossModal">
        <div className="rowBetween">
          <div><span className="eyebrow">FINAL ENCOUNTER</span><h1>⚔ {w?.name} Guardian</h1></div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="bossBar"><i style={{ width: `${100 - (stage / 3) * 100}%` }} /></div>
        <p className="muted">Stage {stage + 1}/3 • Combine understanding, application and construction.</p>
        <div className="bossChallenge">
          <small>{GAME_LABELS[r?.type === "scenario" ? "scenario" : r?.type === "sequence" ? "sequence" : "quiz"]}</small>
          <h2>{r?.prompt}</h2>
          {stage === 1 && r?.steps ? (
            <div className="sequenceBoss">
              {shuffle(r.steps).map(x => (
                <button className={answer.includes(x) ? "selected" : ""} key={x} onClick={() => setAnswer(a => a ? `${a}|${x}` : x)}>{x}</button>
              ))}
            </div>
          ) : stage === 0 || stage === 2 ? r?.options ? (
            <div className="options">
              {r.options.map(o => <button className={answer === o ? "selected" : ""} onClick={() => setAnswer(o)} key={o}>{o}</button>)}
            </div>
          ) : null : null}
          <button className="primary full" disabled={!answer} onClick={submit}>{stage === 2 ? "Finish Boss" : "Continue"}</button>
        </div>
      </div>
    </div>
  );
}

function Notes({ space, update, text, setText, notify }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addText = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    const newNote = { name: title.trim() || "Note", type: "text", text: text.trim() };
    let saved = null;
    try {
      saved = await apiResources.addResource(space.id, newNote);
    } catch (err) {
      if (err?.status && err.status !== 401) notify(err.message || "Could not save the note on the server");
    }
    const finalNote = saved ? { ...newNote, ...saved, id: saved._id || saved.id } : { ...newNote, id: uid() };
    update(s => ({ ...s, notes: [finalNote, ...(s.notes || [])] }));
    setText("");
    setTitle("");
    setIsSaving(false);
    notify("Note saved and indexed into space memory");
  };

  const addFile = e => {
    const f = e.target.files?.[0]; if (!f) return; setFile(f);
    const reader = new FileReader();
    reader.onload = async () => {
      const fileContent = String(reader.result).slice(0, 5000);
      const newNote = { name: f.name, type: f.type || "file", text: fileContent };
      let saved = null;
      try {
        saved = await apiResources.addResource(space.id, newNote);
      } catch (err) {
        if (err?.status && err.status !== 401) notify(err.message || "Could not upload the file on the server");
      }
      const finalNote = saved ? { ...newNote, ...saved, id: saved._id || saved.id } : { ...newNote, id: uid() };
      update(s => ({ ...s, notes: [finalNote, ...(s.notes || [])] }));
      notify(`Uploaded ${f.name} and indexed for AI context`);
    };
    reader.readAsText(f);
  };

  const deleteNote = (noteId) => {
    update(s => ({
      ...s,
      notes: (s.notes || []).filter(n => (n.id !== noteId && n._id !== noteId))
    }));
    notify("Resource removed");
  };

  return (
    <section className="panelPage">
      <div className="eyebrow">RESOURCES & SPACE MEMORY</div>
      <h1>Notes & Knowledge Base</h1>
      <p className="muted">Everything stored here belongs to <b>{space.name}</b> and is automatically indexed for Nova & AI questions.</p>

      <div className="twoCol" style={{ marginBottom: '32px' }}>
        <EditorCard
          value={text}
          onChange={setText}
          title={title}
          onTitleChange={setTitle}
          onSave={addText}
          isSaving={isSaving}
        />
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ margin: '0 0 8px' }}>Upload Resource File</h2>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>Upload study guides, PDF notes, or source code to expand the knowledge base for this space.</p>
          <DropZone onFileSelected={addFile} file={file} label="Upload PDF / TXT Resource" />
        </div>
      </div>

      <h2 style={{ fontFamily: 'Chakra Petch, sans-serif', fontSize: '20px', margin: '24px 0 12px' }}>
        Space Knowledge Repository ({space.notes?.length || 0})
      </h2>
      <div className="resourceGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {space.notes?.length ? space.notes.map(n => (
          <ResourceCard key={n.id || n._id} resource={n} onDelete={deleteNote} />
        )) : <Empty title="No resources stored yet" text="Add notes or drag & drop files to populate this space's knowledge base." />}
      </div>
    </section>
  );
}

function Progress({ space }) {
  const next = space.worlds.find(w => w.mastery < 0.72);
  return (
    <section className="panelPage">
      <div className="eyebrow">LEARNER DNA</div>
      <h1>Your learning state</h1>
      <div className="statGrid">
        <Metric n={`${Math.round((space.learner?.mastery || 0) * 100)}%`} l="Overall mastery" />
        <Metric n={`${Math.round((space.learner?.accuracy || 0) * 100)}%`} l="Accuracy" />
        <Metric n={space.learner?.attempts || 0} l="Interactions" />
        <Metric n={space.xp || 0} l="XP" />
        <Metric n={space.level || 1} l="Level" />
        <Metric n={space.learner?.struggleRisk || 'LOW'} l="Struggle risk" />
      </div>
      <div className="twoCol">
        <div className="glass">
          <h2>Next Best Action</h2>
          {next ? (
            <>
              <h3>{next.name}</h3>
              <p className="muted">{decideNext(space, next).reason}</p>
              <div className="whyState">Knowledge state → <b>{decideNext(space, next).mode}</b> → <b>{GAME_LABELS[decideNext(space, next).game]}</b></div>
            </>
          ) : <p>All worlds are mastered. Challenge mode unlocked.</p>}
        </div>
        <div className="glass">
          <h2>Signals tracked</h2>
          <div className="signalList">
            {["Mastery", "Accuracy", "Response time", "Attempts", "Errors", "Hints", "Preferred game", "Misconceptions"].map((x, i) => (
              <div key={x}>
                <span>{x}</span>
                <b>{[`${Math.round((space.learner?.mastery || 0) * 100)}%`, `${Math.round((space.learner?.accuracy || 0) * 100)}%`, `${(space.learner?.avgTime || 0).toFixed(1)}s`, space.learner?.attempts || 0, space.learner?.errors || 0, space.learner?.hints || 0, GAME_LABELS[space.learner?.preferredGame || 'quiz'], space.learner?.misconceptions?.length || "None"][i]}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Analytics({ space }) {
  const hist = space.worlds.flatMap(w => (w.history || []).map(h => ({ ...h, world: w.name })));
  const by = {};
  hist.forEach(h => {
    if (!by[h.game]) by[h.game] = { n: 0, c: 0 };
    by[h.game].n += 1;
    if (h.correct) by[h.game].c += 1;
  });

  return (
    <section className="panelPage">
      <div className="eyebrow">ANALYTICS</div>
      <h1>Evidence of learning</h1>
      <div className="analyticsGrid">
        {Object.entries(GAME_LABELS).map(([g, l]) => (
          <div className="analyticCard" key={g}>
            <span>{GAME_ICONS[g]}</span>
            <b>{l}</b>
            <strong>{by[g]?.n || 0}</strong>
            <small>{by[g] ? Math.round((by[g].c / by[g].n) * 100) : 0}% accuracy</small>
          </div>
        ))}
      </div>
      <div className="glass">
        <h2>World mastery</h2>
        {space.worlds.map(w => (
          <div className="analyticRow" key={w.id || w._id}>
            <span>{w.name}</span>
            <div className="bar"><i style={{ width: `${w.mastery * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Nova({ open, setOpen, input, setInput, reply, ask, isThinking }) {
  const msgEndRef = useRef(null);

  useEffect(() => {
    if (open && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [reply, isThinking, open]);

  return (
    <>
      <button className={"novaFloat " + (open ? "open" : "")} onClick={() => setOpen(!open)} title="Toggle Nova AI Mentor">
        ◉<span>Nova</span>
      </button>

      {open && (
        <div className="novaPanel">
          <div className="novaHead">
            <div className="novaAvatar">N</div>
            <div><b>NOVA</b><small>Context-aware learning mentor</small></div>
            <button className="novaCloseBtn" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="novaMsgBody">
            <div className="novaMsg">
              {isThinking ? (
                <div className="novaThinkingState">
                  <span className="pulseDot"></span>
                  <span>Nova is analyzing your learning state...</span>
                </div>
              ) : (
                reply
              )}
            </div>
            <div ref={msgEndRef} />
          </div>

          <div className="novaPrompts">
            {["Why this next?", "How am I doing?", "Give me a hint", "Why did I get this wrong?"].map(x => (
              <button key={x} onClick={() => ask(x)}>{x}</button>
            ))}
          </div>

          <div className="novaInput">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ask()}
              placeholder="Ask Nova about this task..."
            />
            <button onClick={() => ask()}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}

function Modal({ title, close, children, wide }) {
  return (
    <div className="overlay">
      <div className={"modal " + (wide ? "wide" : "")}>
        <div className="rowBetween"><h2>{title}</h2><button className="close" onClick={close}>×</button></div>
        {children}
      </div>
    </div>
  );
}

function Empty({ title, text, action }) {
  return (
    <div className="empty glass">
      <h2>{title}</h2>
      <p>{text}</p>
      {action && <button className="primary" onClick={action}>Continue</button>}
    </div>
  );
}

function Stat({ label, value }) { return <div className="statLine"><span>{label}</span><b>{value}</b></div>; }
function Metric({ n, l }) { return <div className="metric"><strong>{n}</strong><span>{l}</span></div>; }
function shuffle(a) { return Array.isArray(a) ? [...a].sort(() => Math.random() - 0.5) : []; }

export default App;
