export type ChatSender = "coach" | "user";

export type ChatMessage = {
    id: string;
    sender: ChatSender;
    text: string;
    createdAt: string;
};

export const CHAT_STORAGE_KEY = "future-mindset-chat";

export function createChatMessage(sender: ChatSender, text: string): ChatMessage {
    return {
        id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        sender,
        text: text.trim(),
        createdAt: new Date().toISOString(),
    };
}

export function formatChatTimestamp(value: string | Date) {
    const date = typeof value === "string" ? new Date(value) : value;

    return new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export function buildChatThread(
    initialMessages: Array<{ sender: ChatSender; text: string }> = [],
): ChatMessage[] {
    return initialMessages.map(({ sender, text }) => createChatMessage(sender, text));
}

export function loadChatMessages(): ChatMessage[] {
    if (typeof window === "undefined") {
        return buildChatThread([{ sender: "coach", text: "DZ, I’m here. What’s on your mind tonight?" }]);
    }

    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) {
        return buildChatThread([{ sender: "coach", text: "DZ, I’m here. What’s on your mind tonight?" }]);
    }

    try {
        const parsed = JSON.parse(stored) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return buildChatThread([{ sender: "coach", text: "DZ, I’m here. What’s on your mind tonight?" }]);
        }

        return parsed.filter((entry): entry is ChatMessage => Boolean(entry) && typeof entry === "object" && "sender" in entry && "text" in entry && "createdAt" in entry) as ChatMessage[];
    } catch {
        return buildChatThread([{ sender: "coach", text: "DZ, I’m here. What’s on your mind tonight?" }]);
    }
}

export function saveChatMessages(messages: ChatMessage[]) {
    if (typeof window === "undefined") {
        return messages;
    }

    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new Event("mindset-store-update"));
    return messages;
}

export function groupMessagesBySender(messages: ChatMessage[]) {
    const groups: Array<{ sender: ChatSender; items: ChatMessage[] }> = [];

    messages.forEach((message) => {
        const previous = groups[groups.length - 1];
        const sameSender = previous && previous.sender === message.sender;

        if (sameSender) {
            previous.items.push(message);
            return;
        }

        groups.push({ sender: message.sender, items: [message] });
    });

    return groups;
}
