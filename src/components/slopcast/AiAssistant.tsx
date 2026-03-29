import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../theme/motion';
import type { WellGroup, CommodityPricingAssumptions } from '../../types';
import {
  parsePrompt,
  applyActions,
  pushHistory,
  popHistory,
  getHistory,
  type AssistantAction,
} from '../../services/assistantService';
import AnimatedButton from './AnimatedButton';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key !== 'Tab' || !panelRef.current) {
      return;
    }

    const focusableElements = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(element => element.tabIndex !== -1);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (!activeElement || !panelRef.current.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement).focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  }, []);

  const handleSend = useCallback(() => {
    const prompt = input.trim();
    if (!prompt || isProcessing) return;

    setInput('');
    setIsProcessing(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
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
          id: `asst-${Date.now()}`,
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
        id: `hist-${Date.now()}`,
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
        id: `asst-${Date.now()}`,
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
      id: `undo-${Date.now()}`,
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
  const panelMotion = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 20 },
      };

  return (
    <>
      {!isOpen && (
        <AnimatedButton
          onClick={() => setIsOpen(true)}
          isClassic={isClassic}
          variant="primary"
          size="icon"
          shape="circle"
          aria-controls="ai-assistant-panel"
          aria-label="Open AI Assistant"
          aria-expanded={isOpen}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 min-h-12 min-w-12 shadow-card"
          title="Open AI Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </AnimatedButton>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-panel"
            ref={panelRef}
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            onKeyDown={handleDialogKeyDown}
            transition={SPRING.snappy}
            style={{ transformOrigin: 'bottom right' }}
            className={`fixed bottom-6 right-6 z-40 w-80 md:w-96 flex flex-col rounded-panel border shadow-card overflow-hidden theme-transition ${
              isClassic
                ? 'sc-panel bg-black/90'
                : 'bg-theme-surface1/95 border-theme-border backdrop-blur-md'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-title"
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-2.5 shrink-0 ${isClassic ? 'sc-panelTitlebar sc-titlebar--neutral' : 'border-b border-theme-border/60'}`}>
              <div className="flex items-center gap-2">
                <span id="ai-assistant-title" className={`heading-font text-xs font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
                  AI Assistant
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isClassic ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-lavender/20 text-theme-lavender'}`}>
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <AnimatedButton
                    onClick={handleUndo}
                    isClassic={isClassic}
                    variant="ghost"
                    size="sm"
                    className="min-h-8 px-2 py-1"
                    title="Undo last AI action"
                  >
                    Undo
                  </AnimatedButton>
                )}
                <AnimatedButton
                  onClick={() => setIsOpen(false)}
                  isClassic={isClassic}
                  variant="icon"
                  size="icon"
                  shape="circle"
                  aria-label="Close AI Assistant"
                  className="text-base"
                >
                  ×
                </AnimatedButton>
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
                        type="button"
                        key={example}
                        onClick={() => { setInput(example); inputRef.current?.focus(); }}
                        className={`focus-ring block w-full rounded-inner px-3 py-1.5 text-left text-xs transition-colors ${
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
                  className={`focus-ring flex-1 rounded-inner border bg-transparent px-3 py-2 text-[11px] ${
                    isClassic
                      ? 'border-white/10 text-white placeholder-white/30'
                      : 'border-theme-border text-theme-text placeholder-theme-muted/40'
                  }`}
                />
                <AnimatedButton
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  isClassic={isClassic}
                  variant="primary"
                  size="sm"
                  className="px-3"
                >
                  Send
                </AnimatedButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(AiAssistant);
