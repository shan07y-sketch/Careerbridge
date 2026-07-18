import React, { useEffect, useState } from 'react';
import { CandidateManagementService } from '../../services';
import type { CandidateTag } from '../../services';

export const TagChip: React.FC<{ tag: CandidateTag; onRemove?: () => void }> = ({ tag, onRemove }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
    style={{
      backgroundColor: tag.color ? `${tag.color}1a` : undefined,
      borderColor: tag.color ? `${tag.color}55` : undefined,
      color: tag.color || undefined
    }}
  >
    {tag.name}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove tag ${tag.name}`}
        className="hover:opacity-70 leading-none"
      >
        <span className="material-symbols-outlined text-[12px]">close</span>
      </button>
    )}
  </span>
);

const DEFAULT_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#14B8A6', '#EC4899', '#6366F1'];

/**
 * Company-wide tag list, fetched once and shared across the queue/detail/bulk
 * bar rather than refetched per row. `useCompanyTags` is a tiny module-level
 * cache -- no need for a full context provider for a list this small.
 */
let cachedTags: CandidateTag[] | null = null;
let cachedTagsPromise: Promise<CandidateTag[]> | null = null;
const tagListeners = new Set<(tags: CandidateTag[]) => void>();

async function loadCompanyTags(force = false): Promise<CandidateTag[]> {
  if (cachedTags && !force) return cachedTags;
  if (!cachedTagsPromise || force) {
    cachedTagsPromise = CandidateManagementService.getTags().then(tags => {
      cachedTags = tags;
      tagListeners.forEach(l => l(tags));
      return tags;
    });
  }
  return cachedTagsPromise;
}

export function useCompanyTags() {
  const [tags, setTags] = useState<CandidateTag[]>(cachedTags || []);
  const [loading, setLoading] = useState(!cachedTags);

  useEffect(() => {
    tagListeners.add(setTags);
    loadCompanyTags().finally(() => setLoading(false));
    return () => { tagListeners.delete(setTags); };
  }, []);

  const createTag = async (name: string, color?: string) => {
    const tag = await CandidateManagementService.createTag(name, color);
    await loadCompanyTags(true);
    return tag;
  };

  const deleteTag = async (tagId: string) => {
    await CandidateManagementService.deleteTag(tagId);
    await loadCompanyTags(true);
  };

  return { tags, loading, createTag, deleteTag, refresh: () => loadCompanyTags(true) };
}

/**
 * Small popover-style picker for attaching an existing tag or creating a new
 * one inline. Used both on a single candidate's detail view and as the bulk
 * "Tag selected" action.
 */
export const TagPicker: React.FC<{
  onSelect: (tag: CandidateTag) => void;
  onClose: () => void;
  excludeIds?: string[];
}> = ({ onSelect, onClose, excludeIds = [] }) => {
  const { tags, createTag } = useCompanyTags();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = tags.filter(t => !excludeIds.includes(t.id));

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const tag = await createTag(trimmed, newColor);
      onSelect(tag);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Add tag"
      className="absolute z-20 mt-2 w-64 bg-surface-container-lowest border border-primary/10 rounded-xl shadow-xl p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tags</span>
        <button onClick={onClose} aria-label="Close tag picker" className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
        {available.length === 0 && <p className="text-xs text-on-surface-variant py-1">No tags yet -- create one below.</p>}
        {available.map(tag => (
          <button
            key={tag.id}
            onClick={() => onSelect(tag)}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-container-high flex items-center gap-2"
          >
            <TagChip tag={tag} />
          </button>
        ))}
      </div>
      <div className="border-t border-primary/10 pt-2 space-y-2">
        {error && <p role="alert" className="text-error text-xs">{error}</p>}
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="New tag name"
          aria-label="New tag name"
          className="w-full px-2.5 py-1.5 rounded-lg border border-primary/10 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {DEFAULT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              aria-label={`Color ${c}`}
              className={`w-5 h-5 rounded-full border-2 ${newColor === c ? 'border-on-surface' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40"
        >
          {creating ? 'Creating...' : 'Create & apply'}
        </button>
      </div>
    </div>
  );
};

export default TagChip;
