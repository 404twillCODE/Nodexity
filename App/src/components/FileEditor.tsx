import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";

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
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (initialPath !== undefined) {
      setCurrentPath(initialPath);
    }
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
      setIsEditing(false);
    } else {
      setSelectedFile(file.path);
      setIsEditing(false);
      if (!window.electronAPI) return;
      try {
        const result = await window.electronAPI.server.readServerFile(serverName, file.path);
        if (result.success) {
          setFileContent(result.content || '');
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
    } catch (error: any) {
      notify({
        type: "error",
        title: "Save failed",
        message: error.message || "Unable to save the file."
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
                {!isEditing && (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary text-xs px-3 py-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    EDIT
                  </motion.button>
                )}
                {isEditing && (
                  <>
                    <motion.button
                      onClick={() => {
                        setIsEditing(false);
                        handleFileClick({ name: selectedFile.split('/').pop() || '', type: 'file', size: 0, modified: '', path: selectedFile });
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
              </div>
            </div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              disabled={!isEditing}
              className={`flex-1 w-full p-4 font-mono text-sm bg-background text-text-primary resize-none focus:outline-none custom-scrollbar ${
                !isEditing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{ fontFamily: 'monospace' }}
            />
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


