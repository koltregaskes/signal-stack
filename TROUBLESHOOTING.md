# Troubleshooting

- **The page opens but says static preview mode**: the backend is not running. Start `node server.mjs` or use `start.cmd`.
- **Port 8032 is already in use**: stop the process on that port or set `PORT` in `.env` before starting the app.
- **A post shows blocked media checks**: attach at least one asset for media-first platforms like Instagram, TikTok, Shorts, and YouTube.
- **TikTok or YouTube keeps showing blocked checks in the validation rail**: open the platform target card and fill the privacy / audience / consent fields that are now required before approval or scheduling.
- **A post cannot be dropped onto another day**: the move is being blocked by a collision or cadence rule on the target account.
- **My composer changes are not in the queue yet**: local draft persistence saves the active composer separately from the queue. Use `Save Draft` or `Save To Queue` to commit it into the shared pipeline.
- **I uploaded music but the post is still blocked**: audio assets are stored as soundtrack references, not as standalone publish media. Add an image or video too.
- **The checks or accounts panel is gone**: toggle `Inspector` back on in the composer header. Layout preferences persist locally, so the studio reopens the way you last left it.
- **I ran the scheduler but want proof of what happened**: use `Review Runs` on the queue card or open the inspector `Runs` tab. That panel now shows route details, provider messages, and the recorded run timeline for the selected post.
- **The month view looks stale after an update**: refresh once so the latest service worker shell replaces the old cached shell.
- **A live API account will not validate**: check the matching secrets in `.env`. The UI will keep that route blocked until the required keys are present.
- **Bluesky live posts fail**: verify `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD`, and keep in mind that the current live connector supports text and image posts, not video.
- **My local demo data looks stale**: delete `.local/data/app-state.json` and restart to regenerate the seeded studio state.
