import type { ChatMessage } from "@/domain/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
          className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
            isUser ? "bg-surface-secondary text-foreground" : "bg-white text-foreground"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="break-words [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-text-secondary [&_code]:rounded [&_code]:bg-surface-secondary [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : null}
              {message.status === "pending" && (
                <span aria-label="Streaming response" className="inline-block h-4 w-1 animate-pulse rounded-full bg-text-muted align-middle" />
              )}
            </div>
          )}
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
