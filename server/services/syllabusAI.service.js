import { callOpenRouterStructured } from './ai/openrouter.service.js';

export async function extractTextFromBuffer(buffer, mimeType = '') {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    if (mimeType.includes('pdf') || buffer.toString('ascii', 0, 5) === '%PDF-') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    return buffer.toString('utf-8');
  } catch (err) {
    console.warn('[PDF Extract Warning] Failed to parse PDF buffer, treating as text:', err.message);
    return buffer.toString('utf-8');
  }
}

export async function analyzeSyllabusAI(rawText, spaceName = 'Custom Course') {
  const syllabusModel = process.env.AI_MODEL_SYLLABUS || process.env.AI_MODEL_PRIMARY || 'google/gemini-2.0-flash-001';

  if (rawText && rawText.length > 20) {
    try {
      const systemPrompt = `You are an expert curriculum parser AI. Analyze the provided syllabus text for "${spaceName}".
Extract the ACTUAL course title, units, and topics verbatim from the syllabus.
DO NOT use generic category names like "Foundations", "Core Concepts", "Methodologies", "Applications", or "Evaluation" unless they appear verbatim in the source text.

Return a valid JSON object strictly matching this schema:
{
  "subject": "${spaceName}",
  "course": "Course Code & Name",
  "units": [
    {
      "id": "u1",
      "name": "Exact Unit Title from Syllabus",
      "topics": [
        {
          "id": "topic-id-slug",
          "name": "Exact Topic Name",
          "objective": "Clear, subject-specific learning objective.",
          "skills": ["Skill 1", "Skill 2"],
          "concepts": ["Concept 1", "Concept 2"]
        }
      ]
    }
  ]
}`;

      const parsed = await callOpenRouterStructured({
        systemPrompt,
        userPrompt: rawText.slice(0, 12000),
        model: syllabusModel
      });

      if (parsed?.units && parsed.units.length > 0 && parsed.units.some(u => u.topics && u.topics.length > 0)) {
        return parsed;
      }
    } catch (err) {
      console.warn('[AI Syllabus Service] OpenRouter gateway call failed, using heuristic parser:', err.message);
    }
  }

  return parseSyllabusHeuristic(rawText, spaceName);
}

export function parseSyllabusHeuristic(text, spaceName = 'Custom Course') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return getSubjectSpecificFallback(spaceName);
  }

  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const units = [];
  let currentUnit = null;
  let courseTitle = spaceName;

  for (const line of lines) {
    const courseMatch = line.match(/^(?:course|subject)\s*[:\-–]?\s*(.+)$/i);
    if (courseMatch) {
      courseTitle = courseMatch[1].trim();
      continue;
    }

    const unitMatch = line.match(/^(unit|module|chapter|part|section|block)\s*([ivxlcdm\d]+)?\s*[:\-–]?\s*(.+)$/i);
    if (unitMatch) {
      const unitNum = unitMatch[2] ? unitMatch[2].toUpperCase() : String(units.length + 1);
      const unitTitle = unitMatch[3] ? unitMatch[3].trim() : line;
      currentUnit = {
        id: `u${units.length + 1}`,
        name: `Unit ${unitNum}: ${unitTitle}`,
        topics: []
      };
      units.push(currentUnit);
      continue;
    }

    const topicClean = line.replace(/^(?:[-•*]|\d+[.)])\s+/, '').trim();

    if (topicClean.length > 2 && topicClean.length < 120 && !topicClean.toLowerCase().includes('course:')) {
      if (!currentUnit) {
        currentUnit = {
          id: 'u1',
          name: `${spaceName} Topics`,
          topics: []
        };
        units.push(currentUnit);
      }

      const slug = topicClean.toLowerCase().replace(/\W+/g, '-').replace(/^-+|-+$/g, '');
      currentUnit.topics.push({
        id: slug || `topic-${currentUnit.topics.length + 1}`,
        name: topicClean,
        objective: `Master principles and application of ${topicClean}.`,
        skills: [topicClean, 'Implementation', 'Problem Solving'],
        concepts: [topicClean, 'Syntax & Semantics', 'Architecture']
      });
    }
  }

  const validUnits = units.filter(u => u.topics.length > 0);
  if (validUnits.length > 0) {
    return { subject: courseTitle || spaceName, units: validUnits };
  }

  return getSubjectSpecificFallback(spaceName);
}

function getSubjectSpecificFallback(spaceName = 'Custom Course') {
  const nameLower = spaceName.toLowerCase();

  // Web Technologies / WT Fallback
  if (nameLower.includes('web') || nameLower.includes('wt') || nameLower.includes('24cs502')) {
    return {
      subject: 'Web Technologies',
      course: '24CS502 - WEB TECHNOLOGIES',
      units: [
        {
          id: 'u1',
          name: 'UNIT I: HTML 5, CSS 3, JAVASCRIPT',
          topics: [
            { id: 'html5-controls', name: 'HTML5 & Control Elements', objective: 'Master HTML5 semantic elements, forms, audio/video, and drag and drop.', skills: ['HTML5', 'Forms', 'Media Controls'], concepts: ['Tables', 'Lists', 'Controls', 'Media'] },
            { id: 'css3-styling', name: 'CSS3 & Rule Cascading', objective: 'Apply CSS3 inline, embedded, and external stylesheets with inheritance.', skills: ['CSS3', 'Cascading', 'Flexbox/Grid'], concepts: ['Stylesheets', 'Cascading', 'Inheritance'] },
            { id: 'js-dom-events', name: 'JavaScript DOM & Events', objective: 'Manipulate DOM elements, handle events, and validate form inputs.', skills: ['JavaScript', 'DOM Manipulation', 'Event Handling'], concepts: ['DOM Model', 'Event Listeners', 'Validation'] }
          ]
        },
        {
          id: 'u2',
          name: 'UNIT II: SERVER SIDE PROGRAMMING',
          topics: [
            { id: 'servlet-architecture', name: 'Servlet Architecture & Lifecycle', objective: 'Understand Java Servlet architecture, init(), service(), and destroy() lifecycle.', skills: ['Java Servlets', 'Servlet Lifecycle', 'HTTP Handling'], concepts: ['Servlet Config', 'Lifecycle Methods', 'GET/POST'] },
            { id: 'session-management', name: 'Servlet Sessions & Cookies', objective: 'Implement session tracking using Cookies, URL rewriting, and HttpSession.', skills: ['Session Tracking', 'Cookies', 'URL Rewriting'], concepts: ['HttpSession', 'Cookie API', 'Hidden Fields'] },
            { id: 'jdbc-integration', name: 'JDBC Database Connectivity', objective: 'Connect Java Servlets to SQL databases using DriverManager and PreparedStatement.', skills: ['JDBC', 'SQL Queries', 'Connection Pooling'], concepts: ['DriverManager', 'PreparedStatement', 'ResultSet'] }
          ]
        },
        {
          id: 'u3',
          name: 'UNIT III: PHP',
          topics: [
            { id: 'php-fundamentals', name: 'PHP Fundamentals & Control', objective: 'Write server-side PHP scripts with variables, control structures, and functions.', skills: ['PHP Syntax', 'Control Flow', 'Built-in Functions'], concepts: ['Variables', 'Functions', 'Program Control'] },
            { id: 'php-validation-files', name: 'PHP Validation & File Handling', objective: 'Process web forms, validate inputs with regex, and manage file operations.', skills: ['Form Validation', 'Regex', 'File I/O'], concepts: ['Form GET/POST', 'Regular Expressions', 'File Handling'] },
            { id: 'php-database', name: 'PHP Database Integration', objective: 'Connect PHP applications to MySQL databases and manage user sessions.', skills: ['PHP MySQL', 'Session Management', 'Cookies'], concepts: ['mysqli', 'PHP Sessions', 'Database Queries'] }
          ]
        },
        {
          id: 'u4',
          name: 'UNIT IV: XML AND AJAX',
          topics: [
            { id: 'xml-schema', name: 'XML, DTD & XML Schema', objective: 'Create structured XML documents validated with DTD and XML Schema.', skills: ['XML Syntax', 'DTD Validation', 'XSD'], concepts: ['XML Nodes', 'Attributes', 'Validation'] },
            { id: 'xslt-transformation', name: 'XSL & XSLT Transformation', objective: 'Transform XML documents into HTML using XSLT templates.', skills: ['XSLT', 'XPath', 'XML Parsing'], concepts: ['Templates', 'XPath Expressions', 'Output Formats'] },
            { id: 'ajax-architecture', name: 'AJAX & XMLHttpRequest', objective: 'Build asynchronous web interfaces using XMLHttpRequest and callback methods.', skills: ['AJAX', 'XMLHttpRequest', 'Asynchronous Requests'], concepts: ['Client-Server Architecture', 'Callback Methods', 'JSON/XML Payload'] }
          ]
        },
        {
          id: 'u5',
          name: 'UNIT V: INTRODUCTION TO REACT',
          topics: [
            { id: 'react-jsx', name: 'ReactJS & JSX Fundamentals', objective: 'Understand React architecture, JSX syntax, and component rendering.', skills: ['ReactJS', 'JSX Syntax', 'Virtual DOM'], concepts: ['JSX', 'React Elements', 'App Component'] },
            { id: 'react-components-props', name: 'React Components & Props', objective: 'Build modular functional components and transfer properties across hierarchy.', skills: ['React Components', 'Props Transfer', 'State Management'], concepts: ['Functional Components', 'Props', 'Component Tree'] }
          ]
        }
      ]
    };
  }

  // Machine Learning / AIML Fallback
  if (nameLower.includes('aiml') || nameLower.includes('machine learning') || nameLower.includes('ai')) {
    return {
      subject: 'AI & Machine Learning',
      units: [
        {
          id: 'u1',
          name: 'Supervised Learning',
          topics: [
            { id: 'linear-regression', name: 'Linear Regression', objective: 'Model continuous relationships and predict scalar targets.', skills: ['Regression', 'Loss Functions', 'Gradient Descent'], concepts: ['Linear Fit', 'MSE Loss', 'Slope & Intercept'] },
            { id: 'logistic-regression', name: 'Logistic Regression', objective: 'Classify binary outcomes using sigmoid decision boundaries.', skills: ['Classification', 'Log Loss', 'Decision Boundary'], concepts: ['Sigmoid Function', 'Log Loss', 'Binary Classification'] },
            { id: 'decision-trees', name: 'Decision Trees', objective: 'Construct decision rules using entropy and information gain.', skills: ['Entropy', 'Information Gain', 'Pruning'], concepts: ['Tree Nodes', 'Split Criteria', 'Pruning'] }
          ]
        },
        {
          id: 'u2',
          name: 'Deep Learning & Neural Networks',
          topics: [
            { id: 'neural-networks', name: 'Neural Networks Architecture', objective: 'Understand perceptrons, hidden layers, and activation functions.', skills: ['Perceptrons', 'Activation Functions', 'Forward Pass'], concepts: ['Weights & Biases', 'ReLU/Sigmoid', 'Layer Connectivity'] },
            { id: 'backpropagation', name: 'Backpropagation & Optimization', objective: 'Compute gradients via chain rule to update network weights.', skills: ['Gradient Calculation', 'Chain Rule', 'Weight Updates'], concepts: ['Gradients', 'Chain Rule', 'Adam/SGD Optimizer'] }
          ]
        },
        {
          id: 'u3',
          name: 'Model Evaluation & Regularization',
          topics: [
            { id: 'overfitting-regularization', name: 'Overfitting & Regularization', objective: 'Prevent overfitting using L1/L2 regularization and dropout.', skills: ['L1/L2 Penalty', 'Dropout', 'Generalization'], concepts: ['Bias-Variance Tradeoff', 'L1/L2 Norm', 'Dropout'] },
            { id: 'model-evaluation', name: 'Model Evaluation Metrics', objective: 'Evaluate models using Precision, Recall, F1-Score, and ROC-AUC.', skills: ['Confusion Matrix', 'F1-Score', 'ROC-AUC'], concepts: ['Confusion Matrix', 'Precision/Recall', 'ROC Curve'] }
          ]
        }
      ]
    };
  }

  // General Subject Fallback
  return {
    subject: spaceName,
    units: [
      {
        id: 'u1',
        name: `${spaceName} Fundamentals`,
        topics: [
          { id: `${spaceName.toLowerCase().replace(/\W+/g, '-')}-core`, name: `${spaceName} Core Principles`, objective: `Understand core principles of ${spaceName}.`, skills: ['Fundamentals', 'Principles'], concepts: ['Core Concepts', 'Framework'] },
          { id: `${spaceName.toLowerCase().replace(/\W+/g, '-')}-methods`, name: `${spaceName} Methods & Analysis`, objective: `Apply key analytical methods in ${spaceName}.`, skills: ['Methods', 'Analysis'], concepts: ['Techniques', 'Methodology'] }
        ]
      },
      {
        id: 'u2',
        name: `Applied ${spaceName}`,
        topics: [
          { id: `${spaceName.toLowerCase().replace(/\W+/g, '-')}-applications`, name: `${spaceName} Practical Applications`, objective: `Solve practical problems using ${spaceName}.`, skills: ['Problem Solving', 'Application'], concepts: ['Implementation', 'Case Studies'] }
        ]
      }
    ]
  };
}
