import { useCallback, useEffect, useRef, useState } from "react";
import { buildZeynHub } from "../services/signalr";
import {
  ConversationListItem,
  MessageDto,
  createOrGetConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "../api/zeynai";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://89.207.250.222:5062";

// =======================
// список диалогов
// =======================
export function useZeynAI() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      const items = await listConversations();
      setConversations(items);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить беседы");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const ensureConversation = useCallback(async (childId: string, title?: string | null) => {
    const { id } = await createOrGetConversation({ childId, title: title ?? undefined });
    return id;
  }, []);

  return { conversations, loadingList, error, refresh, ensureConversation } as const;
}

// =======================
// чат
// =======================
export function useZeynChat(conversationId: string) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState("");
  const liveRef = useRef("");
  const connectionRef = useRef<ReturnType<typeof buildZeynHub> | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    liveRef.current = liveText;
  }, [liveText]);

  const take = 50;

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    const page = await getMessages(conversationId, { skip, take });
    setMessages((prev) => [...page, ...prev]); // prepend старые
    setSkip((s) => s + page.length);
    setHasMore(page.length === take);
  }, [conversationId, skip, hasMore]);

  // начальная загрузка сообщений
  useEffect(() => {
    setMessages([]);
    setSkip(0);
    setHasMore(true);
    setLiveText("");
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const connect = useCallback(async () => {
    if (connectionRef.current) return;
    const conn = buildZeynHub(API_BASE);
    connectionRef.current = conn;

    if (!subscribedRef.current) {
      // подписка только один раз
      conn.on("started", () => setStreaming(true));

      conn.on("token", (p: any) => {
        const text = typeof p === "string" ? p : p?.text || "";
        if (text) setLiveText((t) => t + text);
      });

      conn.on("done", (p: any) => {
        const text = liveRef.current.trim();
        if (text) {
          const msg: MessageDto = {
            id: p?.messageId || `srv_${Date.now()}`,
            role: "assistant",
            content: text,
            createdAtUtc: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, msg]);
        }
        setLiveText("");
        setStreaming(false);
      });

      conn.on("error", () => setStreaming(false));

      subscribedRef.current = true;
    }

    await conn.start().catch(() => {});
    try {
      // если в хабе есть Join
      // @ts-ignore
      await conn.invoke?.("Join", conversationId);
    } catch {}
  }, [conversationId]);

  const disconnect = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return;
    try {
      conn.off("started");
      conn.off("token");
      conn.off("done");
      conn.off("error");
      await conn.stop();
    } catch {}
    subscribedRef.current = false;
    connectionRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const msg: MessageDto = {
        id: `tmp_${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAtUtc: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      setLiveText("");
      setStreaming(true);

      await sendMessage(conversationId, trimmed);
    },
    [conversationId]
  );

  return { messages, hasMore, loadMore, send, streaming, liveText } as const;
}
