// Proxy route handler to bypass CORS when communicating with WordPress
// All requests from the frontend go through here to avoid cross-origin issues

export async function POST(request) {
  try {
    const body = await request.json();
    const { wpUrl, wpApiKey, endpoint, method = 'GET', data } = body;

    if (!wpUrl || !wpApiKey || !endpoint) {
      return Response.json(
        { error: 'Missing required fields: wpUrl, wpApiKey, endpoint' },
        { status: 400 }
      );
    }

    const cleanUrl = wpUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanUrl}/wp-json/onhub/v1/${endpoint}`;

    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-OnHub-Key': wpApiKey,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(data);
    }

    console.log(`[v0] WP Proxy: ${method} ${targetUrl}`);

    const response = await fetch(targetUrl, fetchOptions);

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.log(`[v0] WP Proxy Error: ${response.status}`, responseData);
      return Response.json(
        { error: `WordPress API error: ${response.status}`, details: responseData },
        { status: response.status }
      );
    }

    console.log(`[v0] WP Proxy Success: ${method} ${endpoint}`);
    return Response.json(responseData);
  } catch (error) {
    console.error('[v0] WP Proxy fetch error:', error.message);
    return Response.json(
      { error: `Proxy fetch failed: ${error.message}` },
      { status: 502 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
