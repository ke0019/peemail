# 🐾 Peemail

> *Inspired by how dogs mark their territory — leave your scent, discover others.*

Peemail is an open-source, location-based social app where every place has a story.

Drop a "scent pin" anywhere on the map. People who pass by within 50 meters can discover it, reply, and leave their own mark. Like dogs communicating through scent — except we use words (and maybe emojis).

---

## 🌍 The Idea

One day, watching a dog sniff a lamppost and then mark it, it hit me:

> That's exactly how location-based social should work.

- 🐕 **Sniffing** = browsing pins left by others
- 💦 **Marking** = leaving your own message at a location
- ⏳ **Scent fades** = pins expire after 72 hours unless people interact with them
- 🔒 **Private diary** = leave invisible pins only you can see

---

## ✨ Features (MVP)

- 📍 Drop scent pins on the map
- 👃 Discover pins within 50m radius
- 💬 Reply to pins and extend their life
- 👍 React with *agree / disagree*
- 🐾 Anonymous animal identity (no sign-up required)
- 🔑 Recovery code for cross-device identity restore
- 🗺️ Private map diary (permanent, invisible to others)

## 🚀 Roadmap

- **Phase 2** — Motion Social: chat with people on the same moving vehicle
- **Phase 3** — Event Mode: official pins for concerts & sports events
- **Phase 3** — Map puzzle & gamification

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile & Web | Expo (React Native) |
| Map | Mapbox |
| Backend | Node.js + Hono |
| Realtime | Socket.io |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |

---

## 📖 License

AGPL-3.0 — free to use, must open source derivatives.
