const axios = require('axios');

async function run() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:3001/auth/login', {
      email: 'admin@bos.com',
      password: 'password123'
    });
    
    const token = loginRes.data.access_token;
    console.log('Got token');

    // 2. Fetch Organizations
    const orgsRes = await axios.get('http://localhost:3001/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orgId = orgsRes.data[0].id;
    console.log('Got org id:', orgId);

    // 3. Create branch
    const branchRes = await axios.post('http://localhost:3001/branches', {
      name: 'Test Script Branch',
      code: 'TEST02',
      timezone: 'Asia/Dhaka',
      organization_id: orgId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Branch created successfully!', branchRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
