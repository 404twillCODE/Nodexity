import { useState } from "react";
import { motion } from "framer-motion";

export type NbtTag = {
  type: string;
  name?: string;
  value: unknown;
};

const PRIMITIVE_TYPES = ['byte', 'short', 'int', 'long', 'float', 'double', 'string'];
const ARRAY_TYPES = ['byteArray', 'intArray', 'longArray'];

function setNbtValueAtPath(root: NbtTag, path: (string | number)[], newValue: unknown): NbtTag {
  if (path.length === 0) return root;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    return { ...root, value: newValue };
  }
  if (root.type === 'compound' && typeof head === 'string' && root.value && typeof root.value === 'object' && !Array.isArray(root.value)) {
    const val = root.value as Record<string, NbtTag>;
    const next = val[head];
    if (!next) return root;
    const updated = setNbtValueAtPath(next, rest, newValue);
    return { ...root, value: { ...val, [head]: updated } };
  }
  if (root.type === 'list' && typeof head === 'number') {
    const listVal = root.value as { type: string; value: unknown[] };
    const arr = listVal.value ? [...listVal.value] : [];
    const next = arr[head];
    if (next && typeof next === 'object' && next !== null && 'type' in next) {
      const updated = setNbtValueAtPath(next as NbtTag, rest, newValue);
      const newArr = [...arr];
      newArr[head] = updated;
      return { ...root, value: { ...listVal, value: newArr } };
    }
  }
  return root;
}

function getNbtValueAtPath(root: NbtTag, path: (string | number)[]): unknown {
  if (path.length === 0) return root.value;
  const [head, ...rest] = path;
  if (root.type === 'compound' && typeof head === 'string' && root.value && typeof root.value === 'object' && !Array.isArray(root.value)) {
    const val = root.value as Record<string, NbtTag>;
    const next = val[head];
    if (!next) return undefined;
    return rest.length === 0 ? next.value : getNbtValueAtPath(next, rest);
  }
  if (root.type === 'list' && typeof head === 'number') {
    const listVal = root.value as { type: string; value: unknown[] };
    const arr = listVal?.value ?? [];
    const next = arr[head];
    if (next && typeof next === 'object' && next !== null && 'type' in next) {
      return rest.length === 0 ? (next as NbtTag).value : getNbtValueAtPath(next as NbtTag, rest);
    }
  }
  return undefined;
}

interface NbtEditorProps {
  root: NbtTag;
  nbtFormat: string;
  onUpdate: (newRoot: NbtTag) => void;
  readOnly?: boolean;
}

export default function NbtEditor({ root, nbtFormat, onUpdate, readOnly }: NbtEditorProps) {
  const updateAtPath = (path: (string | number)[], newValue: unknown) => {
    onUpdate(setNbtValueAtPath(root, path, newValue));
  };

  return (
    <div className="p-4 font-mono text-sm overflow-auto custom-scrollbar">
      <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">
        NBT (editable) · format: {nbtFormat}
      </div>
      <NbtNode tag={root} path={[]} onUpdate={updateAtPath} root={root} readOnly={readOnly ?? false} />
    </div>
  );
}

interface NbtNodeProps {
  tag: NbtTag;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: unknown) => void;
  root: NbtTag;
  readOnly: boolean;
  name?: string;
}

function NbtNode({ tag, path, onUpdate, name, readOnly }: NbtNodeProps) {
  const [open, setOpen] = useState(true);
  const type = tag.type as string;
  const value = tag.value;

  if (PRIMITIVE_TYPES.includes(type)) {
    const val = value as string | number | number[];
    const display = Array.isArray(val) ? `[${val[0]}, ${val[1]}]` : String(val);
    return (
      <div className="flex items-center gap-2 py-0.5 group">
        {name != null && (
          <span className="text-text-secondary shrink-0" style={{ minWidth: name.length > 20 ? 140 : undefined }}>
            {name}:
          </span>
        )}
        <span className="text-text-muted text-xs shrink-0">({type})</span>
        {readOnly ? (
          <span className="text-text-primary break-all">{display}</span>
        ) : (
          <input
            type={type === 'string' ? 'text' : 'text'}
            value={display}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (type === 'string') {
                onUpdate(path, raw);
                return;
              }
              if (type === 'long' && raw.startsWith('[') && raw.includes(',')) {
                const m = raw.match(/\[?\s*(-?\d+)\s*,\s*(-?\d+)\s*\]?/);
                if (m) onUpdate(path, [parseInt(m[1], 10), parseInt(m[2], 10)]);
                return;
              }
              const num = parseFloat(raw);
              if (!Number.isNaN(num)) {
                if (type === 'byte' || type === 'short') onUpdate(path, Math.round(num));
                else if (type === 'int') onUpdate(path, Math.round(num));
                else if (type === 'float' || type === 'double') onUpdate(path, num);
              }
            }}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-0.5 text-text-primary focus:border-accent focus:outline-none text-sm"
          />
        )}
      </div>
    );
  }

  if (type === 'compound') {
    const val = value as Record<string, NbtTag> | undefined;
    const entries = val ? Object.entries(val).filter(([, t]) => t != null) : [];
    return (
      <div className="pl-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 py-1 text-left hover:bg-background-secondary/50 rounded w-full"
        >
          <span className="text-text-muted">{open ? '▼' : '▶'}</span>
          {name != null ? (
            <span className="text-accent font-medium">{name}</span>
          ) : (
            <span className="text-text-muted">(root)</span>
          )}
          <span className="text-text-muted text-xs">compound · {entries.length} entries</span>
        </button>
        {open && (
          <div className="pl-4 border-l border-border ml-1 space-y-0.5">
            {entries.map(([k, t]) => (
              <NbtNode
                key={k}
                tag={t as NbtTag}
                path={[...path, k]}
                onUpdate={onUpdate}
                root={t as NbtTag}
                readOnly={readOnly}
                name={k}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'list') {
    const listVal = value as { type?: string; value?: unknown[] };
    const arr = listVal?.value ?? [];
    const itemType = listVal?.type ?? 'unknown';
    return (
      <div className="pl-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 py-1 text-left hover:bg-background-secondary/50 rounded w-full"
        >
          <span className="text-text-muted">{open ? '▼' : '▶'}</span>
          {name != null && <span className="text-accent font-medium">{name}</span>}
          <span className="text-text-muted text-xs">list of {itemType} · {arr.length} items</span>
        </button>
        {open && (
          <div className="pl-4 border-l border-border ml-1 space-y-0.5">
            {arr.map((item, i) => {
              if (item != null && typeof item === 'object' && 'type' in item) {
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-text-muted text-xs w-6 shrink-0">[{i}]</span>
                    <NbtNode
                      tag={item as NbtTag}
                      path={[...path, i]}
                      onUpdate={onUpdate}
                      root={item as NbtTag}
                      readOnly={readOnly}
                    />
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-2 py-0.5 pl-6">
                  <span className="text-text-muted text-xs">[{i}]</span>
                  <span className="text-text-primary">{String(item)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (ARRAY_TYPES.includes(type)) {
    const arr = Array.isArray(value) ? value : [];
    const str = arr.join(', ');
    return (
      <div className="flex items-center gap-2 py-0.5">
        {name != null && <span className="text-text-secondary shrink-0">{name}:</span>}
        <span className="text-text-muted text-xs">({type})</span>
        {readOnly ? (
          <span className="text-text-primary break-all">{str || '—'}</span>
        ) : (
          <input
            type="text"
            value={str}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const parts = raw.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
              onUpdate(path, parts);
            }}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-0.5 text-text-primary focus:border-accent focus:outline-none text-sm"
            placeholder="e.g. 1, 2, 3"
          />
        )}
      </div>
    );
  }

  return (
    <div className="py-0.5 text-text-muted">
      {name != null && `${name}: `}({type}) {JSON.stringify(value)}
    </div>
  );
}
