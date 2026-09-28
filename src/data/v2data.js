export const DEMO_SYLLABUS = {
  subject: "Programming",
  units: [
    { id:"u1", name:"Programming Foundations", topics:[
      {id:"variables", name:"Variables", objective:"Store, update and reason about values.", skills:["Declaration","Assignment","Scope"]},
      {id:"datatypes", name:"Data Types", objective:"Choose and use appropriate data representations.", skills:["Primitive types","Type conversion","Type reasoning"]},
      {id:"operators", name:"Operators", objective:"Apply arithmetic, comparison and logical operators.", skills:["Arithmetic","Comparison","Logic"]}
    ]},
    { id:"u2", name:"Control Flow", topics:[
      {id:"conditions", name:"Conditions", objective:"Use conditional logic to make decisions.", skills:["if/else","Boolean logic","Branching"]},
      {id:"loops", name:"Loops", objective:"Repeat work safely with controlled iteration.", skills:["Initialization","Condition","Update"]}
    ]},
    { id:"u3", name:"Functions", topics:[
      {id:"functions", name:"Functions", objective:"Package reusable logic into functions.", skills:["Definition","Call","Return"]},
      {id:"parameters", name:"Parameters", objective:"Pass information into reusable logic.", skills:["Parameters","Arguments","Defaults"]},
      {id:"returns", name:"Return Values", objective:"Produce and use values returned by functions.", skills:["Return","Caller","Composition"]}
    ]}
  ]
};

const generic = {
  variables: [
    {type:"quiz",prompt:"Which statement best describes a variable?",answer:"A named place that can hold a value",options:["A named place that can hold a value","Only a constant number","A program error","A comment"],hint:"Think about a name whose value can change."},
    {type:"flashcards",front:"What is assignment?",back:"Assignment stores the evaluated right-hand value in a variable."},
    {type:"puzzle",prompt:"Build the idea of assignment",pieces:["evaluate the right side","choose the target variable","store the result"],answer:["evaluate the right side","choose the target variable","store the result"]},
    {type:"scenario",prompt:"A program calculates total = price * quantity. Which action correctly updates total?",options:["Assign the calculated result to total","Rename total every time","Put the calculation in a comment","Delete total"],answer:"Assign the calculated result to total"},
    {type:"match",pairs:[["Declaration","Creates a name"],["Assignment","Stores a value"],["Scope","Where a name is visible"],["Value","Data held by a variable"]]},
    {type:"sequence",steps:["Choose the value","Evaluate the expression","Store it in the variable","Use the updated value"],answer:["Choose the value","Evaluate the expression","Store it in the variable","Use the updated value"]},
    {type:"explore",clues:["Find the panel labelled STORAGE","Inspect the item that can change","Choose the object that remembers a value"],answer:"variable"},
    {type:"speed",questions:["x = 2; x = 5. What is x?","Which operation stores a value?","Can a variable change?","What does scope describe?"],answers:["5","assignment","yes","visibility"]}
  ],
  datatypes:[
    {type:"quiz",prompt:"Which is most suitable for a whole-number count?",answer:"Integer",options:["Integer","Boolean","String","Comment"],hint:"Think of 0, 1, 2, 3..."},
    {type:"flashcards",front:"What is a Boolean?",back:"A Boolean represents one of two logical states: true or false."},
    {type:"puzzle",prompt:"Construct a type decision",pieces:["identify the data","choose its meaning","select a suitable type"],answer:["identify the data","choose its meaning","select a suitable type"]},
    {type:"scenario",prompt:"A login flag must represent yes/no. Which type fits?",options:["Boolean","String sentence","Array only","Function name"],answer:"Boolean"},
    {type:"match",pairs:[["Integer","Whole number"],["String","Text"],["Boolean","True/false"],["Float","Decimal number"]]},
    {type:"sequence",steps:["Inspect the value","Identify its meaning","Choose the representation","Use the type consistently"],answer:["Inspect the value","Identify its meaning","Choose the representation","Use the type consistently"]},
    {type:"explore",clues:["Find the TRUE/FALSE token","Find the quoted text","Find the whole number"],answer:"datatype"},
    {type:"speed",questions:["true/false is which type?","Text is commonly called?","3.14 is commonly a?","Whole numbers are?"] ,answers:["boolean","string","float","integer"]}
  ],
  operators:[
    {type:"quiz",prompt:"What is the result of 3 + 2 * 2?",answer:"7",options:["10","7","8","12"],hint:"Multiplication is evaluated before addition."},
    {type:"flashcards",front:"What does == usually test?",back:"It compares two values for equality."},
    {type:"puzzle",prompt:"Put the expression evaluation in order",pieces:["parentheses","multiplication/division","addition/subtraction"],answer:["parentheses","multiplication/division","addition/subtraction"]},
    {type:"scenario",prompt:"You need to check whether age is at least 18. Which expression is appropriate?",options:["age >= 18","age = 18","age + 18","age * 18"],answer:"age >= 18"},
    {type:"match",pairs:[["+","addition"],[">","greater than"],["&&","logical AND"],["*","multiplication"]]},
    {type:"sequence",steps:["Read the expression","Apply parentheses","Apply higher-precedence operators","Apply remaining operators"],answer:["Read the expression","Apply parentheses","Apply higher-precedence operators","Apply remaining operators"]},
    {type:"explore",clues:["Find the symbol for equality","Find the symbol for multiplication","Find the logical AND"],answer:"operator"},
    {type:"speed",questions:["3+2*2 = ?","What tests equality?","What does * mean?","What does > test?"],answers:["7","==","multiplication","greater than"]}
  ],
  conditions:[
    {type:"quiz",prompt:"What does an if statement primarily do?",answer:"Choose a branch based on a condition",options:["Choose a branch based on a condition","Repeat forever","Store text","Create a database"],hint:"It makes a decision."},
    {type:"flashcards",front:"Why use else?",back:"To define what should happen when the preceding condition is false."},
    {type:"puzzle",prompt:"Build a decision",pieces:["evaluate condition","choose true branch","otherwise choose false branch"],answer:["evaluate condition","choose true branch","otherwise choose false branch"]},
    {type:"scenario",prompt:"A user is 20. Which branch should run for age >= 18?",options:["The adult branch","The minor branch","Both branches","Neither"],answer:"The adult branch"},
    {type:"match",pairs:[["if","tests a condition"],["else","fallback branch"],["condition","true/false expression"],["branch","selected path"]]},
    {type:"sequence",steps:["Evaluate condition","If true run first branch","Otherwise run fallback","Continue after the decision"],answer:["Evaluate condition","If true run first branch","Otherwise run fallback","Continue after the decision"]},
    {type:"explore",clues:["Find the fork in the path","Inspect the true route","Inspect the fallback route"],answer:"branch"},
    {type:"speed",questions:["What makes a branch?","False branch keyword?","A condition usually becomes?","if chooses between what?"],answers:["condition","else","true/false","paths"]}
  ],
  loops:[
    {type:"quiz",prompt:"What prevents a counter-controlled loop from running forever?",answer:"The condition eventually becomes false",options:["The condition eventually becomes false","Adding more comments","Renaming the counter","Using a longer variable name"],hint:"Something must move the loop toward its exit."},
    {type:"flashcards",front:"What is the loop update?",back:"The step that changes the loop state so the next condition check can eventually stop the loop."},
    {type:"puzzle",prompt:"Repair a loop",pieces:["initialize counter","check condition","run body","update counter"],answer:["initialize counter","check condition","run body","update counter"]},
    {type:"scenario",prompt:"A while loop never ends because i never changes. What is the likely fix?",options:["Update i inside the loop","Remove the condition","Add another variable with no change","Print more text"],answer:"Update i inside the loop"},
    {type:"match",pairs:[["Initialization","Sets the starting state"],["Condition","Decides whether to continue"],["Body","Work repeated each pass"],["Update","Moves toward termination"]]},
    {type:"sequence",steps:["Initialize i","Check i against the condition","Run the body","Update i","Repeat the check"],answer:["Initialize i","Check i against the condition","Run the body","Update i","Repeat the check"]},
    {type:"explore",clues:["Find the repeating path","Locate the exit condition","Find the counter update"],answer:"loop"},
    {type:"speed",questions:["What must change to stop a counter loop?","What part repeats?","What decides another pass?","What starts the counter?"],answers:["state","body","condition","initialization"]}
  ],
  functions:[
    {type:"quiz",prompt:"Why create a function?",answer:"To package reusable behavior",options:["To package reusable behavior","To make every line global","To remove all variables","To prevent reuse"],hint:"Think reusable logic."},
    {type:"flashcards",front:"What is a function call?",back:"The action of invoking a function so its body executes."},
    {type:"puzzle",prompt:"Build a reusable function",pieces:["define the function","name parameters","write the body","call it"],answer:["define the function","name parameters","write the body","call it"]},
    {type:"scenario",prompt:"The same calculation appears five times. What is a good design?",options:["Put the calculation in a reusable function","Copy it five more times","Delete the calculation","Hide it in a comment"],answer:"Put the calculation in a reusable function"},
    {type:"match",pairs:[["Definition","Describes the function"],["Call","Invokes it"],["Body","Reusable steps"],["Return","Sends a result back"]]},
    {type:"sequence",steps:["Define function","Write body","Call function","Use result"],answer:["Define function","Write body","Call function","Use result"]},
    {type:"explore",clues:["Find the reusable block","Inspect its name","Trigger it with a call"],answer:"function"},
    {type:"speed",questions:["What invokes a function?","Where do reusable steps live?","Can functions return values?","Why use functions?"],answers:["call","body","yes","reuse"]}
  ],
  parameters:[
    {type:"quiz",prompt:"A parameter is best described as...",answer:"A named input in a function definition",options:["A named input in a function definition","Only the returned value","A syntax error","A loop counter"],hint:"Arguments are the values passed into those names."},
    {type:"flashcards",front:"Parameter vs argument?",back:"A parameter is the name in the definition; an argument is the value supplied at the call."},
    {type:"puzzle",prompt:"Connect a call to a parameter",pieces:["define parameter","pass argument","bind value","use inside function"],answer:["define parameter","pass argument","bind value","use inside function"]},
    {type:"scenario",prompt:"greet(name) is called as greet('Maya'). What is 'Maya'?",options:["Argument","Parameter","Return","Condition"],answer:"Argument"},
    {type:"match",pairs:[["Parameter","Name in definition"],["Argument","Value at call"],["Default","Fallback input"],["Signature","Function input/output shape"]]},
    {type:"sequence",steps:["Define parameter","Call function","Pass argument","Use bound value"],answer:["Define parameter","Call function","Pass argument","Use bound value"]},
    {type:"explore",clues:["Find the name inside parentheses in the definition","Find the value at the call","Follow the value into the body"],answer:"parameter"},
    {type:"speed",questions:["Value at a call is?","Name in definition is?","Can a function have many parameters?","What is a default?"],answers:["argument","parameter","yes","fallback"]}
  ],
  returns:[
    {type:"quiz",prompt:"What does return do?",answer:"Sends a value back to the caller",options:["Sends a value back to the caller","Starts a loop","Declares a variable only","Deletes the function"],hint:"Think of the caller receiving a result."},
    {type:"flashcards",front:"Why store a returned value?",back:"So the caller can use the function's computed result in later work."},
    {type:"puzzle",prompt:"Build a return flow",pieces:["call function","execute body","compute result","return value","use result"],answer:["call function","execute body","compute result","return value","use result"]},
    {type:"scenario",prompt:"A function calculates total. What lets the caller store that total?",options:["A returned value","A comment","A loop condition","A variable name alone"],answer:"A returned value"},
    {type:"match",pairs:[["Return","Sends result"],["Caller","Uses function"],["Result","Computed value"],["Composition","Using one result in another operation"]]},
    {type:"sequence",steps:["Call function","Run body","Compute result","Return result","Use result"],answer:["Call function","Run body","Compute result","Return result","Use result"]},
    {type:"explore",clues:["Find the exit carrying a value","Follow the result back to the caller","Locate where it is stored"],answer:"return"},
    {type:"speed",questions:["What sends a result?","Who receives it?","Can a function return text?","Can a return value be used in another expression?"],answers:["return","caller","yes","yes"]}
  ]
};

export const WORLD_DEFS = DEMO_SYLLABUS.units.flatMap(u=>u.topics.map((t,i)=>({
  ...t, unitId:u.id, unitName:u.name, games:["quiz","flashcards","puzzle","scenario","match","sequence","explore","speed"]
})));

export const GAME_LABELS = {quiz:"Quiz",flashcards:"Flashcards",puzzle:"Puzzle",scenario:"Scenario Mission",match:"Match & Sort",sequence:"Sequence / Build",explore:"Exploration Mission",speed:"Speed Run"};
export const GAME_ICONS = {quiz:"◈",flashcards:"◇",puzzle:"⬡",scenario:"◉",match:"⇄",sequence:"☷",explore:"⌖",speed:"⚡"};
export const GAME_ORDER = Object.keys(GAME_LABELS);

export function generateDynamicTopicGames(topicName = 'Topic', subject = 'Learning Space') {
  const name = topicName || 'Concept';
  const tid = name.toLowerCase().replace(/\W+/g, '-');

  // Web Technologies Topic Question Bank
  if (tid.includes('servlet-architecture') || tid.includes('servlet') || name.toLowerCase().includes('servlet')) {
    if (tid.includes('session') || tid.includes('cookie') || name.toLowerCase().includes('session')) {
      return [
        { type: "quiz", prompt: "Which Java Servlet interface is used to track session state across multiple HTTP requests on the server?", answer: "HttpSession", options: ["HttpSession", "Cookie API", "HttpServletRequest", "ServletConfig"], hint: "Access via request.getSession()." },
        { type: "flashcards", front: "What is the role of Cookies in session tracking?", back: "Cookies store small key-value session tokens on the client browser." },
        { type: "puzzle", prompt: "Order the Session Handling mechanism", pieces: ["Client sends HTTP Request", "Container checks JSESSIONID cookie", "Container retrieves or creates HttpSession", "Server stores user state attributes"], answer: ["Client sends HTTP Request", "Container checks JSESSIONID cookie", "Container retrieves or creates HttpSession", "Server stores user state attributes"] },
        { type: "scenario", prompt: "A web application requires user login persistence even if cookies are disabled in the browser. Which mechanism should be used?", options: ["URL Rewriting with encodeURL()", "Rely on client cookies", "Store in plain HTML comments", "Use local file storage"], answer: "URL Rewriting with encodeURL()" },
        { type: "match", pairs: [["HttpSession", "Server-side session object"], ["Cookie", "Client-side text token"], ["URL Rewriting", "Appends session ID to URL link"], ["Hidden Form Fields", "Passes state via form inputs"]] },
        { type: "sequence", steps: ["Create Session", "Set Session Attributes", "Validate Session ID", "Invalidate Session on Logout"], answer: ["Create Session", "Set Session Attributes", "Validate Session ID", "Invalidate Session on Logout"] },
        { type: "explore", clues: ["Inspect HTTP Headers", "Locate JSESSIONID", "Verify session timeout"], answer: "httpsession" },
        { type: "speed", questions: ["Does HttpSession store data on server?", "Is cookie stored on client?", "Does URL rewriting append session ID?"], answers: ["yes", "yes", "yes"] }
      ];
    }

    return [
      { type: "quiz", prompt: "Which method in the Servlet lifecycle is invoked exactly once by the container when the servlet is initialized?", answer: "init()", options: ["init()", "service()", "doGet()", "destroy()"], hint: "Called during servlet initialization." },
      { type: "flashcards", front: "What does the service() method do in a Java Servlet?", back: "service() receives client HTTP requests and dispatches them to doGet(), doPost(), etc." },
      { type: "puzzle", prompt: "Order the Java Servlet Life Cycle:", pieces: ["Servlet class loaded & instantiated", "init() method called once", "service() handles incoming requests", "destroy() method invoked before termination"], answer: ["Servlet class loaded & instantiated", "init() method called once", "service() handles incoming requests", "destroy() method invoked before termination"] },
      { type: "scenario", prompt: "Your Servlet needs to open a database connection pool only once when the server boots. Where should this code go?", options: ["Inside the init() method", "Inside the service() method", "Inside the destroy() method", "In a scriptlet inside HTML"], answer: "Inside the init() method" },
      { type: "match", pairs: [["init()", "One-time initialization"], ["service()", "Dispatches GET/POST requests"], ["destroy()", "Cleanup before garbage collection"], ["HttpServletRequest", "Encapsulates client HTTP request"]] },
      { type: "sequence", steps: ["Instantiate Servlet", "Invoke init()", "Invoke service() for requests", "Invoke destroy() on shutdown"], answer: ["Instantiate Servlet", "Invoke init()", "Invoke service() for requests", "Invoke destroy() on shutdown"] },
      { type: "explore", clues: ["Locate ServletConfig", "Inspect init() method", "Trace service() request dispatch"], answer: "servlet" },
      { type: "speed", questions: ["Is init() called once?", "Does service() handle requests?", "Is destroy() called at termination?"], answers: ["yes", "yes", "yes"] }
    ];
  }

  if (tid.includes('jdbc') || name.toLowerCase().includes('jdbc')) {
    return [
      { type: "quiz", prompt: "Which JDBC interface is used to execute precompiled SQL queries with parameterized inputs safely?", answer: "PreparedStatement", options: ["PreparedStatement", "Statement", "CallableStatement", "ResultSet"], hint: "Prevents SQL injection attacks." },
      { type: "flashcards", front: "How is a database connection established in JDBC?", back: "DriverManager.getConnection(url, user, password) returns a Connection object." },
      { type: "puzzle", prompt: "Order the standard JDBC database pipeline:", pieces: ["Load JDBC Driver", "Establish Connection via DriverManager", "Create PreparedStatement", "Execute query & read ResultSet", "Close Connection & Statement"], answer: ["Load JDBC Driver", "Establish Connection via DriverManager", "Create PreparedStatement", "Execute query & read ResultSet", "Close Connection & Statement"] },
      { type: "scenario", prompt: "A web form accepts user input for a database search query. Which approach prevents SQL injection attacks?", options: ["Use PreparedStatement with parameterized ? placeholders", "Concatenate strings directly into SQL statement", "Remove quotes from user input manually", "Execute raw query via Statement"], answer: "Use PreparedStatement with parameterized ? placeholders" },
      { type: "match", pairs: [["DriverManager", "Manages database drivers"], ["Connection", "Database session interface"], ["PreparedStatement", "Precompiled parameterized SQL query"], ["ResultSet", "Cursor over query result rows"]] },
      { type: "sequence", steps: ["Connect to Database", "Prepare SQL Query", "Bind Input Parameters", "Execute Query", "Process ResultSet"], answer: ["Connect to Database", "Prepare SQL Query", "Bind Input Parameters", "Execute Query", "Process ResultSet"] },
      { type: "explore", clues: ["Find JDBC URL string", "Locate PreparedStatement", "Verify ResultSet iterations"], answer: "jdbc" },
      { type: "speed", questions: ["Does PreparedStatement prevent SQL injection?", "Does ResultSet hold query rows?", "Does DriverManager return Connection?"], answers: ["yes", "yes", "yes"] }
    ];
  }

  if (tid.includes('react') || name.toLowerCase().includes('react') || name.toLowerCase().includes('jsx')) {
    return [
      { type: "quiz", prompt: "In ReactJS, what syntax extension allows writing HTML-like markup directly inside JavaScript components?", answer: "JSX", options: ["JSX", "TypeScript", "XSLT", "DOMParser"], hint: "JavaScript XML." },
      { type: "flashcards", front: "What are props in React?", back: "Props are read-only properties passed from a parent component to a child component." },
      { type: "puzzle", prompt: "Arrange React Component Lifecycle rendering:", pieces: ["Component instantiated with props", "Initial render returns JSX", "DOM nodes mounted to Virtual DOM", "State update triggers re-render"], answer: ["Component instantiated with props", "Initial render returns JSX", "DOM nodes mounted to Virtual DOM", "State update triggers re-render"] },
      { type: "scenario", prompt: "A React component needs to pass a user object down to a child header component. How should this data be passed?", options: ["Pass as a prop (e.g. user={userData})", "Store in global window variables", "Write to local file system", "Use scriptlet tags"], answer: "Pass as a prop (e.g. user={userData})" },
      { type: "match", pairs: [["JSX", "HTML-like syntax extension"], ["Props", "Read-only component inputs"], ["useState", "Hook for local state management"], ["Virtual DOM", "In-memory DOM representation"]] },
      { type: "sequence", steps: ["Define Component", "Receive Props", "Return JSX", "Mount to DOM"], answer: ["Define Component", "Receive Props", "Return JSX", "Mount to DOM"] },
      { type: "explore", clues: ["Inspect JSX return block", "Locate component props", "Verify state hook update"], answer: "react" },
      { type: "speed", questions: ["Is JSX HTML in JS?", "Are props read-only?", "Does useState manage state?"], answers: ["yes", "yes", "yes"] }
    ];
  }

  if (tid.includes('php') || name.toLowerCase().includes('php')) {
    return [
      { type: "quiz", prompt: "In PHP, which superglobal array variable contains form data submitted via HTTP POST method?", answer: "$_POST", options: ["$_POST", "$_GET", "$_SESSION", "$_FILES"], hint: "Post method array." },
      { type: "flashcards", front: "How do you start a session in PHP?", back: "By calling session_start() at the top of the PHP script." },
      { type: "puzzle", prompt: "Order the PHP Form Validation & Database workflow:", pieces: ["Receive form input via $_POST", "Validate input using regular expressions", "Open MySQL connection via mysqli_connect()", "Execute SQL INSERT/SELECT query", "Close database connection"], answer: ["Receive form input via $_POST", "Validate input using regular expressions", "Open MySQL connection via mysqli_connect()", "Execute SQL INSERT/SELECT query", "Close database connection"] },
      { type: "scenario", prompt: "A PHP script needs to remember logged-in user details across multiple page clicks. Which mechanism is used?", options: ["PHP Sessions with session_start() and $_SESSION", "Re-enter password on every page click", "Pass password in plain URL parameters", "Store in local browser cookies only"], answer: "PHP Sessions with session_start() and $_SESSION" },
      { type: "match", pairs: [["$_POST", "Associative array for POST data"], ["session_start()", "Initializes PHP session"], ["preg_match()", "Performs regex validation"], ["mysqli_connect()", "Establishes MySQL connection"]] },
      { type: "sequence", steps: ["Start Session", "Process Form Input", "Validate Data", "Execute MySQL Query"], answer: ["Start Session", "Process Form Input", "Validate Data", "Execute MySQL Query"] },
      { type: "explore", clues: ["Locate $_POST superglobal", "Find session_start() call", "Verify preg_match regex"], answer: "php" },
      { type: "speed", questions: ["Is $_POST a superglobal?", "Does session_start() start sessions?", "Does preg_match validate regex?"], answers: ["yes", "yes", "yes"] }
    ];
  }

  if (tid.includes('xml') || tid.includes('ajax') || name.toLowerCase().includes('xml') || name.toLowerCase().includes('ajax') || name.toLowerCase().includes('xslt')) {
    return [
      { type: "quiz", prompt: "Which object is traditionally used in JavaScript to initiate asynchronous HTTP requests to a web server without reloading the page?", answer: "XMLHttpRequest", options: ["XMLHttpRequest", "DOMParser", "XSLTProcessor", "FileReader"], hint: "The primary AJAX object." },
      { type: "flashcards", front: "What is XSLT used for?", back: "XSLT (Extensible Stylesheet Language Transformations) transforms XML documents into HTML or other XML structures." },
      { type: "puzzle", prompt: "Arrange the AJAX Client-Server Architecture request flow:", pieces: ["Instantiate XMLHttpRequest object", "Configure open(method, url, true)", "Define onreadystatechange callback handler", "Send request via send()", "Callback processes responseData on status 200"], answer: ["Instantiate XMLHttpRequest object", "Configure open(method, url, true)", "Define onreadystatechange callback handler", "Send request via send()", "Callback processes responseData on status 200"] },
      { type: "scenario", prompt: "A web page needs to fetch dynamic XML data from the server and render it on screen without reloading the browser. What technology enables this?", options: ["AJAX with XMLHttpRequest", "Synchronous HTTP page submit", "Plain CSS rules", "Static DTD files"], answer: "AJAX with XMLHttpRequest" },
      { type: "match", pairs: [["XMLHttpRequest", "Initiates asynchronous requests"], ["DTD", "Defines XML document structure"], ["XSLT", "Transforms XML to HTML"], ["XML Schema (XSD)", "Validates XML datatypes"]] },
      { type: "sequence", steps: ["Create XMLHttpRequest", "Open Request Connection", "Send Asynchronous Request", "Handle Server Response"], answer: ["Create XMLHttpRequest", "Open Request Connection", "Send Asynchronous Request", "Handle Server Response"] },
      { type: "explore", clues: ["Locate XMLHttpRequest object", "Find XSLT transform template", "Verify readyState status 200"], answer: "ajax" },
      { type: "speed", questions: ["Does AJAX update pages without reload?", "Does XSLT transform XML to HTML?", "Is readyState 4 completed?"], answers: ["yes", "yes", "yes"] }
    ];
  }

  // General Dynamic Fallback
  return [
    {
      type: "quiz",
      prompt: `Which statement best describes ${name}?`,
      answer: `A core technique and model for reasoning about ${name} in ${subject}`,
      options: [
        `A core technique and model for reasoning about ${name} in ${subject}`,
        `An obsolete syntax label`,
        `A system error code`,
        `A comment line with no analytical value`
      ],
      hint: `Focus on how ${name} contributes to problem solving in ${subject}.`
    },
    {
      type: "flashcards",
      front: `What is the core objective of ${name}?`,
      back: `${name} provides the domain-specific logic and methodology for evaluating ${subject} data.`
    },
    {
      type: "puzzle",
      prompt: `Construct the implementation pipeline for ${name}`,
      pieces: [
        `Formulate problem input`,
        `Apply ${name} transformation`,
        `Evaluate metric / output`
      ],
      answer: [
        `Formulate problem input`,
        `Apply ${name} transformation`,
        `Evaluate metric / output`
      ]
    },
    {
      type: "scenario",
      prompt: `A system uses ${name} to solve complex domain tasks. Which decision ensures robust results?`,
      options: [
        `Validate ${name} outputs against ground-truth evaluation metrics`,
        `Randomly alter parameters without testing`,
        `Skip data validation entirely`,
        `Disable error metrics during execution`
      ],
      answer: `Validate ${name} outputs against ground-truth evaluation metrics`
    },
    {
      type: "match",
      pairs: [
        [`${name} Definition`, `Core concept of ${name}`],
        [`Input Features`, `Data provided to ${name}`],
        [`Objective Function`, `Measures target performance`],
        [`Evaluation Metric`, `Assesses output accuracy`]
      ]
    },
    {
      type: "sequence",
      steps: [
        `Initialize ${name} parameters`,
        `Process input dataset`,
        `Calculate loss or accuracy metric`,
        `Refine ${name} parameters`
      ],
      answer: [
        `Initialize ${name} parameters`,
        `Process input dataset`,
        `Calculate loss or accuracy metric`,
        `Refine ${name} parameters`
      ]
    },
    {
      type: "explore",
      clues: [
        `Identify ${name} inputs`,
        `Locate objective function`,
        `Inspect target predictions`
      ],
      answer: name.toLowerCase()
    },
    {
      type: "speed",
      questions: [
        `Does ${name} handle complex domain patterns?`,
        `What metric evaluates ${name}?`,
        `Is validation required for ${name}?`
      ],
      answers: ['yes', 'accuracy', 'yes']
    }
  ];
}

export function worldGames(topicId, topicName = '', subject = '') {
  if (generic[topicId]) return generic[topicId];
  const name = topicName || topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return generateDynamicTopicGames(name, subject);
}

export function makeWorlds(units, spaceName = 'Learning Space') {
  return units.flatMap((u, ui) => u.topics.map((t, ti) => ({
    ...t,
    topicId: t.id || t.name.toLowerCase().replace(/\W+/g, '-'),
    unitId: u.id,
    unitName: u.name,
    order: ui * 100 + ti,
    games: GAME_ORDER,
    mastery: 0,
    completedGames: [],
    history: [],
    unlocked: ui === 0 && ti === 0
  })));
}


