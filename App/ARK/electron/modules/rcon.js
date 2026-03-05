/**
 * RCON client for communicating with ARK servers.
 * Implements the Source RCON protocol over TCP.
 */
const net = require('net');

const SERVERDATA_AUTH = 3;
const SERVERDATA_EXECCOMMAND = 2;

class RconClient {
  constructor(host, port, password, timeout = 10000) {
    this.host = host;
    this.port = port;
    this.password = password;
    this.timeout = timeout;
    this.requestId = 0;
    this.socket = null;
    this.authenticated = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.socket) this.socket.destroy();
        reject(new Error('Connection timed out'));
      }, this.timeout);

      this.socket = new net.Socket();
      this.socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.connect(this.port, this.host, async () => {
        clearTimeout(timer);
        try {
          await this._authenticate();
          resolve();
        } catch (err) {
          this.disconnect();
          reject(err);
        }
      });
    });
  }

  _authenticate() {
    const id = ++this.requestId;
    const packet = this._buildPacket(id, SERVERDATA_AUTH, this.password);
    return this._sendAndReceive(packet).then((response) => {
      if (response.id === -1) {
        throw new Error('RCON authentication failed - check password');
      }
      this.authenticated = true;
    });
  }

  execute(command) {
    if (!this.authenticated) {
      return Promise.reject(new Error('Not authenticated'));
    }
    const id = ++this.requestId;
    const packet = this._buildPacket(id, SERVERDATA_EXECCOMMAND, command);
    return this._sendAndReceive(packet).then((r) => r.body);
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.destroy(); } catch (_) {}
      this.socket = null;
    }
    this.authenticated = false;
  }

  _buildPacket(id, type, body) {
    const bodyBuf = Buffer.from(body, 'utf8');
    const size = 4 + 4 + bodyBuf.length + 2;
    const buf = Buffer.alloc(4 + size);
    buf.writeInt32LE(size, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    bodyBuf.copy(buf, 12);
    buf.writeUInt8(0, 12 + bodyBuf.length);
    buf.writeUInt8(0, 13 + bodyBuf.length);
    return buf;
  }

  _parsePacket(buffer) {
    if (buffer.length < 14) throw new Error('Packet too small');
    const size = buffer.readInt32LE(0);
    const id = buffer.readInt32LE(4);
    const type = buffer.readInt32LE(8);
    const bodyLen = size - 10;
    const body = bodyLen > 0 ? buffer.slice(12, 12 + bodyLen).toString('utf8') : '';
    return { size, id, type, body, totalLength: 4 + size };
  }

  _sendAndReceive(packet) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('RCON response timed out'));
      }, this.timeout);

      let buffer = Buffer.alloc(0);

      const onData = (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.length < 4) return;
        const expectedSize = buffer.readInt32LE(0) + 4;
        if (buffer.length >= expectedSize) {
          cleanup();
          try {
            resolve(this._parsePacket(buffer));
          } catch (e) {
            reject(e);
          }
        }
      };

      const onError = (err) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(timer);
        if (this.socket) {
          this.socket.removeListener('data', onData);
          this.socket.removeListener('error', onError);
        }
      };

      this.socket.on('data', onData);
      this.socket.on('error', onError);
      this.socket.write(packet);
    });
  }
}

async function rconCommand(host, port, password, command, timeout = 10000) {
  const client = new RconClient(host, port, password, timeout);
  try {
    await client.connect();
    return await client.execute(command);
  } finally {
    client.disconnect();
  }
}

async function testRcon(host, port, password, timeout = 5000) {
  const client = new RconClient(host, port, password, timeout);
  try {
    await client.connect();
    await client.execute('listplayers');
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

module.exports = { RconClient, rconCommand, testRcon };
