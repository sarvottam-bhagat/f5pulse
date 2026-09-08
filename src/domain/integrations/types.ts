// Integration adapter contract for Gmail/Slack draft creation. The core
// demo (generate draft, copy, mark as sent) never depends on this — it
// works purely through store mutations. This interface exists so an
// optional Composio-backed "live" adapter could be swapped in later
// without ever being required for the app to function.

export type IntegrationChannel = "gmail" | "slack";

export interface IntegrationAdapter {
  readonly channel: IntegrationChannel;
  readonly isLive: boolean;
  isAvailable(): boolean;
  createDraft(input: { to: string; subject?: string; body: string }): Promise<{ ok: true; draftUrl?: string } | { ok: false; error: string }>;
}

/**
 * Demo adapter: never calls out to a real provider. Used until (and unless)
 * a live Composio-backed adapter is configured and verified on the deployed
 * URL. Integration failure here is impossible by construction, so it never
 * affects Home, Chat, or manual drafts.
 */
export class DemoIntegrationAdapter implements IntegrationAdapter {
  constructor(public readonly channel: IntegrationChannel) {}
  readonly isLive = false;
  isAvailable(): boolean {
    return true;
  }
  async createDraft() {
    return { ok: true as const };
  }
}

export function getIntegrationAdapter(channel: IntegrationChannel): IntegrationAdapter {
  // A live adapter would be selected here based on env config once Gmail
  // OAuth + draft creation has been verified reliable on the deployed URL.
  // Until then, every environment uses the demo adapter.
  return new DemoIntegrationAdapter(channel);
}
