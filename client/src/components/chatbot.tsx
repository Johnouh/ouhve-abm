import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "안녕하세요! 헬스장 운영 AI 어시스턴트입니다. 회원 관리, 매출 분석, 운영 관련 궁금한 점을 물어보세요." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/chat", {
        messages: newMessages.filter(m => m.role !== "assistant" || newMessages.indexOf(m) > 0),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "죄송합니다, 오류가 발생했습니다." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "죄송합니다, 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* 챗봇 토글 버튼 */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isOpen
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:text-gray-900 hover-elevate"
        }`}
      >
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span>AI 챗봇</span>
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500" />
        )}
      </button>

      {/* 챗 패널 */}
      {isOpen && (
        <div className="fixed top-[56px] right-4 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">AI 어시스턴트</span>
              <span className="text-xs bg-purple-500 px-1.5 py-0.5 rounded-full">Claude</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover-elevate rounded-lg p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>생각 중...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 빠른 질문 버튼 */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {["이번 달 매출 요약", "이탈 위험 회원 있나요?", "회원 현황 알려줘"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover-elevate transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 입력창 */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="flex-1 text-sm bg-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-purple-600 hover-elevate text-white rounded-xl h-8 w-8 p-0 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
