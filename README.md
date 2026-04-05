# ⚾ Diamond Pulls

**Open packs. Pull legends. Own the diamond.**

[🚀 Live Demo](#) <!-- TODO: Add GitHub Pages link -->

---

## 🎬 Preview

![App Screenshot](./assets/screenshot.png) <!-- TODO: Replace with real screenshot -->

![Pack Opening GIF](./assets/pack-opening.gif) <!-- TODO: Add pack opening GIF -->
![Card Reveal GIF](./assets/card-reveal.gif) <!-- TODO: Add card reveal GIF -->

---

## 🧠 Concept

**Diamond Pulls** is a cinematic, mobile-first baseball card pack-opening experience built entirely as a **client-side single-page application**.

It recreates the emotional loop of ripping trading card packs:

- Anticipation → Choose your pack  
- Tension → Rip it open  
- Reward → Reveal cards with rarity effects  
- Retention → Build your collection  

---

## ✨ Features

### 🎴 Pack Opening Experience
- 3 pack tiers:
  - **Standard** — 5 cards (Guaranteed Rare+)
  - **Premium** — 5 cards (2× Guaranteed Epic+)
  - **Legendary** — 3 cards (Guaranteed Legendary)
- Cinematic pack tear + staged reveal flow
- Card-by-card flip animation with progress tracking

---

### ⭐ Rarity System
- Weighted probability model based on:
  - Pack type
  - Player tier
- Rarity levels:
  - Common
  - Rare
  - Epic
  - Legendary
- Dynamic visual treatments (glow, shimmer, gradients)

---

### 📊 Real MLB Data
- Live MLB API integration:
  - Real players
  - 2024 stats
- Smart fallback stat generation when API unavailable

---

### 🃏 Collection System
- Persistent session-based collection
- Filter by rarity
- Sort by:
  - Newest
  - Rarity
  - Team
  - Name
- Card detail modal

---

### 📈 Stats Dashboard
- Packs opened
- Total cards collected
- Legendary pull count
- Unique players
- Rarity distribution

---

## 🏗️ Architecture

### Front-End Only (No Backend)

