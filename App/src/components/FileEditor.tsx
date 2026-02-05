import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import NbtEditor from "./NbtEditor";

const BINARY_EXTENSIONS = ['.dat', '.dat_old', '.nbt'];

function isBinaryFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return BINARY_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function bytesToHexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const offset = i.toString(16).padStart(8, '0');
    const chunk = bytes.subarray(i, Math.min(i + 16, bytes.length));
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push(`${offset}  ${hex.padEnd(48, ' ')}  ${ascii}`);
  }
  return lines.join('\n');
}

function bytesToHexEditable(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.subarray(i, Math.min(i + 16, bytes.length));
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    lines.push(hex);
  }
  return lines.join('\n');
}

function parseHexEditableToBytes(text: string): Uint8Array | null {
  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  const bytes: number[] = [];
  for (const tok of tokens) {
    if (tok.length !== 2 || !/^[0-9a-fA-F]{2}$/.test(tok)) return null;
    bytes.push(parseInt(tok, 16));
  }
  return new Uint8Array(bytes);
}

interface FileEditorProps {
  serverName: string;
  initialPath?: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  path: string;
}

export default function FileEditor({ serverName, initialPath }: FileEditorProps) {
  const [currentPath, setCurrentPath] = useState(initialPath ?? '');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileContentBase64, setFileContentBase64] = useState<string | null>(null);
  const [hexEditText, setHexEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isBinary, setIsBinary] = useState(false);
  const [binaryWasGzipped, setBinaryWasGzipped] = useState(false);
  const [nbtData, setNbtData] = useState<{ parsed: import("./NbtEditor").NbtTag; type: string } | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    setCurrentPath(initialPath ?? '');
  }, [initialPath]);

  useEffect(() => {
    loadFiles();
  }, [serverName, currentPath]);

  const loadFiles = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.getServerFiles(serverName, currentPath);
      if (result.success) {
        setFiles(result.items || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
      setSelectedFile(null);
      setFileContent('');
      setFileContentBase64(null);
      setHexEditText('');
      setBinaryWasGzipped(false);
      setNbtData(null);
      setIsBinary(false);
      setIsEditing(false);
    } else {
      setSelectedFile(file.path);
      setIsEditing(false);
      setFileContent('');
      setFileContentBase64(null);
      setHexEditText('');
      setBinaryWasGzipped(false);
      setNbtData(null);
      if (!window.electronAPI) return;
      const binary = isBinaryFileName(file.name);
      setIsBinary(binary);
      try {
        if (binary) {
          const nbtResult = await window.electronAPI.server.readServerFileNbt(serverName, file.path);
          if (nbtResult.success && nbtResult.parsed && nbtResult.type) {
            setNbtData({ parsed: nbtResult.parsed as import("./NbtEditor").NbtTag, type: nbtResult.type });
            setFileContentBase64(null);
          } else {
            const result = await window.electronAPI.server.readServerFileBinary(serverName, file.path);
            if (result.success && result.contentBase64) {
              setFileContentBase64(result.contentBase64);
              setBinaryWasGzipped(result.wasGzipped === true);
            }
          }
        } else {
          const result = await window.electronAPI.server.readServerFile(serverName, file.path);
          if (result.success) {
            setFileContent(result.content || '');
          }
        }
      } catch (error) {
        console.error('Failed to read file:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !window.electronAPI) return;
    setSaving(true);
    try {
      if (nbtData) {
        const result = await window.electronAPI.server.writeServerFileNbt(serverName, selectedFile, nbtData.parsed, nbtData.type);
        if (result.success) {
          setIsEditing(false);
          notify({
            type: "success",
            title: "File saved",
            message: "Changes have been written to disk."
          });
        } else {
          notify({
            type: "error",
            title: "Save failed",
            message: result.error || "Unable to save the file."
          });
        }
      } else if (isBinary) {
        const bytes = parseHexEditableToBytes(hexEditText);
        if (bytes == null) {
          notify({
            type: "error",
            title: "Invalid hex",
            message: "Hex content must be pairs of hex digits (00-ff) separated by spaces or newlines."
          });
          setSaving(false);
          return;
        }
        const contentBase64 = bytesToBase64(bytes);
        const result = await window.electronAPI.server.writeServerFileBinary(serverName, selectedFile, contentBase64, binaryWasGzipped);
        if (result.success) {
          setFileContentBase64(contentBase64);
          setIsEditing(false);
          notify({
            type: "success",
            title: "File saved",
            message: "Changes have been written to disk."
          });
        } else {
          notify({
            type: "error",
            title: "Save failed",
            message: result.error || "Unable to save the file."
          });
        }
      } else {
        const result = await window.electronAPI.server.writeServerFile(serverName, selectedFile, fileContent);
        if (result.success) {
          setIsEditing(false);
          notify({
            type: "success",
            title: "File saved",
            message: "Changes have been written to disk."
          });
        } else {
          notify({
            type: "error",
            title: "Save failed",
            message: result.error || "Unable to save the file."
          });
        }
      }
    } catch (error: unknown) {
      notify({
        type: "error",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Unable to save the file."
      });
    } finally {
      setSaving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* File Browser */}
      <div className="w-64 border-r border-border bg-background-secondary overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            {currentPath && (
              <button
                onClick={goBack}
                className="text-text-secondary hover:text-text-primary font-mono text-sm"
              >
                ←
              </button>
            )}
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
              {currentPath || 'ROOT'}
            </div>
          </div>
          {loading ? (
            <div className="text-text-muted font-mono text-sm">Loading...</div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <motion.button
                  key={file.path}
                  onClick={() => handleFileClick(file)}
                  className={`w-full text-left px-3 py-2 text-sm font-mono rounded transition-colors ${
                    selectedFile === file.path
                      ? 'bg-accent/20 text-accent'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <span>{file.type === 'directory' ? '📁' : '📄'}</span>
                    <span className="flex-1 truncate">{file.name}</span>
                    {file.type === 'file' && (
                      <span className="text-xs text-text-muted">{formatSize(file.size)}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            <div className="border-b border-border bg-background-secondary px-4 py-2 flex items-center justify-between">
              <div className="text-sm font-mono text-text-primary">{selectedFile}</div>
              <div className="flex gap-2">
                {!nbtData && !isEditing && (
                  <motion.button
                    onClick={() => {
                      if (isBinary && fileContentBase64) {
                        const bytes = base64ToBytes(fileContentBase64);
                        setHexEditText(bytesToHexEditable(bytes));
                      }
                      setIsEditing(true);
                    }}
                    className="btn-secondary text-xs px-3 py-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    EDIT
                  </motion.button>
                )}
                {!nbtData && isEditing && (
                  <>
                    <motion.button
                      onClick={() => {
                        setIsEditing(false);
                        if (isBinary && fileContentBase64) setHexEditText('');
                        else handleFileClick({ name: selectedFile.split('/').pop() || '', type: 'file', size: 0, modified: '', path: selectedFile });
                      }}
                      className="btn-secondary text-xs px-3 py-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      CANCEL
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary text-xs px-3 py-1 disabled:opacity-50"
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                    >
                      {saving ? 'SAVING...' : 'SAVE'}
                    </motion.button>
                  </>
                )}
                {nbtData && (
                  <>
                    <motion.button
                      onClick={() => {
                        setNbtData(null);
                        window.electronAPI?.server.readServerFileBinary(serverName, selectedFile!).then((r) => {
                          if (r.success && r.contentBase64) {
                            setFileContentBase64(r.contentBase64);
                            setBinaryWasGzipped(r.wasGzipped === true);
                          }
                        });
                      }}
                      className="btn-secondary text-xs px-3 py-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      VIEW AS HEX
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary text-xs px-3 py-1 disabled:opacity-50"
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                    >
                      {saving ? 'SAVING...' : 'SAVE'}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
            {nbtData ? (
              <div className="flex-1 overflow-auto min-h-0">
                <NbtEditor
                  root={nbtData.parsed}
                  nbtFormat={nbtData.type}
                  onUpdate={(newRoot) => setNbtData((prev) => (prev ? { ...prev, parsed: newRoot } : null))}
                />
              </div>
            ) : isBinary ? (
              isEditing ? (
                <textarea
                  value={hexEditText}
                  onChange={(e) => setHexEditText(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-sm bg-background text-text-primary resize-none focus:outline-none custom-scrollbar"
                  style={{ fontFamily: 'ui-monospace, monospace' }}
                  placeholder="Hex bytes: 00 01 02 ff ... (two hex digits per byte, space or newline separated)"
                />
              ) : (
                <pre className="flex-1 w-full p-4 font-mono text-sm text-text-primary overflow-auto custom-scrollbar whitespace-pre">
                  {fileContentBase64 ? bytesToHexDump(base64ToBytes(fileContentBase64)) : '—'}
                </pre>
              )
            ) : (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                disabled={!isEditing}
                className={`flex-1 w-full p-4 font-mono text-sm bg-background text-text-primary resize-none focus:outline-none custom-scrollbar ${
                  !isEditing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                style={{ fontFamily: 'monospace' }}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 opacity-20">📄</div>
              <div className="text-text-muted font-mono text-sm">
                Select a file to view or edit
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


