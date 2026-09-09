import type { ChatMessage } from "@/domain/chat";
import { ProposedActionCard } from "./ProposedActionCard";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[10px] font-semibold text-white">
          F5
        </div>
      )}
      <div className="max-w-[85%] space-y-2 md:max-w-[75%]">
        <div
          className={`rounded-[22px] px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
            isUser ? "bg-surface-secondary text-foreground" : "bg-white text-foreground"
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
