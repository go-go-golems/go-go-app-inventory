/*
 * Fetches the engine profile list for the Inventory chat window from the
 * chathost profile endpoint (GET <basePrefix>/api/chat/profiles). This replaces
 * the legacy os-chat /api/chat/profiles + chatProfilesSlice path.
 *
 * See design-doc/06 §6 (Profile selector strategy — option 1).
 */
import { useEffect, useState } from 'react';

export interface InventoryChatProfile {
  slug: string;
  displayName: string;
  isDefault: boolean;
}

interface ProfilesResponse {
  profiles?: Array<{ slug?: string; displayName?: string; display_name?: string; isDefault?: boolean; is_default?: boolean }>;
  defaultSlug?: string;
  default_slug?: string;
}

export interface UseInventoryProfilesResult {
  profiles: InventoryChatProfile[];
  defaultSlug: string | null;
  loading: boolean;
  error: string | null;
}

export function useInventoryProfiles(basePrefix: string): UseInventoryProfilesResult {
  const [state, setState] = useState<UseInventoryProfilesResult>({
    profiles: [],
    defaultSlug: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`${basePrefix}/api/chat/profiles`, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`profiles endpoint returned ${res.status}`);
        }
        return (await res.json()) as ProfilesResponse;
      })
      .then((body) => {
        if (cancelled) {
          return;
        }
        const profiles: InventoryChatProfile[] = (body.profiles ?? [])
          .map((p) => ({
            slug: String(p.slug ?? '').trim(),
            displayName: String(p.displayName ?? p.display_name ?? p.slug ?? '').trim(),
            isDefault: Boolean(p.isDefault ?? p.is_default ?? false),
          }))
          .filter((p) => p.slug.length > 0);
        const defaultSlug =
          String(body.defaultSlug ?? body.default_slug ?? '').trim() ||
          profiles.find((p) => p.isDefault)?.slug ||
          null;
        setState({ profiles, defaultSlug, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setState({
          profiles: [],
          defaultSlug: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [basePrefix]);

  return state;
}
