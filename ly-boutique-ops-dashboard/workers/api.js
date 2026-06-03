// LY Boutique Ops Dashboard — Backend API Worker
// 部署后通过 Workers 环境变量配置 API Key

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // AI Router endpoint
    if (url.pathname === '/api/ai/run' && request.method === 'POST') {
      const body = await request.json();
      return new Response(JSON.stringify({
        success: true,
        message: 'Backend placeholder. Configure Dataler API key in env vars.',
        received: body,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};