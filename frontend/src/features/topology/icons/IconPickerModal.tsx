import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Check, Search, ImagePlus } from 'lucide-react';
import { BUILTIN_ICONS, ICON_CATEGORIES, type BuiltinIcon } from './builtinIcons';
import { iconsApi, type NodeIcon } from '@/api/icons.api';
import { toast } from 'sonner';

interface Props {
  nodeId:          string;
  nodeLabel:       string;
  currentIconKey?: string;
  onClose:         () => void;
  onApply:         (iconKey: string) => void;
}

type Tab = 'builtin' | 'custom';

// ── Render a built-in icon SVG inline ─────────────────────────────────────────
function BuiltinIconPreview({ svg, size = 24 }: { svg: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ display: 'block' }}
    />
  );
}

// ── Single icon tile ───────────────────────────────────────────────────────────
function IconTile({ icon, selected, onClick }: {
  icon: BuiltinIcon | NodeIcon;
  selected: boolean;
  onClick: () => void;
}) {
  const isBuiltin = 'svg' in icon;

  return (
    <button
      onClick={onClick}
      title={icon.label}
      className={`relative group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
                  border-2 transition-all cursor-pointer
                  ${selected
                    ? 'border-axilog-primary bg-axilog-primary/10 dark:bg-axilog-primary/20'
                    : 'border-[#30363d] bg-[#161b22] hover:border-axilog-primary/50 hover:bg-[#21262d]'
                  }`}
    >
      <div className="text-white w-7 h-7 flex items-center justify-center">
        {isBuiltin ? (
          <BuiltinIconPreview svg={(icon as BuiltinIcon).svg} size={28} />
        ) : (
          <img
            src={`/api/v1/icons/file/${(icon as NodeIcon).id}`}
            alt={icon.label}
            className="w-7 h-7 object-contain"
          />
        )}
      </div>
      <span className="text-[9px] text-gray-400 text-center leading-tight max-w-[56px] truncate">
        {icon.label}
      </span>
      {selected && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-axilog-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </button>
  );
}

export function IconPickerModal({ nodeId, nodeLabel, currentIconKey, onClose, onApply }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab]               = useState<Tab>('builtin');
  const [search, setSearch]         = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selected, setSelected]     = useState<string>(currentIconKey ?? '');
  const [dragging, setDragging]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: customIcons = [] } = useQuery({
    queryKey: ['node-icons'],
    queryFn:  iconsApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: iconsApi.upload,
    onSuccess: (icon) => {
      queryClient.invalidateQueries({ queryKey: ['node-icons'] });
      setSelected(icon.id);
      toast.success(`"${icon.label}" uploaded`);
      setTab('custom');
    },
    onError: () => toast.error('Upload failed'),
  });

  const applyMutation = useMutation({
    mutationFn: ({ id, key }: { id: string; key: string }) =>
      iconsApi.setNodeIcon(id, key),
    onSuccess: (_d, { key }) => {
      onApply(key);
      toast.success('Icon updated');
      onClose();
    },
    onError: () => toast.error('Failed to update icon'),
  });

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(svg\+xml|png|jpeg|gif|webp)/)) {
      toast.error('Only SVG, PNG, JPG, GIF and WEBP files are supported');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name.replace(/\.[^.]+$/, ''));
    uploadMutation.mutate(fd);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleApply = () => {
    if (!selected) return;
    applyMutation.mutate({ id: nodeId, key: selected });
  };

  // Filter built-in icons
  const filteredBuiltin = BUILTIN_ICONS.filter(i => {
    const matchSearch = !search || i.label.toLowerCase().includes(search.toLowerCase());
    const matchCat    = selectedCat === 'all' || i.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[620px] max-h-[85vh] bg-[#161b22] border border-[#30363d] rounded-2xl
                      shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-sm font-bold text-[#e6edf3]">Change Icon</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">Node: <span className="text-axilog-primary-light font-medium">{nodeLabel}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#30363d]">
          {(['builtin', 'custom'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors
                          ${tab === t
                            ? 'text-axilog-primary-light border-b-2 border-axilog-primary'
                            : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
            >
              {t === 'builtin' ? `Built-in Library (${BUILTIN_ICONS.length})` : `Custom Uploads (${customIcons.length})`}
            </button>
          ))}
        </div>

        {/* Built-in tab */}
        {tab === 'builtin' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d]">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b949e]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search icons…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#21262d] border border-[#30363d] rounded-lg
                             text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-axilog-primary"
                />
              </div>
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="px-2 py-1.5 text-xs bg-[#21262d] border border-[#30363d] rounded-lg
                           text-[#e6edf3] focus:outline-none focus:border-axilog-primary"
              >
                <option value="all">All categories</option>
                {ICON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Icon grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredBuiltin.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#8b949e]">
                  <Search className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No icons match your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {filteredBuiltin.map(icon => (
                    <IconTile
                      key={icon.key}
                      icon={icon}
                      selected={selected === icon.key}
                      onClick={() => setSelected(icon.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom uploads tab */}
        {tab === 'custom' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`mx-4 mt-4 mb-3 flex flex-col items-center justify-center gap-2
                          h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                          ${dragging
                            ? 'border-axilog-primary bg-axilog-primary/10'
                            : 'border-[#30363d] hover:border-axilog-primary/50 hover:bg-[#21262d]'
                          } ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploadMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-axilog-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7 text-[#8b949e]" />
                  <p className="text-xs text-[#8b949e]">
                    Drag & drop or <span className="text-axilog-primary-light">browse</span> — SVG, PNG, JPG
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Custom icon grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {customIcons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#8b949e]">
                  <Upload className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No custom icons uploaded yet</p>
                  <p className="text-xs mt-1">Upload SVG or PNG icons to use them on nodes</p>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {customIcons.map(icon => (
                    <IconTile
                      key={icon.id}
                      icon={icon}
                      selected={selected === icon.id}
                      onClick={() => setSelected(icon.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#30363d] bg-[#21262d]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            Cancel
          </button>
          <button
            disabled={!selected || applyMutation.isPending}
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-axilog-primary hover:bg-axilog-primary-dark
                       text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {applyMutation.isPending ? 'Applying…' : 'Apply icon'}
          </button>
        </div>
      </div>
    </div>
  );
}
