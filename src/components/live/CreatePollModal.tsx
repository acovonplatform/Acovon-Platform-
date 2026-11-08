import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart2, 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

interface CreatePollModalProps {
  streamId: string;
  onClose: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  streamId,
  onClose
}) => {
  const { launchLivePoll } = useApp();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState<number>(180); // 3 minutes default
  const [error, setError] = useState<string>('');

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Please provide a question for the live poll.');
      return;
    }

    const filledOptions = options.map(o => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 voting options.');
      return;
    }

    const res = launchLivePoll(streamId, question, filledOptions, duration);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to launch live poll');
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Launch Live Poll</h3>
              <p className="text-xs text-zinc-400">Audience votes and results display in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Poll Question
            </label>
            <input
              type="text"
              placeholder="e.g. Which track should I play next? / Unbox VIP vault?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#d4af37] text-white text-xs outline-none transition-colors"
              maxLength={120}
              required
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Voting Options (2 to 4)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#d4af37] text-white text-xs outline-none transition-colors"
                  maxLength={60}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 transition-colors"
                    title="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 4 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-xs text-[#d4af37] hover:text-[#fce7b0] font-medium pt-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Poll Duration</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1 Min', secs: 60 },
                { label: '3 Mins', secs: 180 },
                { label: '5 Mins', secs: 300 },
                { label: '10 Mins', secs: 600 }
              ].map(d => (
                <button
                  key={d.secs}
                  type="button"
                  onClick={() => setDuration(d.secs)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    duration === d.secs
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0] font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] hover:brightness-110 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch to Stream</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
