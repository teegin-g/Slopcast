import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../theme/motion';
import type { WellGroup, CommodityPricingAssumptions } from '../../types';
import { createLocalId } from '../../utils/id';
import {
  parsePrompt,
  applyActions,
  pushHistory,
  popHistory,
  getHistory,
  type AssistantAction,
  type AssistantHistoryEntry,
} from '../../services/assistantService';

interface AiAssistantProps {
  isClassic: boolean;
  activeGroup: WellGroup;
  onUpdateGroup: (group: WellGroup) => void;
  onUpdatePricing?: (pricing: Partial<CommodityPricingAssumptions>) => void;
  onUpdateScalars?: (scalars: { capex: number; production: number }) => void;
  currentScalars: { capex: number; production: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
  timestamp: number;
}

const AiAssistant: React.FC<AiAssistantProps> = ({
  isClassic,
  activeGroup,
  onUpdateGroup,
  onUpdatePricing,
  onUpdateScalars,
  currentScalars,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const prompt = input.trim();
    if (!prompt || isProcessing) return;

    setInput('');
    setIsProcessing(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: createLocalId('user'),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Parse and apply
    setTimeout(() => {
      const actions = parsePrompt(prompt);
      const hasUnknown = actions.some(a => a.type === 'UNKNOWN');

      if (hasUnknown) {
        const assistantMsg: ChatMessage = {
          id: createLocalId('asst'),
          role: 'assistant',
          content: 'I couldn\'t understand that command. Try something like "set oil price to $80" or "increase capex by 10%".',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsProcessing(false);
        return;
      }

      // Save state for undo
      const previousState: Record<string, unknown> = {
        group: { ...activeGroup },
        scalars: { ...currentScalars },
      };

      const result = applyActions(actions, activeGroup, currentScalars);

      // Push to undo stack
      pushHistory({
        id: createLocalId('hist'),
        prompt,
        actions,
        timestamp: Date.now(),
        previousState,
      });

      // Apply mutations
      onUpdateGroup(result.updatedGroup);
      if (result.updatedPricing && onUpdatePricing) {
        onUpdatePricing(result.updatedPricing);
      }
      if (result.updatedScalars && onUpdateScalars) {
        onUpdateScalars(result.updatedScalars);
      }

      // Assistant response
      const assistantMsg: ChatMessage = {
        id: createLocalId('asst'),
        role: 'assistant',
        content: `Applied ${result.changes.length} change${result.changes.length !== 1 ? 's' : ''}:\n${result.changes.map(c => `  - ${c}`).join('\n')}`,
        actions,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 300);
  }, [input, isProcessing, activeGroup, currentScalars, onUpdateGroup, onUpdatePricing, onUpdateScalars]);

  const handleUndo = useCallback(() => {
    const entry = popHistory();
    if (!entry) return;

    const prev = entry.previousState;
    if (prev.group) {
      onUpdateGroup(prev.group as WellGroup);
    }
    if (prev.scalars && onUpdateScalars) {
      onUpdateScalars(prev.scalars as { capex: number; production: number });
    }

    const undoMsg: ChatMessage = {
      id: createLocalId('undo'),
      role: 'assistant',
      content: `Undid: "${entry.prompt}"`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, undoMsg]);
  }, [onUpdateGroup, onUpdateScalars]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const history = getHistory();

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-card transition-all hover:scale-105 ${
            isClassic
              ? 'bg-theme-cyan text-white border-2 border-theme-magenta/60'
              : 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
          }`}
          title="Open AI Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={SPRING.snappy}
            style={{ transformOrigin: 'bottom right' }}
            className={`fixed bottom-6 right-6 z-40 w-80 md:w-96 flex flex-col rounded-panel border shadow-card overflow-hidden theme-transition ${
              isClassic
                ? 'sc-panel bg-black/90'
                : 'bg-theme-surface1/95 border-theme-border backdrop-blur-md'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-2.5 shrink-0 ${isClassic ? 'sc-panelTitlebar sc-titlebar--neutral' : 'border-b border-theme-border/60'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
                  AI Assistant
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${isClassic ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-lavender/20 text-theme-lavender'}`}>
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                      isClassic
                        ? 'text-white/60 hover:text-white'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                    title="Undo last AI action"
                  >
                    Undo
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    isClassic
                      ? 'text-white/60 hover:text-white hover:bg-white/10'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px]" style={{ maxHeight: 'min(500px, 70vh)' }}>
              {messages.length === 0 && (
                <div className={`text-center py-6 ${isClassic ? 'text-white/30' : 'text-theme-muted/40'}`}>
                  <p className="text-[11px] mb-2">Try a command:</p>
                  <div className="space-y-1">
                    {['Set oil price to $80', 'Increase capex by 15%', 'Set Qi to 1200'].map(example => (
                      <button
                        key={example}
                        onClick={() => { setInput(example); inputRef.current?.focus(); }}
                        className={`block w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                          isClassic
                            ? 'hover:bg-white/10 text-white/50'
                            : 'hover:bg-theme-surface2/60 text-theme-muted/60'
                        }`}
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-inner px-3 py-2 text-[11px] ${
                      msg.role === 'user'
                        ? isClassic
                          ? 'bg-theme-cyan/30 text-white'
                          : 'bg-theme-cyan/20 text-theme-text'
                        : isClassic
                          ? 'bg-black/30 text-white/90 border border-white/10'
                          : 'bg-theme-bg border border-theme-border text-theme-text'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className={`px-3 py-2 rounded-inner text-[11px] ${
                    isClassic ? 'bg-black/30 text-white/50' : 'bg-theme-bg text-theme-muted border border-theme-border'
                  }`}>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`px-3 py-2.5 shrink-0 border-t ${isClassic ? 'border-white/10' : 'border-theme-border/40'}`}>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the AI..."
                  className={`flex-1 bg-transparent text-[11px] outline-none ${
                    isClassic ? 'text-white placeholder-white/30' : 'text-theme-text placeholder-theme-muted/40'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wide transition-all ${
                    isClassic
                      ? 'bg-theme-cyan text-white disabled:opacity-30'
                      : 'bg-theme-cyan text-theme-bg disabled:opacity-30 hover:shadow-glow-cyan'
                  }`}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(AiAssistant);
