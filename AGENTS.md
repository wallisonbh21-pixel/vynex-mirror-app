<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Published sites are immutable snapshots in project_site_versions created only via the publish_project_site RPC and read publicly only via get_published_site; why: Studio drafts must never leak or alter live versions.
- Site model showcase catalog lives in src/lib/showcase/models.ts (stable id/slug + section structure, capacity 20); why: single source the homepage and future NexusBuild template flow both read.
- Official site templates live in src/lib/templates/<slug>/ (content.ts = replaceable data + to-studio.ts = StudioData adapter) with visuals in src/components/templates/<slug>/ and registration in NICHE_TEMPLATES; why: NexusBuild swaps only data, Studio/publication stay single systems.
- Central template library = official NICHE_TEMPLATES entries (metadata.preview_route) merged with admin-only site_template_settings rows; projects.template_id links a project to a model and a DB trigger locks changes once status leaves disponivel/briefing; why: one catalog source, lock enforced server-side.
- Privileged DB operations go through SECURITY DEFINER sn_* SQL functions called with the caller's session (or anon for public token/lead flows); why: the app must run outside Lovable Cloud without the service-role key.
- NexusBuild structured content (lists, FAQ, gallery, products, Motors vehicles) is validated and converted in src/lib/nexus/structured-content.ts into renderable element types with stable ids; why: Studio and published renderers only display title/subtitle/paragraph/button/image.
- Studio site images live in the private `site-images` bucket at `<projectId>/<sha256>.<ext>`, served publicly via `/api/public/site-image/$` and verified server-side (magic bytes) by `verifySiteImage`; why: workspace blocks public buckets and published sites need stable, deduplicated URLs.
- Visual effects are optional per element/section (`effects` JSON, normalized in src/lib/studio/effects.ts, rendered by EffectWrapper); nothing renders differently unless an effect has `enabled: true`; why: existing sites must not change.
