import type { ChatMessage } from "@/domain/chat";
import { ProposedActionCard } from "./ProposedActionCard";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2`}>
        <div
          className={`rounded-[20px] px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isUser ? "bg-accent text-white" : "bg-surface-secondary text-foreground"
          }`}
        >
          {message.content}
        </div>
        {message.isFallback && (
          <p className="text-[11px] text-text-muted px-1">Answered without AI (deterministic fallback)</p>
        )}
        {message.proposedActions && message.proposedActions.length > 0 && (
          <div className="space-y-2">
            {message.proposedActions.map((action) => (
              <ProposedActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
