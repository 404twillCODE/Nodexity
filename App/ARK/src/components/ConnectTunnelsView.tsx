export default function ConnectTunnelsView() {
  return (
    <div className="h-full overflow-y-auto p-6 font-mono flex min-h-full items-center justify-center">
      <div className="max-w-lg w-full mx-auto space-y-6 text-left">
        <h1 className="text-2xl font-semibold text-text-primary uppercase tracking-wider text-center">
          Connect tunnels
        </h1>
        <p className="text-sm text-text-secondary text-center">
          Give your Minecraft server a public address without port forwarding. Use any tunneling tool you like; run it on your machine and point it at your server port.
        </p>

        <div className="system-card p-6 border-l-4 border-accent space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Options for external access
          </h2>
          <ul className="space-y-3 text-sm text-text-secondary list-disc list-inside">
            <li>
              <strong className="text-text-primary">playit.gg</strong> — Install from{" "}
              <a href="https://playit.gg/download" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">playit.gg/download</a>.
              Run the app, add a Minecraft tunnel for your server port (e.g. 25565), then share the address it gives you.
            </li>
            <li>
              <strong className="text-text-primary">ngrok</strong> — Install ngrok, then run e.g.{" "}
              <code className="text-accent bg-background-secondary px-1 rounded">ngrok tcp 25565</code>.
              Use the TCP address it shows for Minecraft.
            </li>
            <li>
              <strong className="text-text-primary">localtunnel</strong> — With Node.js:{" "}
              <code className="text-accent bg-background-secondary px-1 rounded">npx localtunnel --port 25565</code>.
              Note: Minecraft uses TCP; some tunnel tools expose HTTP by default — use one that supports TCP or the correct protocol.
            </li>
            <li>
              <strong className="text-text-primary">Cloudflare Tunnel (cloudflared)</strong> — Install cloudflared, create a tunnel, and configure a TCP route to{" "}
              <code className="text-accent bg-background-secondary px-1 rounded">localhost:25565</code> (or your server port).
            </li>
          </ul>
          <p className="text-xs text-text-muted pt-2 border-t border-border">
            Your server port is shown on each server’s dashboard (and in server settings). Use that port when configuring the tunnel. Share the public URL/host the tunnel gives you so players can connect.
          </p>
        </div>
      </div>
    </div>
  );
}
