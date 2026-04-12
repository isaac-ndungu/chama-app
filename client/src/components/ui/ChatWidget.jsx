import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

const WELCOME = `Habari! I'm Jahazi 👋

I can help you with:
- Recording and verifying contributions
- How the rotation (mzunguko) works  
- Loan applications and voting
- Your role and permissions

What would you like to know?`;

const QUICK_REPLIES = [
    'How does verification work?',
    'How does the rotation work?',
    'How do I apply for a loan?',
    'Why is disbursement greyed out?',
];

function TypingIndicator() {
    return (
        <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">C</div>
            <div className="bg-white border border-[#E8E4DF] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#9E9690] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

function Message({ role, text }) {
    const isUser = role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">
                    C
                </div>
            )}
            <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isUser
                        ? 'bg-amber-600 text-white rounded-tr-sm'
                        : 'bg-white border border-[#E8E4DF] text-[#1C1814] rounded-tl-sm'
                    }`}
                style={{ whiteSpace: 'pre-wrap' }}
            >
                {text}
            </div>
        </div>
    );
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState([]);  // Gemini format: { role, parts: [{ text }] }
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, loading]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    const send = async (text) => {
        const message = (text || input).trim();
        if (!message || loading) return;

        const userMsg = { role: 'user', parts: [{ text: message }] };
        const newHistory = [...history, userMsg];

        setHistory(newHistory);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/support/chat', { messages: newHistory });
            setHistory(prev => [
                ...prev,
                { role: 'model', parts: [{ text: res.data.message }] },
            ]);
        } catch (err) {
            const errText = err.response?.data?.error || 'Something went wrong. Please try again.';
            setHistory(prev => [
                ...prev,
                { role: 'model', parts: [{ text: `Sorry, I had trouble responding. ${errText}` }] },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    // All display messages: welcome + history
    const displayMessages = [
        { role: 'model', parts: [{ text: WELCOME }] },
        ...history,
    ];

    return (
        <>
            {/* Chat window */}
            {open && (
                <div className="fixed bottom-20 right-5 w-90 max-h-140 bg-[#F8F6F3] border border-[#E8E4DF] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">

                    {/* Header */}
                    <div className="bg-[#1C1814] px-4 py-3.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                                C
                            </div>
                            <div>
                                <div className="text-white font-semibold text-[14px]">Jahazi</div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    <span className="text-white/50 text-[10px]">AI Support · Always available</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/40 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                        {displayMessages.map((m, i) => (
                            <Message key={i} role={m.role} text={m.parts[0].text} />
                        ))}
                        {loading && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick replies — only shown before first user message */}
                    {history.length === 0 && !loading && (
                        <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
                            {QUICK_REPLIES.map(q => (
                                <button
                                    key={q}
                                    onClick={() => send(q)}
                                    className="text-[11px] bg-white border border-[#E8E4DF] text-[#6B6560] px-3 py-1.5 rounded-full hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-4 pb-4 shrink-0">
                        <div className="flex items-end gap-2 bg-white border border-[#E8E4DF] rounded-xl px-3 py-2 focus-within:border-amber-500 transition">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Ask anything about ChamaLedger..."
                                rows={1}
                                disabled={loading}
                                className="flex-1 resize-none text-[13px] text-[#1C1814] placeholder-[#9E9690] bg-transparent focus:outline-none max-h-24 py-0.5"
                                style={{ lineHeight: '1.4' }}
                            />
                            <button
                                onClick={() => send()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.697H13.5a.75.75 0 010 1.5H4.182l-1.903 6.697a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.114A28.897 28.897 0 003.105 2.289z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[10px] text-[#9E9690] mt-1.5 text-center">
                            Powered by Google Gemini · Do not share financial details
                        </p>
                    </div>
                </div>
            )}

            {/* Floating button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={`fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${open
                        ? 'bg-[#1C1814] scale-95'
                        : 'bg-amber-600 hover:bg-amber-700 hover:scale-105'
                    }`}
                title="Chat with Jahazi"
            >
                {open ? (
                    <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                    </svg>
                )}
            </button>
        </>
    );
}