/* ============================ CONTENT BANK ============================ */
/* Subject -> Topic -> Skill -> Challenge (mcq | scenario | sequence | matching | speed) */

const SUBJECTS = {
  programming: {
    name:"Programming", topic:"Control & Logic",
    regions:[
      {id:"r1", name:"Foundation Valley", blurb:"Where every program begins.", skills:["p_var"]},
      {id:"r2", name:"Skill Forest", blurb:"Loops twist, conditions branch.", skills:["p_loop","p_fn"]},
      {id:"r3", name:"Challenge Citadel", blurb:"The Bug Sovereign waits.", boss:true}
    ],
    skills:{
      p_var:{name:"Variables"}, p_loop:{name:"Loops"}, p_fn:{name:"Functions"}
    }
  },
  math: {
    name:"Mathematics", topic:"Number & Structure",
    regions:[
      {id:"r1", name:"Foundation Valley", blurb:"Parts of a whole.", skills:["m_frac"]},
      {id:"r2", name:"Skill Forest", blurb:"Balance both sides.", skills:["m_alg","m_geo"]},
      {id:"r3", name:"Challenge Citadel", blurb:"The Equation Warden waits.", boss:true}
    ],
    skills:{ m_frac:{name:"Fractions"}, m_alg:{name:"Algebra"}, m_geo:{name:"Geometry"} }
  },
  science: {
    name:"Science", topic:"Matter & Motion",
    regions:[
      {id:"r1", name:"Foundation Valley", blurb:"Solid, liquid, gas.", skills:["s_mat"]},
      {id:"r2", name:"Skill Forest", blurb:"Push, pull, resist.", skills:["s_force","s_eco"]},
      {id:"r3", name:"Challenge Citadel", blurb:"The Entropy Beast waits.", boss:true}
    ],
    skills:{ s_mat:{name:"States of Matter"}, s_force:{name:"Forces"}, s_eco:{name:"Ecosystems"} }
  }
};

const C = (id,skill,diff,type,o)=>Object.assign({id,skill,diff,type},o);

const CHALLENGES = [
  /* ---------- PROGRAMMING: Variables ---------- */
  C("pv1","p_var",1,"mcq",{prompt:"A variable stores the value 7. What is it mainly used for?",
    hint:"Think of a labelled box.",
    options:[{t:"Holding a value under a name so it can be reused",ok:true},{t:"Printing text to the screen",mis:"output"},{t:"Repeating an action many times",mis:"loop"},{t:"Styling the page",mis:"ui"}],
    explain:"A variable is a named place to keep a value you will use again."}),
  C("pv2","p_var",2,"mcq",{prompt:"count = 5; count = count + 3; What is count now?",
    hint:"The right side is calculated first, then stored back.",
    options:[{t:"8",ok:true},{t:"5",mis:"noassign"},{t:"3",mis:"noassign"},{t:"53",mis:"concat"}],
    explain:"5 + 3 is calculated first, then written back into count."}),
  C("pv3","p_var",2,"scenario",{story:"Your teammate's score tracker always shows 0 at the end of the game, even after points are added.",
    prompt:"Which fix is most likely correct?",
    hint:"Where is the variable being created?",
    options:[{t:"The score variable is reset to 0 inside the loop instead of before it",ok:true},{t:"Rename the variable to 'points'",mis:"surface"},{t:"Add more print statements",mis:"surface"},{t:"Make the score a decimal",mis:"surface"}],
    explain:"Re-declaring inside the loop wipes the value on every pass."}),
  C("pv4","p_var",3,"sequence",{prompt:"Order the steps to safely swap two variables using a temporary one.",
    hint:"Save one value before you overwrite it.",
    seq:["Store a in temp","Copy b into a","Copy temp into b","Discard temp"],
    explain:"Save first, overwrite second, restore third."}),

  /* ---------- PROGRAMMING: Loops ---------- */
  C("pl1","p_loop",1,"mcq",{prompt:"for i in 1..5 prints i. How many numbers are printed?",
    hint:"Count 1,2,3,4,5.",
    options:[{t:"5",ok:true},{t:"4",mis:"offbyone"},{t:"6",mis:"offbyone"},{t:"1",mis:"nores"}],
    explain:"The range 1 to 5 inclusive prints five values."}),
  C("pl2","p_loop",2,"mcq",{prompt:"i = 0; while i < 3: print(i). What is wrong?",
    hint:"What changes i?",
    options:[{t:"i is never increased, so the loop never ends",ok:true},{t:"It prints 0,1,2 correctly",mis:"noinc"},{t:"while cannot print",mis:"syntax"},{t:"i should start at 1",mis:"offbyone"}],
    explain:"Without i = i + 1 the condition stays true forever."}),
  C("pl3","p_loop",2,"scenario",{story:"A loop is meant to print 3 rows but prints 4. The counter starts at 0 and the condition is i <= 3.",
    prompt:"What is happening?",
    hint:"Count the values i actually takes.",
    options:[{t:"i takes 0,1,2,3 — one extra pass, an off-by-one error",ok:true},{t:"The printer is slow",mis:"surface"},{t:"Loops always run one extra time",mis:"myth"},{t:"The condition should be i >= 3",mis:"reverse"}],
    explain:"Starting at 0 with <= 3 gives four passes. Use i < 3."}),
  C("pl4","p_loop",3,"sequence",{prompt:"Order the phases of one pass through a counted loop.",
    hint:"Check before you act.",
    seq:["Check the loop condition","Run the loop body","Update the counter","Return to the condition"],
    explain:"Condition, body, update, repeat."}),

  /* ---------- PROGRAMMING: Functions ---------- */
  C("pf1","p_fn",1,"mcq",{prompt:"What does a function mainly give you?",
    hint:"Write once, use often.",
    options:[{t:"A reusable named block of steps",ok:true},{t:"A faster computer",mis:"myth"},{t:"A new variable type",mis:"conflate"},{t:"Automatic error fixing",mis:"myth"}],
    explain:"Functions package steps under a name so you can reuse them."}),
  C("pf2","p_fn",2,"mcq",{prompt:"A function calculates a total but the caller always sees nothing. What is missing?",
    hint:"Calculating is not the same as handing back.",
    options:[{t:"A return statement",ok:true},{t:"A longer name",mis:"surface"},{t:"An extra loop",mis:"surface"},{t:"More parameters",mis:"surface"}],
    explain:"Without return, the computed value never leaves the function."}),
  C("pf3","p_fn",2,"scenario",{story:"Two teammates wrote the same 20 lines of discount logic in four different places. A rule changed and only two places were updated.",
    prompt:"What should they do?",
    hint:"One source of truth.",
    options:[{t:"Extract the logic into one function and call it in all four places",ok:true},{t:"Copy the new version into the other two places",mis:"duplicate"},{t:"Add comments warning about the duplicates",mis:"surface"},{t:"Delete two of the places",mis:"surface"}],
    explain:"One function, four calls: the rule then changes in exactly one place."}),
  C("pf4","p_fn",3,"sequence",{prompt:"Order what happens when a function is called.",
    hint:"Values go in before work starts.",
    seq:["Arguments are evaluated","Parameters receive the values","The body runs","A value is returned to the caller"],
    explain:"Evaluate, bind, run, return."}),

  /* ---------- MATH: Fractions ---------- */
  C("mf1","m_frac",1,"mcq",{prompt:"Which fraction is equal to 1/2?",hint:"Double top and bottom.",
    options:[{t:"3/6",ok:true},{t:"2/5",mis:"nearby"},{t:"1/3",mis:"nearby"},{t:"2/2",mis:"whole"}],
    explain:"3/6 simplifies to 1/2."}),
  C("mf2","m_frac",2,"mcq",{prompt:"1/4 + 1/2 = ?",hint:"Make the denominators match first.",
    options:[{t:"3/4",ok:true},{t:"2/6",mis:"addboth"},{t:"1/6",mis:"addboth"},{t:"2/4",mis:"partial"}],
    explain:"1/2 is 2/4, so 1/4 + 2/4 = 3/4. Never add denominators."}),
  C("mf3","m_frac",2,"scenario",{story:"A pizza is cut into 8 slices. You eat 2, a friend eats 3.",
    prompt:"What fraction of the pizza is left, in simplest form?",hint:"Slices eaten out of 8, then simplify.",
    options:[{t:"3/8",ok:true},{t:"5/8",mis:"eaten"},{t:"3/16",mis:"addboth"},{t:"1/3",mis:"nearby"}],
    explain:"5 of 8 slices are gone, so 3/8 remains."}),
  C("mf4","m_frac",3,"sequence",{prompt:"Order the steps to add two fractions with different denominators.",
    hint:"Common ground first.",
    seq:["Find a common denominator","Rewrite both fractions","Add the numerators","Simplify the result"],
    explain:"Common denominator, rewrite, add tops, simplify."}),

  /* ---------- MATH: Algebra ---------- */
  C("ma1","m_alg",1,"mcq",{prompt:"Solve: x + 4 = 9",hint:"Undo the +4.",
    options:[{t:"5",ok:true},{t:"13",mis:"addboth"},{t:"4",mis:"nearby"},{t:"9",mis:"nores"}],
    explain:"Subtract 4 from both sides."}),
  C("ma2","m_alg",2,"mcq",{prompt:"Solve: 3x - 6 = 12",hint:"Add 6 first, then divide.",
    options:[{t:"6",ok:true},{t:"2",mis:"orderops"},{t:"18",mis:"orderops"},{t:"4",mis:"nearby"}],
    explain:"3x = 18, so x = 6."}),
  C("ma3","m_alg",2,"scenario",{story:"A taxi charges a flat 30 plus 12 per km. A ride cost 102.",
    prompt:"Which equation finds the distance d?",hint:"Flat fee is added once.",
    options:[{t:"30 + 12d = 102",ok:true},{t:"30d + 12 = 102",mis:"swap"},{t:"42d = 102",mis:"merge"},{t:"12d - 30 = 102",mis:"sign"}],
    explain:"The flat fee is a constant; the per-km rate multiplies distance."}),
  C("ma4","m_alg",3,"sequence",{prompt:"Order the steps to solve 2(x + 3) = 16.",hint:"Open the bracket first.",
    seq:["Expand to 2x + 6 = 16","Subtract 6 from both sides","Divide both sides by 2","State x = 5"],
    explain:"Expand, isolate, divide, answer."}),

  /* ---------- MATH: Geometry ---------- */
  C("mg1","m_geo",1,"mcq",{prompt:"How many degrees are in a triangle's interior angles?",hint:"Half of a full turn.",
    options:[{t:"180",ok:true},{t:"360",mis:"quad"},{t:"90",mis:"right"},{t:"270",mis:"nearby"}],
    explain:"Any triangle's angles sum to 180 degrees."}),
  C("mg2","m_geo",2,"mcq",{prompt:"A rectangle is 6 by 4. What is its perimeter?",hint:"Perimeter is distance around, not space inside.",
    options:[{t:"20",ok:true},{t:"24",mis:"area"},{t:"10",mis:"halfperim"},{t:"12",mis:"nearby"}],
    explain:"2 x (6 + 4) = 20. 24 would be the area."}),
  C("mg3","m_geo",2,"scenario",{story:"You are fencing a 6m by 4m garden and buying 24m of fence.",
    prompt:"What happens?",hint:"Compare fence length with perimeter.",
    options:[{t:"You have 4m spare — the perimeter is only 20m",ok:true},{t:"It fits exactly",mis:"area"},{t:"You are 4m short",mis:"sign"},{t:"You need 48m",mis:"double"}],
    explain:"Fencing follows the perimeter (20m), not the area (24 sq m)."}),
  C("mg4","m_geo",3,"sequence",{prompt:"Order the steps to find the area of a composite L-shape.",hint:"Break it apart first.",
    seq:["Split the shape into rectangles","Measure each rectangle's sides","Find each area","Add the areas together"],
    explain:"Split, measure, compute, combine."}),

  /* ---------- SCIENCE: States of Matter ---------- */
  C("sm1","s_mat",1,"mcq",{prompt:"Which state has a fixed volume but takes the shape of its container?",hint:"Pour it.",
    options:[{t:"Liquid",ok:true},{t:"Solid",mis:"solid"},{t:"Gas",mis:"gas"},{t:"Plasma",mis:"gas"}],
    explain:"Liquids keep volume, lose shape."}),
  C("sm2","s_mat",2,"mcq",{prompt:"Ice melts at 0C. What happens to the temperature while it is melting?",hint:"Energy goes into breaking bonds.",
    options:[{t:"It stays at 0C until all the ice has melted",ok:true},{t:"It rises steadily",mis:"linear"},{t:"It drops",mis:"reverse"},{t:"It jumps to 100C",mis:"boil"}],
    explain:"During a phase change the energy breaks bonds, not raising temperature."}),
  C("sm3","s_mat",2,"scenario",{story:"A sealed bottle of air is left in a hot car and the plastic bulges outward.",
    prompt:"Best explanation?",hint:"Same particles, more energy.",
    options:[{t:"The gas particles move faster and push harder on the walls",ok:true},{t:"New air was created inside",mis:"conserve"},{t:"The plastic absorbed water",mis:"surface"},{t:"Gas turned into liquid",mis:"phase"}],
    explain:"Heat raises particle speed, raising pressure. No new matter appears."}),
  C("sm4","s_mat",3,"sequence",{prompt:"Order what happens as ice is heated to steam.",hint:"Two flat stretches on the graph.",
    seq:["Ice warms to 0C","Ice melts to water","Water warms to 100C","Water boils to steam"],
    explain:"Warm, melt, warm, boil."}),

  /* ---------- SCIENCE: Forces ---------- */
  C("sf1","s_force",1,"mcq",{prompt:"A book rests on a table. Which forces are balanced?",hint:"Nothing is accelerating.",
    options:[{t:"Gravity down and the table's support force up",ok:true},{t:"Only gravity acts",mis:"onef"},{t:"No forces act at all",mis:"nof"},{t:"Friction and magnetism",mis:"random"}],
    explain:"At rest, downward weight and upward normal force cancel."}),
  C("sf2","s_force",2,"mcq",{prompt:"A puck slides on frictionless ice at steady speed. What force keeps it moving?",hint:"Motion needs no cause; change does.",
    options:[{t:"None — it continues because nothing slows it",ok:true},{t:"A forward force from the push",mis:"impetus"},{t:"Gravity pushes it forward",mis:"gravity"},{t:"Air pushes it along",mis:"impetus"}],
    explain:"Constant velocity needs zero net force. This is the classic impetus misconception."}),
  C("sf3","s_force",2,"scenario",{story:"A cyclist stops pedalling on a flat road and gradually slows to a stop.",
    prompt:"What best explains the slowing?",hint:"What opposes motion?",
    options:[{t:"Friction and air resistance act backwards on the bike",ok:true},{t:"The bike runs out of forward force",mis:"impetus"},{t:"Gravity pulls it backwards",mis:"gravity"},{t:"The wheels lose their energy store",mis:"impetus"}],
    explain:"Resistive forces decelerate it — motion itself needs no fuel."}),
  C("sf4","s_force",3,"sequence",{prompt:"Order the steps to analyse a force problem.",hint:"Draw before you calculate.",
    seq:["Identify the object","Draw all forces acting on it","Find the net force","Apply F = ma"],
    explain:"Object, forces, net, acceleration."}),

  /* ---------- SCIENCE: Ecosystems ---------- */
  C("se1","s_eco",1,"mcq",{prompt:"In a food chain, what is a producer?",hint:"It makes its own food.",
    options:[{t:"An organism that makes food using sunlight",ok:true},{t:"The top predator",mis:"top"},{t:"An organism that eats plants",mis:"consumer"},{t:"A decomposer",mis:"decomp"}],
    explain:"Producers convert light energy into food."}),
  C("se2","s_eco",2,"mcq",{prompt:"If all the frogs in a pond disappear, what is the most likely immediate effect?",hint:"Look one step each way.",
    options:[{t:"Insect numbers rise and frog predators decline",ok:true},{t:"Nothing changes",mis:"isolate"},{t:"Only plants are affected",mis:"isolate"},{t:"Insects disappear too",mis:"reverse"}],
    explain:"Removing a link affects both the level below and above."}),
  C("se3","s_eco",2,"scenario",{story:"A farm sprays pesticide. Months later, bird numbers fall sharply though birds were never sprayed.",
    prompt:"Best explanation?",hint:"Follow the food.",
    options:[{t:"The chemical moved up the food chain through the insects birds eat",ok:true},{t:"Birds dislike the smell",mis:"surface"},{t:"Coincidence, ecosystems are independent",mis:"isolate"},{t:"Birds became producers",mis:"random"}],
    explain:"Substances accumulate along feeding relationships."}),
  C("se4","s_eco",3,"sequence",{prompt:"Order energy flow through an ecosystem.",hint:"Start with the sun.",
    seq:["Sunlight reaches producers","Herbivores eat producers","Predators eat herbivores","Decomposers recycle nutrients"],
    explain:"Producers, herbivores, predators, decomposers."}),

  /* ---------- MATCHING (guided, used for recovery) ---------- */
  C("pv5","p_var",2,"matching",{prompt:"Match each variable idea to what it does.",hint:"Read the right column first.",
    pairs:[["Declaration","Creates the name for the first time"],["Assignment","Stores a new value in an existing name"],["Scope","Where the name can be seen"],["Initial value","What the name holds before any change"]],
    explain:"Declaring, assigning and scope are separate ideas."}),
  C("pl5","p_loop",2,"matching",{prompt:"Match each loop part to its job.",hint:"One part decides, one part moves.",
    pairs:[["Counter start","Sets where the loop begins"],["Condition","Decides whether to run again"],["Update","Moves the counter forward"],["Body","The work done each pass"]],
    explain:"A loop is start, condition, body, update — the missing update causes infinite loops."}),
  C("pf5","p_fn",2,"matching",{prompt:"Match each function term to its meaning.",hint:"Arguments go in, returns come out.",
    pairs:[["Parameter","The name listed in the definition"],["Argument","The value passed at the call"],["Return","The value handed back to the caller"],["Call","The moment the body runs"]],
    explain:"Parameters are names; arguments are values."}),
  C("mf5","m_frac",2,"matching",{prompt:"Match each fraction to its equal value.",hint:"Simplify each one.",
    pairs:[["2/4","one half"],["3/9","one third"],["6/8","three quarters"],["5/5","one whole"]],
    explain:"Divide top and bottom by the same number to simplify."}),
  C("ma5","m_alg",2,"matching",{prompt:"Match each equation to its solution.",hint:"Undo the operation on x.",
    pairs:[["x + 7 = 10","x = 3"],["4x = 20","x = 5"],["x - 2 = 6","x = 8"],["x / 3 = 4","x = 12"]],
    explain:"Always apply the inverse operation to both sides."}),
  C("mg5","m_geo",2,"matching",{prompt:"Match each measurement to what it describes.",hint:"Around, inside, or turning.",
    pairs:[["Perimeter","Distance around the edge"],["Area","Space covered inside"],["Angle","Amount of turn between two lines"],["Diameter","A line across a circle through its centre"]],
    explain:"Perimeter is a length; area is a surface."}),
  C("sm5","s_mat",2,"matching",{prompt:"Match each state or change to its description.",hint:"Track shape and volume.",
    pairs:[["Solid","Fixed shape and fixed volume"],["Liquid","Fixed volume, takes container shape"],["Gas","Fills the whole container"],["Melting","Solid becoming liquid at a fixed temperature"]],
    explain:"Shape and volume tell the states apart."}),
  C("sf5","s_force",2,"matching",{prompt:"Match each force situation to its outcome.",hint:"Balanced means no change in motion.",
    pairs:[["Balanced forces","Speed and direction stay the same"],["Unbalanced forces","The object accelerates"],["Friction","Opposes sliding motion"],["Weight","Pull of gravity on mass"]],
    explain:"Only unbalanced forces change motion."}),
  C("se5","s_eco",2,"matching",{prompt:"Match each role to an example.",hint:"Follow who eats whom.",
    pairs:[["Producer","Grass"],["Herbivore","Rabbit"],["Predator","Fox"],["Decomposer","Fungus"]],
    explain:"Each role sits at a different point in the energy flow."}),

  /* ---------- SPEED (rapid recall, used for ascent) ---------- */
  C("pv6","p_var",3,"speed",{prompt:"Variable rapid round",limit:35,hint:"Read only the operator.",
    items:[{q:"x = 2; x = x * 3. x is?",o:["6","5","23"],ok:0},{q:"Does assignment read right side first?",o:["Yes","No","Only in loops"],ok:0},
      {q:"a = 1; b = a; a = 9. b is?",o:["1","9","0"],ok:0},{q:"A name declared inside a function is visible outside?",o:["No","Yes","Always"],ok:0}],
    explain:"Assignment evaluates the right side, then stores it."}),
  C("pl6","p_loop",3,"speed",{prompt:"Loop rapid round",limit:35,hint:"Count the passes.",
    items:[{q:"for i = 0; i < 4 runs how many times?",o:["4","5","3"],ok:0},{q:"A while with no update does what?",o:["Runs forever","Runs once","Errors"],ok:0},
      {q:"i from 1 to 3 inclusive prints?",o:["3 values","2 values","4 values"],ok:0},{q:"break does what?",o:["Leaves the loop","Skips one pass","Restarts"],ok:0}],
    explain:"Boundaries and the update decide the number of passes."}),
  C("pf6","p_fn",3,"speed",{prompt:"Function rapid round",limit:35,hint:"In, work, out.",
    items:[{q:"No return means the caller gets?",o:["Nothing usable","The last line","An error"],ok:0},{q:"Values passed at a call are?",o:["Arguments","Parameters","Returns"],ok:0},
      {q:"Reusing logic in 4 places is best done by?",o:["One function","Four copies","Comments"],ok:0},{q:"A function can call itself?",o:["Yes","No","Only loops can"],ok:0}],
    explain:"Functions package steps and hand back results."}),
  C("mf6","m_frac",3,"speed",{prompt:"Fraction rapid round",limit:35,hint:"Common denominators first.",
    items:[{q:"1/3 + 1/3 =",o:["2/3","2/6","1/6"],ok:0},{q:"4/8 simplifies to",o:["1/2","2/4","1/4"],ok:0},
      {q:"1/2 of 10 =",o:["5","2","20"],ok:0},{q:"3/4 is bigger than 2/3?",o:["Yes","No","Equal"],ok:0}],
    explain:"Add numerators only once denominators match."}),
  C("ma6","m_alg",3,"speed",{prompt:"Algebra rapid round",limit:35,hint:"Inverse operations.",
    items:[{q:"x + 5 = 12, x =",o:["7","17","5"],ok:0},{q:"2x = 14, x =",o:["7","28","12"],ok:0},
      {q:"x/2 = 6, x =",o:["12","3","8"],ok:0},{q:"3x + 1 = 10, x =",o:["3","11","9"],ok:0}],
    explain:"Undo addition first, then multiplication."}),
  C("mg6","m_geo",3,"speed",{prompt:"Geometry rapid round",limit:35,hint:"Around versus inside.",
    items:[{q:"Square side 5, perimeter =",o:["20","25","10"],ok:0},{q:"Square side 5, area =",o:["25","20","10"],ok:0},
      {q:"Triangle angles sum to",o:["180","360","90"],ok:0},{q:"Rectangle 3x7 area =",o:["21","20","10"],ok:0}],
    explain:"Perimeter adds sides; area multiplies them."}),
  C("sm6","s_mat",3,"speed",{prompt:"Matter rapid round",limit:35,hint:"Shape, volume, energy.",
    items:[{q:"Gas has fixed volume?",o:["No","Yes","Sometimes"],ok:0},{q:"During melting the temperature",o:["Stays constant","Rises","Falls"],ok:0},
      {q:"Heating a gas in a sealed can raises",o:["Pressure","Mass","Volume of particles"],ok:0},{q:"Water boils at",o:["100C","0C","50C"],ok:0}],
    explain:"Phase changes absorb energy without a temperature rise."}),
  C("sf6","s_force",3,"speed",{prompt:"Forces rapid round",limit:35,hint:"Change needs force.",
    items:[{q:"Constant velocity means net force is",o:["Zero","Forward","Backward"],ok:0},{q:"Friction acts",o:["Against motion","With motion","Upward"],ok:0},
      {q:"F = ma links force, mass and",o:["Acceleration","Speed","Distance"],ok:0},{q:"A book at rest has balanced forces?",o:["Yes","No","Only on Earth"],ok:0}],
    explain:"Motion continues on its own; only change needs a net force."}),
  C("se6","s_eco",3,"speed",{prompt:"Ecosystem rapid round",limit:35,hint:"Follow the energy.",
    items:[{q:"Energy enters an ecosystem from",o:["The sun","Decomposers","Predators"],ok:0},{q:"Removing a predator makes prey",o:["Increase","Vanish","Unchanged"],ok:0},
      {q:"Decomposers return what to the soil?",o:["Nutrients","Sunlight","Predators"],ok:0},{q:"Pesticides can build up along",o:["The food chain","The weather","The soil only"],ok:0}],
    explain:"Ecosystems are linked; a change at one level moves through the rest."}),
];

const BOSS = {
  programming:{name:"The Bug Sovereign", line:"Your code compiles. Your understanding will not.", stages:["pl3","pf2","pv4"]},
  math:{name:"The Equation Warden", line:"Balance me, or be unbalanced.", stages:["ma3","mf2","mg3"]},
  science:{name:"The Entropy Beast", line:"Order is temporary. Prove otherwise.", stages:["sf2","sm3","se3"]}
};

const byId = id => CHALLENGES.find(c=>c.id===id);
const skillName = id => { for(const s of Object.values(SUBJECTS)) if(s.skills[id]) return s.skills[id].name; return id; };
const subjectOfSkill = id => Object.keys(SUBJECTS).find(k=>SUBJECTS[k].skills[id]);


export { SUBJECTS, CHALLENGES, BOSS, byId, skillName, subjectOfSkill };
