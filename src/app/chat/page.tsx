"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Message = {
  _id: string;
  message: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
};

function ChatContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    if (!userId) {
      setError("Chat user not found.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/chat?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        setError("");
      } else {
        setError(data.message || "Unable to load chat.");
      }
    } catch {
      setError("Unable to load chat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!text.trim() || !userId) return;

    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: userId,
          message: text,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setText("");
        await loadMessages();
      } else {
        alert(data.message || "Message could not be sent.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-5">
          <h1 className="text-2xl font-bold">
            Private Chat
          </h1>

          <p className="text-blue-100 text-sm mt-1">
            Mentor and mentee communication
          </p>
        </div>

        {/* Video Meeting */}
        <div className="px-5 py-4 bg-white border-b">
          {userId && (
            <a
              href={`/video-meeting?userId=${userId}`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Start Video Meeting
            </a>
          )}
        </div>

        {/* Chat Area */}
        <div className="h-[550px] overflow-y-auto p-5 bg-slate-100">

          {loading ? (
            <p className="text-center text-gray-500 mt-10">
              Loading messages...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 mt-10">
              {error}
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">
              No messages yet. Start the conversation.
            </p>
          ) : (
            <div className="space-y-3">

              {messages.map((item) => {

                const isMine =
                  item.sender?._id !== userId;

                return (
                  <div
                    key={item._id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[75%] px-4 py-3 shadow-sm ${
                        isMine
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                          : "bg-white text-gray-800 border rounded-2xl rounded-bl-md"
                      }`}
                    >

                      <div
                        className={`text-xs font-semibold mb-1 ${
                          isMine
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {isMine
                          ? "You"
                          : item.sender?.name}
                      </div>

                      <p className="text-[15px] whitespace-pre-wrap break-words">
                        {item.message}
                      </p>

                      <div
                        className={`text-[10px] mt-1 text-right ${
                          isMine
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(
                          item.createdAt
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />

            </div>
          )}

        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 bg-white border-t flex gap-3"
        >

          <input
            type="text"
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={
              sending || !text.trim()
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-full font-semibold"
          >
            {sending ? "Sending..." : "Send"}
          </button>

        </form>

      </div>
    </div>
  );
}
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <p className="text-gray-500">Loading chat...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
