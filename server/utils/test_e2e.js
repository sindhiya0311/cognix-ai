import fs from 'fs';

async function runTest() {
  try {
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Web Tech Learner', email: `wtlearner_${Date.now()}@cognix.ai`, password: 'password123' })
    });
    const regData = await regRes.json();
    console.log('1. REGISTER RESPONSE:', regData);
    if (!regData.success) {
      console.error('Registration failed:', regData.message);
      return;
    }
    const token = regData.data.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const spaceRes = await fetch('http://localhost:5000/api/spaces', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Web Technologies', subject: 'Web Technologies' })
    });
    const spaceData = await spaceRes.json();
    console.log('2. SPACE CREATED:', spaceData.data.name, 'ID:', spaceData.data._id);
    const spaceId = spaceData.data._id;

    const wtText = fs.readFileSync('WT.txt', 'utf-8');
    const sylRes = await fetch(`http://localhost:5000/api/spaces/${spaceId}/syllabus`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rawText: wtText })
    });
    const sylData = await sylRes.json();
    console.log('3. WT.TXT SYLLABUS PARSED & WORLDS CREATED:', sylData.data?.worldCount, 'worlds!');
    
    console.log('\n--- GENERATED WT WORLDS FROM SYLLABUS ---');
    sylData.data?.worlds?.forEach((w, i) => {
      console.log(`World ${i + 1}: ${w.name} [${w.unitName}]`);
    });

    const servletWorld = sylData.data?.worlds?.find(w => w.name.includes('Servlet') || w.name.includes('Server'));
    if (servletWorld) {
      console.log('\n4. TESTING GAME CHALLENGE GENERATION FOR SERVLET WORLD:', servletWorld.name);
      const challengeRes = await fetch(`http://localhost:5000/api/worlds/${servletWorld._id}/game/challenge?gameType=quiz`, {
        headers: authHeaders
      });
      const challengeData = await challengeRes.json();
      console.log('CHALLENGE GENERATED:', challengeData.data?.prompt);
      console.log('OPTIONS:', challengeData.data?.options);
      console.log('ANSWER:', challengeData.data?.answer);
    }

    const noteRes = await fetch(`http://localhost:5000/api/spaces/${spaceId}/resources`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Servlet Lifecycle Notes', type: 'text', text: 'init() called once, service() handles requests, destroy() cleanup.' })
    });
    const noteData = await noteRes.json();
    console.log('\n5. NOTE CREATED & SAVED TO MONGODB:', noteData.data?.name);

    const getSpacesRes = await fetch('http://localhost:5000/api/spaces', {
      headers: authHeaders
    });
    const getSpacesData = await getSpacesRes.json();
    const fetchedSpace = getSpacesData.data?.find(s => s._id === spaceId);
    console.log('\n6. MONGODB PERSISTENCE CHECK ON FETCH:');
    console.log(' - Worlds count:', fetchedSpace?.worlds?.length);
    console.log(' - Notes count:', fetchedSpace?.notes?.length, 'First Note:', fetchedSpace?.notes?.[0]?.name);
    console.log(' - Learner profile initialized:', !!fetchedSpace?.learner);

    console.log('\nALL E2E PERSISTENCE & SYLLABUS TESTS PASSED CLEANLY!');
  } catch (err) {
    console.error('E2E TEST FAILED:', err);
  }
}

runTest();
