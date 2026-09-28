import { callOpenRouterStructured } from './ai/openrouter.service.js';

export async function generateGameContentAI(world, gameType, difficulty = 1, misconception = null) {
  const topicName = world?.name || 'Topic Concept';
  const unitName = world?.unitName || '';
  const concepts = world?.concepts || [topicName];
  const gameModel = process.env.AI_MODEL_GAME || process.env.AI_MODEL_PRIMARY || 'google/gemini-2.0-flash-001';

  if (world) {
    try {
      const prompt = `Generate a high-quality educational game challenge strictly about "${topicName}" (${unitName}).
Key Concepts: ${concepts.join(', ')}
Game Type: ${gameType}
Difficulty Level: D${difficulty}
${misconception ? `Address Misconception: ${misconception}` : ''}

INSTRUCTIONS:
1. The question and content MUST be 100% specific to "${topicName}". Do NOT generate generic programming questions like "What is a variable?".
2. Return ONLY a valid JSON object matching the expected structure for game type "${gameType}":

For "quiz" or "scenario":
{
  "type": "${gameType}",
  "prompt": "Specific challenge question about ${topicName}...",
  "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
  "answer": "Option A (Correct)",
  "hint": "Specific hint pointing to ${topicName} concept.",
  "explain": "Clear explanation of why this answer is correct."
}

For "flashcards":
{
  "type": "flashcards",
  "front": "Specific question about ${topicName}?",
  "back": "Detailed answer explaining the concept."
}

For "puzzle" or "sequence":
{
  "type": "${gameType}",
  "prompt": "Arrange the execution steps for ${topicName}:",
  "pieces": ["Step 1", "Step 2", "Step 3"],
  "answer": ["Step 1", "Step 2", "Step 3"]
}

For "match":
{
  "type": "match",
  "pairs": [
    ["Term 1", "Meaning 1"],
    ["Term 2", "Meaning 2"],
    ["Term 3", "Meaning 3"],
    ["Term 4", "Meaning 4"]
  ]
}

For "explore":
{
  "type": "explore",
  "clues": ["Clue 1 about ${topicName}", "Clue 2 about ${topicName}", "Clue 3 about ${topicName}"],
  "answer": "${topicName}"
}

For "speed":
{
  "type": "speed",
  "questions": ["Q1 about ${topicName}?", "Q2 about ${topicName}?", "Q3 about ${topicName}?"],
  "answers": ["A1", "A2", "A3"]
}`;

      const parsed = await callOpenRouterStructured({
        systemPrompt: 'You are an expert subject-matter content generator for interactive learning games.',
        userPrompt: prompt,
        model: gameModel
      });

      if (parsed?.type && (parsed.prompt || parsed.front || parsed.pairs || parsed.questions)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[AI Game Generator] OpenRouter gateway generation failed for ${topicName}/${gameType}, using subject fallback:`, err.message);
    }
  }

  return generateFallbackGameContent(world, gameType, difficulty);
}

export function generateFallbackGameContent(world, gameType, difficulty = 1) {
  const name = world?.name || 'Concept';
  const unit = world?.unitName || '';
  const topicId = (world?.topicId || name.toLowerCase().replace(/\W+/g, '-')).toLowerCase();
  const concepts = world?.concepts?.length ? world.concepts : [name];
  const c1 = concepts[0] || name;

  // --- WEB TECHNOLOGIES SPECIFIC QUESTION BANK ---
  if (topicId.includes('servlet-architecture') || topicId.includes('servlet') || name.toLowerCase().includes('servlet')) {
    if (topicId.includes('session') || topicId.includes('cookie') || name.toLowerCase().includes('session')) {
      return getServletSessionGame(gameType);
    }
    return getServletLifecycleGame(gameType);
  }

  if (topicId.includes('jdbc') || name.toLowerCase().includes('jdbc')) {
    return getJDBCGame(gameType);
  }

  if (topicId.includes('php') || name.toLowerCase().includes('php')) {
    return getPHPGame(gameType);
  }

  if (topicId.includes('xml') || name.toLowerCase().includes('xml') || name.toLowerCase().includes('dtd') || name.toLowerCase().includes('schema')) {
    return getXMLGame(gameType);
  }

  if (topicId.includes('ajax') || name.toLowerCase().includes('ajax') || name.toLowerCase().includes('xmlhttprequest')) {
    return getAJAXGame(gameType);
  }

  if (topicId.includes('react') || name.toLowerCase().includes('react') || name.toLowerCase().includes('jsx')) {
    return getReactGame(gameType);
  }

  if (topicId.includes('html5') || name.toLowerCase().includes('html5') || name.toLowerCase().includes('html')) {
    return getHTML5Game(gameType);
  }

  if (topicId.includes('css') || name.toLowerCase().includes('css')) {
    return getCSS3Game(gameType);
  }

  if (topicId.includes('dom') || topicId.includes('js') || name.toLowerCase().includes('javascript')) {
    return getJavaScriptDOMGame(gameType);
  }

  // --- AIML SPECIFIC QUESTION BANK ---
  if (topicId.includes('linear-regression') || name.toLowerCase().includes('linear regression')) {
    return getLinearRegressionGame(gameType);
  }

  if (topicId.includes('neural') || name.toLowerCase().includes('neural network')) {
    return getNeuralNetworkGame(gameType);
  }

  // --- DYNAMIC SUBJECT FALLBACK (Clean & Subject-Tailored) ---
  switch (gameType) {
    case 'quiz':
    case 'scenario':
      return {
        type: gameType,
        prompt: gameType === 'scenario'
          ? `You are building a web application feature using ${name}. Which approach ensures correct operation?`
          : `Which statement accurately describes ${name}?`,
        options: [
          `A core technique and protocol governing ${c1} in ${unit || 'this topic'}`,
          `An obsolete formatting command`,
          `A browser warning event`,
          `A hardware instruction code`
        ],
        answer: `A core technique and protocol governing ${c1} in ${unit || 'this topic'}`,
        hint: `Focus on how ${name} handles ${c1}.`,
        explain: `${name} provides the standard specification and execution flow for ${c1}.`
      };

    case 'flashcards':
      return {
        type: 'flashcards',
        front: `What is the primary function of ${name}?`,
        back: `${name} specifies how ${c1} is implemented and evaluated in ${unit || 'this subject'}.`
      };

    case 'puzzle':
    case 'sequence':
      return {
        type: gameType,
        prompt: `Arrange the execution pipeline for ${name}`,
        pieces: [
          `Initialize ${c1} context`,
          `Execute ${name} request handling`,
          `Process response and update state`
        ],
        answer: [
          `Initialize ${c1} context`,
          `Execute ${name} request handling`,
          `Process response and update state`
        ]
      };

    case 'match':
      return {
        type: 'match',
        pairs: [
          [name, `Primary topic concept`],
          [c1, `Core execution component`],
          [`Validation`, `Ensures data correctness`],
          [`State Handling`, `Maintains runtime context`]
        ]
      };

    case 'explore':
      return {
        type: 'explore',
        clues: [
          `Inspect the ${name} specification`,
          `Locate the ${c1} execution handler`,
          `Verify the output state`
        ],
        answer: name.toLowerCase()
      };

    case 'speed':
      return {
        type: 'speed',
        questions: [
          `Does ${name} handle dynamic requests?`,
          `What evaluates ${c1}?`,
          `Is state handling required for ${name}?`
        ],
        answers: ['yes', 'handler', 'yes']
      };

    default:
      return {
        type: 'quiz',
        prompt: `What is the key objective of ${name}?`,
        options: [`Implementing ${c1} correctly`, 'Ignoring input parameters', 'Syntax error', 'Hardware interrupt'],
        answer: `Implementing ${c1} correctly`,
        hint: `Think about ${name}.`,
        explain: `Implementing ${c1} correctly is central to ${name}.`
      };
  }
}

// === DOMAIN-SPECIFIC FALLBACK GENERATORS ===

function getServletLifecycleGame(gameType) {
  if (gameType === 'sequence' || gameType === 'puzzle') {
    return {
      type: gameType,
      prompt: 'Arrange the Java Servlet Life Cycle execution order:',
      pieces: ['Servlet class loaded and instance created', 'init() method invoked once', 'service() method handles requests', 'destroy() method invoked before termination'],
      answer: ['Servlet class loaded and instance created', 'init() method invoked once', 'service() method handles requests', 'destroy() method invoked before termination']
    };
  }
  if (gameType === 'scenario') {
    return {
      type: 'scenario',
      prompt: 'Your Servlet must initialize a database connection pool only once when the server boots. Where should this initialization code be placed?',
      options: ['Inside the init() method', 'Inside the service() method', 'Inside the destroy() method', 'In a scriptlet block in HTML'],
      answer: 'Inside the init() method',
      hint: 'init() is called exactly once when the servlet container initializes the servlet.',
      explain: 'init() is invoked only once during the servlet lifecycle, making it the correct place for one-time initialization.'
    };
  }
  if (gameType === 'match') {
    return {
      type: 'match',
      pairs: [
        ['init()', 'One-time initialization'],
        ['service()', 'Dispatches GET/POST requests'],
        ['destroy()', 'Cleanup before garbage collection'],
        ['HttpServletRequest', 'Encapsulates client HTTP request']
      ]
    };
  }
  return {
    type: 'quiz',
    prompt: 'Which method in the Servlet lifecycle is called once when the servlet is initialized by the container?',
    options: ['init()', 'service()', 'doGet()', 'destroy()'],
    answer: 'init()',
    hint: 'Think of the initialization phase.',
    explain: 'init() is executed exactly once by the servlet container after instantiating the servlet.'
  };
}

function getServletSessionGame(gameType) {
  if (gameType === 'match') {
    return {
      type: 'match',
      pairs: [
        ['HttpSession', 'Server-side session management'],
        ['Cookie', 'Small text file stored on client browser'],
        ['URL Rewriting', 'Appends session ID to URL links'],
        ['Hidden Form Fields', 'Passes session state inside form inputs']
      ]
    };
  }
  return {
    type: 'quiz',
    prompt: 'Which Java Servlet interface is used to track session state across multiple HTTP requests on the server?',
    options: ['HttpSession', 'Cookie', 'HttpServletRequest', 'ServletConfig'],
    answer: 'HttpSession',
    hint: 'The container provides an object accessed via request.getSession().',
    explain: 'HttpSession provides a way to identify a user across requests and store user session data on the server.'
  };
}

function getJDBCGame(gameType) {
  if (gameType === 'scenario') {
    return {
      type: 'scenario',
      prompt: 'You need to execute a SQL query multiple times efficiently while preventing SQL injection attacks in a Servlet. Which JDBC object should you use?',
      options: ['PreparedStatement', 'Statement', 'CallableStatement', 'ConnectionPool'],
      answer: 'PreparedStatement',
      hint: 'PreparedStatement precompiles SQL queries and handles parameterized values safely.',
      explain: 'PreparedStatement precompiles the SQL query and escapes parameters, preventing SQL injection.'
    };
  }
  if (gameType === 'sequence' || gameType === 'puzzle') {
    return {
      type: gameType,
      prompt: 'Arrange the typical JDBC Database Connection steps:',
      pieces: ['Load JDBC Driver class', 'Establish Connection via DriverManager.getConnection()', 'Create PreparedStatement object', 'Execute query and process ResultSet', 'Close Connection and ResultSet'],
      answer: ['Load JDBC Driver class', 'Establish Connection via DriverManager.getConnection()', 'Create PreparedStatement object', 'Execute query and process ResultSet', 'Close Connection and ResultSet']
    };
  }
  return {
    type: 'quiz',
    prompt: 'Which JDBC interface is used to establish a connection to a specific database URL?',
    options: ['DriverManager.getConnection()', 'ResultSet.next()', 'Statement.executeQuery()', 'ServletConfig.getInitParameter()'],
    answer: 'DriverManager.getConnection()',
    hint: 'DriverManager manages the list of database drivers.',
    explain: 'DriverManager.getConnection() returns a Connection object to the database specified by the URL.'
  };
}

function getPHPGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'In PHP, which superglobal variable is automatically populated when a form submits data via the POST method?',
    options: ['$_POST', '$_GET', '$_SESSION', '$_REQUEST_BODY'],
    answer: '$_POST',
    hint: 'It corresponds to HTTP POST method.',
    explain: '$_POST is an associative array of variables passed to the current script via the HTTP POST method.'
  };
}

function getXMLGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which standard is used to transform an XML document into HTML or another XML format?',
    options: ['XSLT', 'DTD', 'XML Schema', 'DOM'],
    answer: 'XSLT',
    hint: 'Extensible Stylesheet Language Transformations.',
    explain: 'XSLT (Extensible Stylesheet Language Transformations) is used to transform XML documents into HTML or other formats.'
  };
}

function getAJAXGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which JavaScript object is traditionally used to initiate asynchronous HTTP requests to a web server without reloading the page?',
    options: ['XMLHttpRequest', 'FetchEvent', 'DOMParser', 'JSON.parse'],
    answer: 'XMLHttpRequest',
    hint: 'XMLHttpRequest is the core object behind traditional AJAX.',
    explain: 'XMLHttpRequest objects are used to interact with servers asynchronously without full page refreshes.'
  };
}

function getReactGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'In ReactJS, what syntax extension allows developers to write HTML-like elements inside JavaScript code?',
    options: ['JSX', 'TypeScript', 'XSLT', 'JSON'],
    answer: 'JSX',
    hint: 'JavaScript XML.',
    explain: 'JSX is a syntax extension for JavaScript that looks similar to HTML and describes what the UI should look like.'
  };
}

function getHTML5Game(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which HTML5 element is specifically used to embed video content natively without third-party plugins?',
    options: ['<video>', '<media>', '<embed-video>', '<object>'],
    answer: '<video>',
    hint: 'Standard HTML5 media element.',
    explain: 'The HTML5 <video> tag specifies a standard way to embed video in a web page.'
  };
}

function getCSS3Game(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which CSS3 property controls how styles cascade and inherit from parent to child elements in the document tree?',
    options: ['Inheritance & Cascade rules', 'z-index', 'box-sizing', 'float'],
    answer: 'Inheritance & Cascade rules',
    hint: 'Think CSS cascading order.',
    explain: 'The cascade and inheritance determine which style rules apply when multiple rules match an element.'
  };
}

function getJavaScriptDOMGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which DOM method attaches an event handler to an HTML element without overwriting existing event handlers?',
    options: ['addEventListener()', 'attachEvent()', 'onclick = function()', 'document.write()'],
    answer: 'addEventListener()',
    hint: 'Standard DOM Level 2 event listener method.',
    explain: 'addEventListener() registers a single event listener on a target without overwriting existing listeners.'
  };
}

function getLinearRegressionGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'What is the primary loss function minimized during ordinary least squares (OLS) linear regression?',
    options: ['Mean Squared Error (MSE)', 'Log Loss', 'Cross-Entropy Loss', 'Hinge Loss'],
    answer: 'Mean Squared Error (MSE)',
    hint: 'It measures the average squared difference between estimated values and actual target.',
    explain: 'Linear regression minimizes Mean Squared Error (MSE) to find the best fitting line.'
  };
}

function getNeuralNetworkGame(gameType) {
  return {
    type: 'quiz',
    prompt: 'Which algorithm applies the calculus chain rule to compute gradients of the loss function with respect to neural network weights?',
    options: ['Backpropagation', 'Forward Pass', 'K-Means', 'Principal Component Analysis'],
    answer: 'Backpropagation',
    hint: 'Backwards propagation of errors.',
    explain: 'Backpropagation calculates the gradient of the loss function for each weight by the chain rule.'
  };
}
