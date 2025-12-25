# Troubleshooting

## I don’t see styles or cards
- Make sure you opened `web/index.html` directly in your browser (double-click or drag into a tab). No build step is needed.

## npm install failed
- Some environments block npm registry access (403 errors). The current preview does **not** need npm installs because it is plain HTML/CSS/JS. When we add the backend and build tooling, we’ll provide exact commands and fallbacks.

## Something looks off on mobile
- Refresh the page once; the layout is responsive. If text feels small, pinch-zoom and note which device you use so we can fine-tune breakpoints.

## I don’t know which secrets to add
- None are required yet. When API wiring begins, we’ll ship a `.env.example` file and a short checklist so you can copy/paste into GitHub Secrets.
