# ⚾ Diamond Pulls

**Open packs. Pull legends. Own the diamond.**

Live demo: https://craigpaskowitz.github.io/Baseball-Pack-Opener-Game/

---

## 🎬 Preview

![Pack Open Demo](./Solar_System_Demo.GIF)

![Pack Collection](./Screenshot_ISS.jpg)

![Pack homescreen](./Screenshot_crew.jpg)

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
/index.html → UI structure & screen system
/styles.css → Design system & animations
/game.js → Core logic, state, orchestration

---

### System Design

| Layer | Responsibility |
|------|------|
| Experience Layer | Multi-screen UI (Hero, Opening, Collection, Stats) |
| Interaction Layer | Animations, gestures, transitions |
| Game Logic | Pack generation, rarity engine |
| Data Layer | MLB API + fallback stats |
| State Layer | In-memory store |

---

## 🎮 Core Mechanics

### Pack Generation
- Slot-based system per pack type
- Weighted rarity assignment
- Tier-driven player selection
- Shuffle for randomness

---

### Card Model
Each card includes:
- Player identity + team
- Real or generated stats
- Rarity classification
- Descriptor (e.g., “🔥 Ace”, “💣 Power Bat”)
- Optional fun fact
- Unique serial ID

---

### Reveal Flow

1. Select pack  
2. Rip animation  
3. Sequential card flips  
4. Rarity effects trigger  
5. Pack summary  
6. Cards added to collection  

---

## 🎨 Design System

### Theme: Stadium Night
- Dark, cinematic UI
- Neon rarity accents
- Depth, glow, and motion-driven feedback

---

### Typography
- **Bebas Neue** → Display / scoreboard feel  
- **Nunito** → Body / readability  

---

### Motion Philosophy
- Physical interactions:
  - Pack tearing
  - Card flipping
  - Glow pulses
- Spring-based easing for responsiveness

---

## 📱 Mobile Optimization

- Mobile-first design
- Optimized for iPhone Safari
- Safe-area aware layout
- Touch-first interactions
- No heavy dependencies

---

## ⚙️ Tech Stack

- Vanilla HTML / CSS / JavaScript
- MLB Stats API
- No frameworks
- No backend
- No build step

---

## 🚀 Deployment

Deploy via GitHub Pages:
1. Push repo to GitHub
2. Go to Settings → Pages
3. Select branch (main)
4. Your app is live

``

## 🧩 Key Design Decisions

### 1. Pure Client-Side Architecture
- Zero backend complexity
- Fast, portable, and deployable

---

### 2. Hybrid Data Strategy
- Live API when available
- Fallback stat generation
- Ensures reliability

---

### 3. Slot-Based Rarity System
- More controlled than pure randomness
- Enables pack differentiation

---

### 4. Lightweight State Management
- In-memory storage wrapper
- Easily extensible to localStorage or backend

---

## 🔮 Future Enhancements

### Product
- User accounts + cloud sync
- Marketplace / trading system
- Daily rewards + streaks
- Limited-time packs

---

### AI Opportunities
- AI-generated player insights
- Personalized pack recommendations
- Dynamic commentary during reveals

---

### Technical
- IndexedDB persistence
- Service worker (offline mode)
- Performance tuning for animations

---

## 🧭 Why This Project Matters

This project demonstrates:

- End-to-end product thinking  
- Gamified UX design  
- Real-time data integration  
- Mobile-first engineering  
- Lightweight architecture discipline  

---
