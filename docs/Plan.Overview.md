# Developer Career Site – Roadmap (React + TypeScript)

## 1. Vision
Public, fast, accessible personal site built with React + TypeScript (Next.js static export) that clearly communicates professional value, showcases impact, and is effortless to update via Markdown/MDX.

## 2. Objectives (v1 Launch)
1. Communicate value proposition in < 60s (hero, top projects, skills snapshot).
2. Provide depth on demand (case studies, quantified achievements).
3. Keep maintenance low friction (content = MDX files + static rebuild).
4. Achieve strong technical quality (Perf, Accessibility, SEO ≥ targets).

## 3. Success Metrics
- Lighthouse (mobile): Performance ≥ 85, other categories ≥ 90 (desktop all ≥ 90).
- First route JS bundle < 120 KB gzip (excluding images/fonts).
- LCP < 1.5s (Fast 3G throttled lab).
- Resume download CTR ≥ 10% of unique visitors.
- ≥ 3 project case studies with measurable impact metrics.
- 0 critical/serious axe-core violations.
- CI build + export + deploy ≤ 3 minutes.

## 4. Scope (MoSCoW)
Must:
- Home, Projects (index + detail), Experience, OSS summary, Resume download, Dark/Light mode, Base SEO & Open Graph, Sitemap, Mobile responsive.
Should:
- Blog (MDX), Tag filtering, Analytics (privacy-friendly toggle), JSON-LD, Skills matrix.
Could:
- Client-side search, GitHub activity widget (prebuild snapshot), Interactive timeline, Skill radar.
Won’t (v1):
- Auth, Custom backend, Comment system, Multilingual, External headless CMS.

## 5. Stakeholders
- Primary: You (maintainer / content author).
- Secondary: Recruiters, Hiring Managers, Technical peers.
- Tooling: GitHub Actions (CI/CD), GitHub Pages (hosting).

## 6. Tech Stack (React + TypeScript)
- Framework: Next.js (App Router) with `next export` for static output.
- Language: TypeScript (strict).
- Styling: Tailwind CSS + CSS variables for theming.
- Content: MDX (projects, posts, roles) parsed with `gray-matter` & MDX pipeline.
- Markdown Processing: remark/rehype minimal plugins; Shiki or Prism for code.
- State: Minimal local state (filters, theme) using React hooks.
- Analytics (optional): Plausible (deferred + env toggle).
- Lint/Format: ESLint (next + a11y + import) & Prettier.
- Testing (optional): Playwright or Vitest for smoke + axe scans.
- Deployment: GitHub Actions → build, export to `out/`, publish to `gh-pages`.
- Images: Static imports / optimized manually (avoid next/image export limitations or use export optimizer).

## 7. Content Model Snapshots
Project (content/projects/*.mdx):
```
---
slug: modern-build-pipeline
title: Modern Build Pipeline Overhaul
summary: Cut CI time 60% via caching & parallelization.
role: Lead Engineer
dateStart: 2023-02
dateEnd: 2023-11
tags: [devops, performance]
stack: [GitHub Actions, Docker, Node]
highlights:
  - Reduced average build 18m → 7m
  - Cache warm hit rate 82%
impactMetrics:
  - { label: "Build Time Reduction", value: "-61%" }
links:
  repo: https://github.com/...
  caseStudy: /projects/modern-build-pipeline
---
(MDX body for richer narrative)
```

Role (content/roles/*.md):
```
---
company: Example Corp
role: Senior Software Engineer
dateStart: 2022-05
dateEnd: 2024-08
location: Remote
achievements:
  - Led migration reducing infra cost 25%
  - Introduced error budget policy lowering incidents 35%
---
```

Post (content/posts/*.mdx):
```
---
slug: scaling-ci
title: Scaling CI for Rapid Teams
date: 2025-01-12
tags: [devops, productivity]
excerpt: Lessons learned cutting pipeline time...
coverImage: /images/posts/scaling-ci.png
readingTime: 6
---
(MDX body)
```

## 8. Directory Structure (Proposed)
```
root/
  next.config.js
  package.json
  tsconfig.json
  tailwind.config.cjs
  postcss.config.cjs
  public/
    favicon.ico
    images/
  content/
    projects/
    posts/
    roles/
    oss.json
  src/
    app/
      layout.tsx
      page.tsx
      projects/
        page.tsx
        [slug]/page.tsx
      experience/page.tsx
      oss/page.tsx
      blog/page.tsx
      blog/[slug]/page.tsx
      contact/page.tsx
      404/page.tsx
      sitemap.xml.ts
      rss.xml.ts (or prebuild)
    components/
      Seo.tsx
      ThemeToggle.tsx
      ProjectCard.tsx
      ProjectCaseStudy.tsx
      ExperienceTimeline.tsx
      SkillsMatrix.tsx
      Tag.tsx
      TagFilter.tsx
      MarkdownRenderer.tsx
    lib/
      content/
        loadProjects.ts
        loadProject.ts
        loadPosts.ts
        loadRoles.ts
        mdxOptions.ts
      seo/
        metadata.ts
        jsonld.ts
      analytics/
        plausible.tsx
      utils/
        formatDate.ts
        readingTime.ts
    styles/
      globals.css
      themes.css
  scripts/
    build-rss.ts
    validate-links.ts
  docs/
    Plan.Overview.md
```

## 9. Phase Plan (4 Weeks)
### Week 1 – Foundation
- Scaffold Next.js (App Router) + TypeScript strict.
- Tailwind setup + theme toggle (prefers-color-scheme, localStorage fallback).
- Global layout, nav, footer, SEO component.
- Content loaders (projects, roles, posts stubs) + sample MDX.
Deliverable: Static export succeeds (`next build && next export`).

### Week 2 – Core Content
- Projects index + dynamic project pages.
- Experience page (roles timeline) + teaser on home.
- Skills matrix component.
- OSS summary (static JSON).
- Resume PDF integration.
Deliverable: All Must pages navigable with placeholder content.

### Week 3 – Enhancements
- Blog (MDX) + listing + post pages.
- Tag filtering (client-side) for projects/posts.
- JSON-LD (Person, Project, Article) injection.
- Sitemap & RSS (script or route handlers).
- Performance passes (bundle analysis, tree-shake, code splitting, image audit).
Deliverable: SEO + discoverability features complete.

### Week 4 – Polish & Launch
- Optional analytics toggle.
- Accessibility audit (axe, keyboard traversal, focus outlines).
- Lighthouse CI integration.
- Final real content (projects, roles, posts) populated.
- Custom domain (CNAME) if desired.
Deliverable: Launch-ready static site deployed.

## 10. Backlog (Key Issues)
Foundation:
- feat: scaffold next + ts + tailwind
- feat: theme toggle + persistence
- chore: eslint + prettier + strict tsconfig
- chore: ci: build + export + deploy action
Core:
- feat: project content loader + index page
- feat: project dynamic page (MDX render)
- feat: experience timeline (roles)
- feat: skills matrix component
- feat: oss list rendering
- chore: resume asset integration
Enhancements:
- feat: blog (mdx) system
- feat: rss generation script
- feat: sitemap route
- feat: tag filtering logic
- feat: structured data (json-ld)
Quality/Perf:
- perf: bundle analysis & code splitting
- perf: image optimization pipeline
- a11y: axe scan + focus/contrast improvements
- test: lighthouse-ci config
Polish:
- feat: analytics toggle (env var)
- docs: authoring guide
- chore: link validator script

## 11. Risk Matrix
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| next/image + export mismatch | Missing optimizations | Medium | Use static `<img>` or export optimizer |
| Bundle bloat | Perf score drop | Medium | Early bundle analysis (Week 2) |
| MDX pipeline complexity | Delayed content | Low | Keep plugin set minimal initially |
| Base path misconfiguration | Broken asset links | Low | Use custom domain or set `assetPrefix` properly |
| Scope creep | Launch delay | Medium | Enforce MoSCoW, freeze Week 3 |

## 12. Definition of Done (Per Feature)
- Type-safe (no TS errors).
- Lint passes (no new warnings ideally).
- Builds & exports cleanly.
- No new accessibility violations (axe).
- Lighthouse delta performance ≥ baseline -5.
- Docs updated (if user-facing change).

## 13. Deployment Workflow
1. CI: install deps (cache), lint, type-check, test (optional), `next build`, `next export` → `out/`.
2. (PR) Optional Lighthouse CI + axe checks.
3. On main success: deploy `out/` to `gh-pages` (peaceiris/actions-gh-pages).
4. Cache node_modules & Next build cache for speed.
5. Assets hashed for cache busting.

## 14. Maintenance Guidelines
- Conventional commits (feat:, fix:, docs:, chore:, perf:, refactor:).
- All content changes via PR for history.
- Quarterly: dependency updates, link check, perf audit.

## 15. Post-Launch Iteration Ideas
- Fuzzy search (Fuse.js) across titles & tags.
- GitHub activity snapshot script (prebuild, cached JSON).
- Skill radar visualization.
- Webmentions integration (static build ingestion).
- Internationalization (next-intl) if needed.

## 16. Exit Criteria (v1)
All Must items complete; metrics baseline met; README documents setup, authoring workflow, deployment, accessibility statement, license.

## 17. Immediate Next Actions
1. Decide App Router (assumed) vs Pages Router (only if export complexity arises).
2. Commit this updated roadmap.
3. Draft raw project case study metrics.
4. Prepare roles front-matter entries.
5. Add resume PDF + image assets (headshot, favicon).

(End)