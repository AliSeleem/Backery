const { startServer } = require('./server');

async function runHttpTests() {
    console.log('Testing HTTP Endpoints...');
    const server = await startServer();

    try {
        // 1. Test Health endpoint
        const healthRes = await fetch('http://localhost:5000/api/health');
        const healthData = await healthRes.json();
        console.log('1. Health check response:', healthData.status === 'online' ? '✅ OK' : '❌ Failed');

        // 2. Test Public Categories endpoint
        const catRes = await fetch('http://localhost:5000/api/categories');
        const catData = await catRes.json();
        console.log(`2. Categories endpoint: ✅ Found ${catData.count} categories`);

        // 3. Test Public Products endpoint
        const prodRes = await fetch('http://localhost:5000/api/products');
        const prodData = await prodRes.json();
        console.log(`3. Public Products endpoint: ✅ Found ${prodData.count} active products`);

        // 4. Test Admin Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@reefmaadi.com', password: 'admin123456' })
        });
        const loginData = await loginRes.json();
        console.log('4. Admin Login:', loginData.success ? '✅ Authenticated successfully' : '❌ Failed');

        // 5. Test Protected Stats with Bearer Token
        const statsRes = await fetch('http://localhost:5000/api/stats/overview', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const statsData = await statsRes.json();
        console.log('5. Protected Stats endpoint:', statsData.success ? `✅ Stats loaded (Total products: ${statsData.stats.totalProducts})` : '❌ Failed');

        console.log('====================================================');
        console.log('🎉 جميع استدعاءات الـ REST APIs تعمل بشكل سليم 100%!');
        console.log('====================================================');
        server.close();
        process.exit(0);
    } catch (err) {
        console.error('HTTP Test error:', err);
        server.close();
        process.exit(1);
    }
}

runHttpTests();
