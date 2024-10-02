const http = require("http");
const httpProxy = require("http-proxy");

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({});

// Define the default port for your proxy server
const DEFAULT_PORT = 3005;

// Create the HTTP server
const server = http.createServer((req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Extract the subdomain from the request URL
    const subdomain = req.headers.host.split(".")[0];

    // Extract the port number from the subdomain
    const port = parseInt(subdomain.split("-")[1]) || DEFAULT_PORT;

    // Modify the request hostname to target the CodeServer running on the extracted port
    req.headers.host = `localhost:${port}`;

    // Proxy the request to the CodeServer
    proxy.web(req, res, { target: `http://localhost:${port}` }, err => {
      console.error("Proxy Error:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Proxy Error");
    });
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

// Handle WebSocket connections
server.on("upgrade", (req, socket, head) => {
  try {
    // Extract the subdomain from the request URL
    const subdomain = req.headers.host.split(".")[0];

    // Extract the port number from the subdomain
    const port = parseInt(subdomain.split("-")[1]) || DEFAULT_PORT;

    // Proxy WebSocket requests to the CodeServer
    proxy.ws(req, socket, head, { target: `ws://localhost:${port}` }, err => {
      console.error("Proxy Error:", err);
      socket.destroy();
    });
  } catch (error) {
    console.error("Error:", error);
    socket.destroy();
  }
});

// Define the port for your proxy server
const PORT = 3005;

// Listen on the defined port
server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
