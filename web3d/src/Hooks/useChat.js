import { useState, useCallback } from "react";

const API_BASE = "/api";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || loading) return;

      const userMessage = {
        id: Date.now(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const body = {
          message: content.trim(),
          session_id: sessionId,
        };

        const res = await fetch(`${API_BASE}/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to send message");
        }

        if (data.session_id && !sessionId) {
          setSessionId(data.session_id);
        }

        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.response,
          sources: data.sources || [],
          relevance: data.relevance || "unknown",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          error: true,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading]
  );

  const clearChat = useCallback(() => {
    if (sessionId) {
      fetch(`${API_BASE}/chat/history/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
    setMessages([]);
    setSessionId(null);
  }, [sessionId]);

  return {
    messages,
    loading,
    isOpen,
    toggleChat,
    sendMessage,
    clearChat,
    messageCount: messages.length,
  };
}
