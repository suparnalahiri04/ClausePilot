import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquareText,
  X,
  Send,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  Minimize2,
} from 'lucide-react';

interface CopilotCitation {
  contractTitle: string;
  counterparty: string;
  sectionRef: string;
  verbatimQuote: string;
  charSpan: string;
  route: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  verified?: boolean;
  citations?: CopilotCitation[];
}

const PRESET_QUESTIONS = [
  'What is the penalty for late termination?',
  'Which contracts have uncapped liability?',
  'What are the auto-renewal notice deadlines?',
  'What happens if we pay an invoice late?',
];

const SIMULATED_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  answer: string;
  citations: CopilotCitation[];
}> = [
  {
    keywords: ['penalty', 'terminate', 'termination', 'cancel', 'cancellation', 'early', 'exit'],
    answer:
      'Across your active portfolio, early termination carries strict financial penalties. In the Veridian Cloud MSA and Northstar AI Compute Agreement, Customer cannot terminate for convenience and remains liable for 100% of remaining committed fees, while Aurelia Workspace charges a 6-month liquidated early exit fee ($210,000).',
    citations: [
      {
        contractTitle: 'Veridian Cloud Infrastructure & Data Platform MSA',
        counterparty: 'Veridian Cloud Systems, Inc.',
        sectionRef: 'Section 3.1 (Term & Asymmetrical Termination)',
        verbatimQuote:
          'Provider may terminate this Agreement for convenience upon thirty (30) days written notice. Customer shall have no right to terminate this Agreement for convenience during the Initial Term or any Renewal Term and remains liable for 100% of contracted annual fees.',
        charSpan: 'Chars 642–918',
        route: '/risks?category=termination',
      },
      {
        contractTitle: 'Aurelia Flagship Commercial Office Lease',
        counterparty: 'Aurelia Workspace REIT',
        sectionRef: 'Section 6.2 (Early Exit Fee)',
        verbatimQuote:
          'Early termination by Tenant prior to Expiration Date requires payment of an Early Exit Fee equal to six (6) months of Base Rent ($210,000 USD) plus unamortized tenant improvement allowances.',
        charSpan: 'Chars 1,412–1,608',
        route: '/risks?category=termination',
      },
    ],
  },
  {
    keywords: ['liability', 'cap', 'uncapped', 'indemnification', 'indemnity', 'damages'],
    answer:
      'Two agreements contain high-priority liability cap risks. Veridian Cloud caps general liability at only 3 months of fees ($46,000) while carving out uncapped Customer liability for confidentiality and IP claims. Northstar AI limits Provider liability to 1 month of fees ($26,666) with uncapped Customer indemnification.',
    citations: [
      {
        contractTitle: 'Veridian Cloud Infrastructure & Data Platform MSA',
        counterparty: 'Veridian Cloud Systems, Inc.',
        sectionRef: 'Section 5.1 (Limitation of Liability)',
        verbatimQuote:
          "Provider's aggregate cumulative liability shall not exceed the fees paid by Customer in the three (3) months preceding the claim ($46,000). Customer's liability for data privacy, confidentiality, or IP indemnification claims shall be strictly uncapped.",
        charSpan: 'Chars 1,320–1,589',
        route: '/risks?category=liability',
      },
    ],
  },
  {
    keywords: ['renewal', 'auto-renewal', 'notice', 'deadline', 'uplift', 'expire'],
    answer:
      'Your contracts have strict non-renewal notice windows ranging from 90 to 180 days, paired with automatic annual price uplifts of 7% to 9% if notice is missed.',
    citations: [
      {
        contractTitle: 'Veridian Cloud Infrastructure & Data Platform MSA',
        counterparty: 'Veridian Cloud Systems, Inc.',
        sectionRef: 'Section 2.2 (Auto-Renewal & Price Uplift)',
        verbatimQuote:
          'This Agreement shall automatically renew for successive twenty-four (24) month Renewal Terms unless Customer delivers written non-renewal notice at least ninety (90) days prior to expiration. Renewal Terms are subject to an automatic 8.5% annual fee increase.',
        charSpan: 'Chars 318–612',
        route: '/obligations',
      },
      {
        contractTitle: 'Aurelia Flagship Commercial Office Lease',
        counterparty: 'Aurelia Workspace REIT',
        sectionRef: 'Section 2.1 (180-Day Notice Window)',
        verbatimQuote:
          'Lease automatically extends for an additional thirty-six (36) month term unless Tenant provides irrevocable written notice at least one hundred eighty (180) days prior to Expiration Date.',
        charSpan: 'Chars 410–605',
        route: '/obligations',
      },
    ],
  },
  {
    keywords: ['payment', 'invoice', 'late', 'interest', 'net 15', 'fee', 'billing'],
    answer:
      'Both Veridian Cloud and Northstar AI enforce accelerated Net 15 payment terms with 1.5% monthly (18% APR) compounding late interest and immediate service suspension rights if an invoice is more than 10 days past due.',
    citations: [
      {
        contractTitle: 'Northstar Enterprise AI Compute Agreement',
        counterparty: 'Northstar AI Labs Corp.',
        sectionRef: 'Section 4.2 (Payment & Take-or-Pay)',
        verbatimQuote:
          'All quarterly take-or-pay invoices are due Net 15. Overdue balances accrue late interest at 1.5% per month (18% per annum) and entitle Provider to suspend GPU cluster access upon 10 days notice.',
        charSpan: 'Chars 980–1,195',
        route: '/risks?category=payment',
      },
    ],
  },
];

function generateCopilotResponse(query: string): {
  answer: string;
  citations: CopilotCitation[];
} {
  const q = query.toLowerCase();
  for (const item of SIMULATED_KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return { answer: item.answer, citations: item.citations };
    }
  }

  return {
    answer:
      'I scanned your contract portfolio and verified the relevant commercial clauses. Here are the primary obligations and termination provisions grounded in your active agreements:',
    citations: [
      {
        contractTitle: 'Veridian Cloud Infrastructure & Data Platform MSA',
        counterparty: 'Veridian Cloud Systems, Inc.',
        sectionRef: 'Section 3.1 & Section 5.1',
        verbatimQuote:
          'Customer shall provide written non-renewal notice at least ninety (90) days prior to the end of the Initial Term; early termination for convenience by Customer is not permitted and full annual commitment remains payable.',
        charSpan: 'Chars 642–884',
        route: '/contracts',
      },
    ],
  };
}

export const AskClausePilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Hi! I am your ClausePilot AI Contract Copilot. Ask me any plain-English question about termination penalties, liability limits, auto-renewals, or payment terms—every answer includes verbatim document highlights.',
      timestamp: 'Just now',
      verified: true,
      citations: [
        {
          contractTitle: 'Veridian Cloud Infrastructure & Data Platform MSA',
          counterparty: 'Veridian Cloud Systems, Inc.',
          sectionRef: 'Section 2.2 (Auto-Renewal Clause)',
          verbatimQuote:
            'Agreement automatically renews for 24-month terms unless written notice is received at least 90 days prior to expiration, with an 8.5% annual rate uplift.',
          charSpan: 'Chars 318–490',
          route: '/risks',
        },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (questionText?: string) => {
    const query = (questionText ?? input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateCopilotResponse(query);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verified: true,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Glassmorphic Chat Drawer */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[420px] max-h-[600px] flex flex-col backdrop-blur-md bg-white/95 border-2 border-pink-500/30 rounded-3xl shadow-editorial-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-4 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-display font-extrabold text-sm flex items-center gap-1.5">
                  <span>Ask ClausePilot</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                    Verified AI
                  </span>
                </div>
                <div className="text-[11px] text-white/85">
                  Instant Q&amp;A with Verbatim Source Highlights
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label="Close Ask ClausePilot drawer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Starter Prompts Strip */}
          <div className="px-4 py-2.5 bg-[#FAF8F3] border-b border-pink-500/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {PRESET_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-pink-50 text-[#20233A] hover:text-pink-700 border border-pink-500/20 whitespace-nowrap transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[360px] bg-gradient-to-b from-[#FAF8F3]/50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium rounded-br-sm shadow-sm'
                      : 'bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] rounded-bl-sm space-y-2.5 shadow-editorial'
                  }`}
                >
                  {msg.role === 'assistant' && msg.verified && (
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-pink-500/10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F9D91] bg-[#E6F7F5] px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        VERIFIED_EXACT • Source Grounded
                      </span>
                      <span className="text-[10px] text-[#575B75]">{msg.timestamp}</span>
                    </div>
                  )}

                  <p>{msg.text}</p>

                  {/* Verbatim Source Text Highlights */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Verbatim Contract Highlights ({msg.citations.length})</span>
                      </div>
                      {msg.citations.map((cit, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-pink-500/25 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[#20233A] truncate">
                              {cit.contractTitle}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded shrink-0">
                              {cit.charSpan}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-[#575B75]">
                            {cit.sectionRef} • {cit.counterparty}
                          </div>
                          <blockquote className="p-2 rounded-lg bg-pink-50/75 border-l-2 border-pink-600 text-[11px] text-[#20233A] italic leading-snug">
                            &ldquo;{cit.verbatimQuote}&rdquo;
                          </blockquote>
                          <button
                            type="button"
                            onClick={() => navigate(cit.route)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-600 hover:text-pink-700 pt-0.5"
                          >
                            <span>Inspect Clause in Workspace</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#575B75] bg-[#FAF8F3] px-3.5 py-2.5 rounded-2xl border border-pink-500/15 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-pink-600 animate-spin" />
                <span>Scanning contract text &amp; fact-checking quotes...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-pink-500/15 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about penalties, renewals, or liability..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-xs text-[#20233A] placeholder:text-[#575B75]/70 focus:outline-none focus:border-pink-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white shadow-magenta transition-all shrink-0"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Bottom-Right Launcher Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl backdrop-blur-md bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta border border-white/25 transition-all hover:scale-[1.02]"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-4 h-4 text-white" />
          ) : (
            <MessageSquareText className="w-4 h-4 text-white" />
          )}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0F9D91] ring-2 ring-white" />
          )}
        </div>
        <span className="font-display font-extrabold text-xs tracking-tight">
          Ask ClausePilot
        </span>
        <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
          AI Copilot
        </span>
      </button>
    </div>
  );
};

