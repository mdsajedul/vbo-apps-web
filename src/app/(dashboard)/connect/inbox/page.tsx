"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { connectApi, ConnectConversation, ConnectMessage } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  Inbox,
  MessageSquare,
  Search,
  Send,
  Phone,
  Check,
  CheckCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  User,
  Sparkles,
  Paperclip,
  Smile,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConnectInboxPage() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone");

  const [conversations, setConversations] = useState<ConnectConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ConnectConversation | null>(null);
  const [messages, setMessages] = useState<ConnectMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [activeChannel, setActiveChannel] = useState<"all" | "whatsapp" | "email" | "webchat">("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const data = await connectApi.getConversations({
        channel: activeChannel === "all" ? undefined : activeChannel,
      });
      const list = Array.isArray(data) ? data : [];
      setConversations(list);

      // If active conversation is not selected, pick the first one or matching initialPhone
      if (!activeConv && list.length > 0) {
        if (initialPhone) {
          const match = list.find((c) => c.contactPhone === initialPhone);
          setActiveConv(match || list[0]);
        } else {
          setActiveConv(list[0]);
        }
      }
    } catch (err: any) {
      console.warn("Could not load conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeChannel]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    const threadId = activeConv.id || activeConv._id;
    if (!threadId) return;

    let isMounted = true;
    async function loadThread(id: string) {
      setLoadingMessages(true);
      try {
        const msgs = await connectApi.getMessages(id);
        if (isMounted) {
          setMessages(Array.isArray(msgs) ? msgs : []);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err: any) {
        console.warn("Failed to load message thread:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadThread(threadId);
    return () => {
      isMounted = false;
    };
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !newMessage.trim()) return;
    const convId = activeConv.id || activeConv._id;
    if (!convId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic UI update
    const optimisticMsg: ConnectMessage = {
      conversationId: convId,
      sender: "agent",
      senderName: "You",
      content,
      status: "SENT",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      await connectApi.sendMessage(convId, content);
      // Refresh thread
      const updated = await connectApi.getMessages(convId);
      setMessages(Array.isArray(updated) ? updated : []);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver message");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!activeConv) return;
    const convId = activeConv.id || activeConv._id;
    if (!convId) return;

    try {
      await connectApi.resolveConversation(convId);
      toast.success("Conversation marked as resolved");
      await fetchConversations();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve conversation");
    }
  };

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    const nameMatch = (c.contactName || "").toLowerCase().includes(q);
    const phoneMatch = (c.contactPhone || "").includes(q);
    const contentMatch = (c.lastMessage?.content || "").toLowerCase().includes(q);
    return nameMatch || phoneMatch || contentMatch;
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-4 sm:-m-6 lg:-m-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT PANEL: CONVERSATIONS LIST
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/50 ${
          activeConv ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h1 className="font-bold text-base text-slate-900 dark:text-white">
                Shared Inbox
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConversations}
              className="h-8 w-8 p-0 text-slate-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search chat or phone..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-950"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "All" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "webchat", label: "Web Chat" },
              { id: "email", label: "Email" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChannel(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeChannel === tab.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {loadingConvs ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span>Loading messages...</span>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No conversations found in this view.</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const convId = conv.id || conv._id || "";
              const isActive = (activeConv?.id || activeConv?._id) === convId;
              const contactName = conv.contactName || conv.contactPhone || "Customer";

              return (
                <button
                  key={convId}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition-all ${
                    isActive
                      ? "bg-purple-50/80 dark:bg-purple-500/10 border-l-4 border-purple-600"
                      : "hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {contactName.slice(0, 2).toUpperCase()}
                    </div>
                    {conv.channel === "whatsapp" && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        W
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {contactName}
                      </span>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>

                  {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. RIGHT PANEL: ACTIVE MESSAGE THREAD & COMPOSER
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-slate-950 ${
          !activeConv ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="font-semibold text-sm">Select a conversation to start chatting</p>
            <p className="text-slate-500">Omnichannel messages update in real time.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 font-bold text-xs flex items-center justify-center">
                  {(activeConv.contactName || "C").slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeConv.contactName || activeConv.contactPhone || "Customer"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      {activeConv.channel}
                    </span>
                  </div>
                  {activeConv.contactPhone && (
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {activeConv.contactPhone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResolve}
                  className="text-xs gap-1 border-slate-200 dark:border-slate-800"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Resolve</span>
                </Button>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/20 dark:bg-slate-950">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span>Fetching conversation history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No messages in this conversation yet. Send the first message below.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAgent = msg.sender === "agent";
                  const time = msg.timestamp || msg.createdAt;

                  return (
                    <div
                      key={msg.id || msg._id || idx}
                      className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isAgent
                            ? "bg-purple-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                        {time && (
                          <span>
                            {new Date(time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {isAgent && (
                          <CheckCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Type a WhatsApp or direct response (Enter to send)..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 text-xs h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />

                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="h-10 px-4 text-xs bg-purple-600 hover:bg-purple-500 text-white gap-1.5 font-bold shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
