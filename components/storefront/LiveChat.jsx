'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { isEvBikesStore } from '@/lib/storefront/evBikesStorefront';
import {
  STOREFRONT_FLOAT_BOTTOM,
  STOREFRONT_FLOAT_RIGHT,
  STOREFRONT_CHAT_Z,
} from '@/lib/utils/mobileLayout';

const GENERIC_QUICK_PROMPTS = ['Shipping info', 'Return policy', 'Track order', 'Payment methods'];

const PHARMACY_QUICK_PROMPTS = [
  'I have a headache',
  'Cold and cough',
  'Upload prescription',
  'Set refill reminder',
];

const EV_BIKES_QUICK_PROMPTS = [
  'PAVE Govt Subsidy',
  'Lithium Battery Warranty',
  'Calculate Installments',
  'Book Test Ride',
];

function openStoreChatEventName() {
  return 'tenvo:open-store-chat';
}

const SHELL_CLASS = cn(
  'fixed flex flex-col items-end',
  STOREFRONT_FLOAT_RIGHT,
  STOREFRONT_FLOAT_BOTTOM,
  STOREFRONT_CHAT_Z
);

function ChatFab({ accent, onClick, showPulse = true, isEvStore = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95',
        isEvStore
          ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-lg'
          : 'text-white'
      )}
      style={isEvStore ? {} : { backgroundColor: accent }}
      aria-label="Open chat"
    >
      <MessageCircle className={cn('h-6 w-6 text-white')} aria-hidden />
      {showPulse ? (
        <span
          className={cn(
            'absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2',
            isEvStore ? 'border-black bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]' : 'border-white bg-green-400'
          )}
        />
      ) : null}
    </button>
  );
}

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { settings, business, businessDomain } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const storeName = business?.business_name || 'Support';
  const pharmacyStore = isPharmacyElevatedStore(business?.category);
  const evStore = isEvBikesStore(business?.category);

  const quickPrompts = pharmacyStore
    ? PHARMACY_QUICK_PROMPTS
    : evStore
      ? EV_BIKES_QUICK_PROMPTS
      : GENERIC_QUICK_PROMPTS;

  const assistantSubtitle = pharmacyStore
    ? 'AI health assistant · Not a substitute for professional care'
    : evStore
      ? '⚡ EV Mobility Expert · Instant Test Ride & Specs'
      : 'Store assistant · Public help only';

  const fetchReply = useCallback(
    async (message, { greeting = false } = {}) => {
      const res = await fetch(`/api/storefront/${encodeURIComponent(businessDomain)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(greeting ? { greeting: true } : { message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.reply) {
        throw new Error(data?.error || 'Unable to reach store assistant');
      }
      return data.reply;
    },
    [businessDomain]
  );

  const seedGreetingIfEmpty = useCallback(async () => {
    if (messages.length > 0) return;
    try {
      const reply = await fetchReply('', { greeting: true });
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: `Hi! Welcome to ${storeName}. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [fetchReply, messages.length, storeName]);

  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setIsMinimized(false);
      void seedGreetingIfEmpty();
    };
    window.addEventListener(openStoreChatEventName(), handler);
    return () => window.removeEventListener(openStoreChatEventName(), handler);
  }, [seedGreetingIfEmpty]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      void seedGreetingIfEmpty();
    }
  }, [isOpen, isMinimized, seedGreetingIfEmpty]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendUserMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await fetchReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          text: reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          text: err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    void sendUserMessage(input);
  };

  const fmt = (d) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isOpen) {
    return (
      <div className={SHELL_CLASS}>
        <ChatFab
          accent={accent}
          onClick={() => setIsOpen(true)}
          isEvStore={evStore}
        />
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className={SHELL_CLASS}>
        <ChatFab
          accent={accent}
          onClick={() => setIsMinimized(false)}
          showPulse={false}
          isEvStore={evStore}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        SHELL_CLASS,
        'w-[calc(100vw-2rem)] max-w-[360px]',
        'h-[min(520px,calc(100vh-6rem-env(safe-area-inset-bottom)))] lg:h-[520px]'
      )}
    >
      <div className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-2xl shadow-2xl border',
        evStore
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-gray-100'
      )}>
        {/* Header */}
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-between px-4 py-3',
            evStore ? 'bg-slate-900 border-b border-slate-800 text-white' : ''
          )}
          style={evStore ? {} : { backgroundColor: accent }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className={cn(
                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2',
                evStore ? 'border-slate-900 bg-red-500' : 'border-white bg-green-400'
              )} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">{storeName}</p>
              <p className={cn('mt-0.5 text-xs', evStore ? 'text-slate-300 font-medium' : 'text-white/70')}>
                {assistantSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/15"
              aria-label="Minimise"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/15"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className={cn('flex-1 space-y-3 overflow-y-auto p-4', evStore ? 'bg-slate-950' : 'bg-gray-50')}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.type === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.type === 'user'
                    ? evStore
                      ? 'rounded-br-sm bg-red-600 text-white font-bold shadow-sm'
                      : 'rounded-br-sm text-white'
                    : evStore
                      ? 'rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-200 shadow-sm'
                      : 'rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm'
                )}
                style={msg.type === 'user' && !evStore ? { backgroundColor: accent } : {}}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={cn(
                    'mt-1 block text-[10px]',
                    msg.type === 'user'
                      ? evStore ? 'text-right text-red-200' : 'text-right text-white/60'
                      : evStore ? 'text-slate-400' : 'text-gray-400'
                  )}
                >
                  {fmt(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isTyping ? (
            <div className="flex justify-start">
              <div className={cn(
                'rounded-2xl rounded-bl-sm border px-4 py-3 shadow-sm',
                evStore ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'
              )}>
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className={cn('h-2 w-2 animate-bounce rounded-full', evStore ? 'bg-red-500' : 'bg-gray-400')}
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 ? (
          <div className={cn('flex flex-wrap gap-1.5 px-4 pb-2', evStore ? 'bg-slate-950' : 'bg-gray-50')}>
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void sendUserMessage(q)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-colors',
                  evStore
                    ? 'border border-slate-700 bg-slate-800 text-slate-200 font-bold hover:bg-red-600 hover:text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}

        {/* Input Form */}
        <form onSubmit={handleSend} className={cn(
          'flex gap-2 border-t px-4 py-3',
          evStore ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'
        )}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pharmacyStore ? 'Describe symptoms or ask about medicines…' : evStore ? 'Ask EV specs, PAVE subsidy, or installments…' : 'Type a message…'}
            className={cn(
              'flex-1 rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2',
              evStore
                ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-red-500'
                : 'border-gray-200 bg-gray-50 text-neutral-900 focus:border-transparent'
            )}
            style={evStore ? {} : { '--tw-ring-color': accent }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-40',
              evStore
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : 'text-white'
            )}
            style={evStore ? {} : { backgroundColor: accent }}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
