export type ChatSender = "coach" | "user";

export type ChatMessage = {
    id: string;
    sender: ChatSender;
    text: string;
    createdAt: string;
};

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
