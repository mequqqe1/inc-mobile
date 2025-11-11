import api from "../api/client";

export type ConversationListItem = {
  id: string;
  childId: string;
  title: string;
  turnCount: number;
  updatedAtUtc: string;
};

export type MessageDto = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAtUtc: string;
};

export async function listConversations(): Promise<ConversationListItem[]> {
  const { data } = await api.get("/api/zeynai/conversations");
  return data;
}

export async function createOrGetConversation(input: {
  childId: string;
  title?: string | null;
}): Promise<{ id: string }> {
  const { data } = await api.post("/api/zeynai/conversations", input);
  return data;
}

export async function getMessages(
  conversationId: string,
  params: { skip?: number; take?: number } = {}
): Promise<MessageDto[]> {
  const { data } = await api.get(
    `/api/zeynai/conversations/${conversationId}/messages`,
    { params: { skip: params.skip ?? 0, take: params.take ?? 50 } }
  );
  return data;
}

export async function sendMessage(conversationId: string, message: string) {
  await api.post(`/api/zeynai/conversations/${conversationId}/send`, { message });
}

export async function patchConversation(
  conversationId: string,
  input: { title?: string | null; archived?: boolean | null }
) {
  await api.patch(`/api/zeynai/conversations/${conversationId}`, input);
}
