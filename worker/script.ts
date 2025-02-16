import type { ExportedHandler } from '@cloudflare/workers-types';

export default {
  //@ts-ignore
  async fetch(request: Request): Promise<Response> {
    async function MethodNotAllowed(req: Request): Promise<Response> {
      return new Response(`Method ${req.method} not allowed.`, {
        status: 405,
        headers: {
          Allow: "GET",
        },
      });
    }
    
    if (request.method !== "GET") return MethodNotAllowed(request);
    
    const baseUrl = 'https://fergfo-com-header.pages.dev';
    
    // Fetch the main HTML
    const htmlResponse = await fetch(baseUrl);
    const html = await htmlResponse.text();
    
    // Find all CSS file references in the HTML
    const cssLinks = [...html.matchAll(/<link[^>]*href="([^"]*\.css)"[^>]*>/g)]
      .map(match => match[1])
      .filter(href => href.startsWith('/_astro/'));
    
    // Fetch all CSS files
    const cssPromises = cssLinks.map(async (cssPath) => {
      const cssResponse = await fetch(`${baseUrl}${cssPath}`);
      return cssResponse.text();
    });
    
    const cssContents = await Promise.all(cssPromises);
    
    // Combine HTML and all CSS
    const combinedHtml = `
      <style>${cssContents.join('\n')}</style>
      ${html}
    `;
    
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Content-Type', 'text/html');
    headers.set('Content-Security-Policy', "default-src 'self' 'unsafe-inline' https:; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:;");
    
    return new Response(combinedHtml, {
      status: 200,
      headers
    });
  },
} satisfies ExportedHandler;