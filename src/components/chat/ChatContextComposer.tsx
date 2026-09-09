"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getClientMentionOptions,
  getProfessionalMentionOptions,
  readMentionToken,
  type ClientMentionOption,
  type MentionToken,
  type ProfessionalMentionOption,
} from "@/domain/chat/contextMentions";
import type { ChatContextAttachment } from "@/domain/chat";
import type { Seed } from "@/domain/types";

type MentionOption = ClientMentionOption | ProfessionalMentionOption;

export function ChatContextComposer({
  seed,
  context,
  selectedClientId,
  onSelectClient,
  onAttachContext,
  onClearClient,
  onClearProfessional,
  onSend,
  disabled,
  variant = "compact",
}: {
  seed: Seed;
  context: ChatContextAttachment | null;
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAttachContext: (context: ChatContextAttachment) => void;
  onClearClient: () => void;
  onClearProfessional: () => void;
  onSend: (text: string) => void;
  disabled?: boolean;
  variant?: "welcome" | "compact";
}) {
  const [text, setText] = useState("");
  const [mention, setMention] = useState<MentionToken | null>(null);
  const [activeOption, setActiveOption] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const client = selectedClientId ? seed.clients.find((candidate) => candidate.id === selectedClientId) : null;
  const professional = context ? seed.professionals.find((candidate) => candidate.id === context.professionalId) : null;

  const options = useMemo<MentionOption[]>(() => {
    if (!mention) return [];
    if (mention.trigger === "@") return getClientMentionOptions(seed, mention.query);
    if (!selectedClientId) return [];
    return getProfessionalMentionOptions(seed, selectedClientId, mention.query);
  }, [mention, seed, selectedClientId]);

  function removeMentionToken(token: MentionToken) {
    const next = `${text.slice(0, token.start)}${text.slice(token.end)}`;
    setText(next);
    setMention(null);
    window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(token.start, token.start);
    }, 0);
  }

  function chooseOption(option: MentionOption) {
    if (!mention) return;
    if (mention.trigger === "@") onSelectClient(option.id);
    else onAttachContext((option as ProfessionalMentionOption).context);
    removeMentionToken(mention);
  }

  function handleSend() {
    if (!context || !text.trim()) return;
    onSend(text.trim());
    setText("");
    setMention(null);
  }

  return (
    <div aria-label="Message composer" className="w-full">
      {(client || professional) && (
        <div aria-label="Attached chat context" className="mb-2 flex flex-wrap items-center gap-2 px-2">
          {client && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ff] px-3 py-1.5 text-xs font-medium text-accent">
              <span aria-hidden="true">@</span>{client.companyName}
              <button type="button" aria-label={`Remove ${client.companyName}`} onClick={onClearClient} className="ml-0.5 text-base leading-none text-accent/70 hover:text-accent">×</button>
            </span>
          )}
          {professional && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff8f2] px-3 py-1.5 text-xs font-medium text-[#16854b]">
              <span aria-hidden="true">/</span>{professional.fullName}
              <button type="button" aria-label={`Remove ${professional.fullName}`} onClick={onClearProfessional} className="ml-0.5 text-base leading-none text-[#16854b]/70 hover:text-[#16854b]">×</button>
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {mention && (
          <div role="listbox" aria-label={mention.trigger === "@" ? "Clients" : "Active professionals"} className={`absolute left-0 z-50 max-h-64 w-full overflow-y-auto rounded-3xl border border-border bg-white p-2 text-left shadow-xl sm:max-w-md ${variant === "welcome" ? "top-[calc(100%+10px)]" : "bottom-[calc(100%+10px)]"}`}>
            {mention.trigger === "/" && !selectedClientId ? (
              <p className="px-4 py-3 text-sm text-text-muted">Select a client with @ first</p>
            ) : options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted">No matches found</p>
            ) : (
              options.map((option, index) => (
                <button
                  key={`${mention.trigger}-${option.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeOption}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseOption(option)}
                  className={`tap-target flex w-full items-center justify-between gap-3 rounded-2xl px-4 text-left transition-colors ${index === activeOption ? "bg-surface-secondary" : "hover:bg-surface-secondary"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{option.label}</span>
                    <span className="block truncate text-xs text-text-muted">{option.secondary}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent">{mention.trigger}</span>
                </button>
              ))
            )}
          </div>
        )}

        <div className={`flex items-end gap-3 rounded-[2rem] bg-surface-secondary p-2.5 pl-5 transition-shadow focus-within:ring-2 focus-within:ring-accent/25 ${variant === "welcome" ? "min-h-[84px]" : "min-h-[64px]"}`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => {
              const nextText = event.target.value;
              const nextMention = readMentionToken(nextText, event.target.selectionStart ?? nextText.length);
              setText(nextText);
              setMention(nextMention);
              setActiveOption(0);
            }}
            onKeyDown={(event) => {
              if (mention && options.length > 0 && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
                event.preventDefault();
                if (event.key === "ArrowDown") setActiveOption((current) => (current + 1) % options.length);
                if (event.key === "ArrowUp") setActiveOption((current) => (current - 1 + options.length) % options.length);
                if (event.key === "Enter") chooseOption(options[activeOption] ?? options[0]);
                return;
              }
              if (event.key === "Escape" && mention) {
                event.preventDefault();
                setMention(null);
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            aria-label="Message"
            placeholder="Ask anything…"
            rows={variant === "welcome" ? 2 : 1}
            disabled={disabled}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-base leading-6 text-foreground outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
          />
          <Button variant="primary" aria-label="Send message" className="mb-0.5 h-12 w-12 shrink-0 rounded-full p-0 text-xl" onClick={handleSend} disabled={disabled || !context || !text.trim()}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M12 18V6m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-text-muted">
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">@</kbd> client</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">/</kbd> professional</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">Enter</kbd> to send</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">Shift + Enter</kbd> for new line</span>
      </div>
    </div>
  );
}
