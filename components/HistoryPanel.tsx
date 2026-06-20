import React from 'react';
import { SearchHistoryEntry } from '../types';

interface HistoryPanelProps {
  history: SearchHistoryEntry[];
  activeId: string | null;
  onRestore: (entry: SearchHistoryEntry) => void;
  onClear: () => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, activeId, onRestore, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm mb-8 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">Recent Searches</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
        >
          Clear
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {history.map(entry => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onRestore(entry)}
              className={`w-full flex items-center justify-between gap-4 px-3 py-3 text-left rounded-lg hover:bg-slate-50 transition-colors ${
                entry.id === activeId ? 'bg-primary/5' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{entry.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatTime(entry.timestamp)}</p>
              </div>
              <span className="flex-shrink-0 text-sm font-medium text-primary">
                {entry.results.length} {entry.results.length === 1 ? 'lead' : 'leads'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryPanel;
