# C4N - Coercive Control Support Application

A comprehensive Progressive Web App designed to help individuals recognize, understand, and document patterns of coercive control in relationships.

## Overview

This application provides a structured framework for identifying 579 behavioral patterns across 29 sections, covering both offender behaviors and victim responses in coercive control situations. The app features an encouraging gamification system to support users through their journey of recognition and healing.

## Features

### 📱 Progressive Web App (PWA)
- **Installable**: Can be installed on mobile devices and desktop
- **Offline Support**: Works without internet connection after initial load
- **Smart Caching**: Caches resources for fast, reliable performance
- **Cache Management**: Controlled cache updates via `cache.json`

### 🎯 Core Functionality
- **29 Educational Sections**: Comprehensive coverage of coercive control patterns
- **579 Total Behavioral Markers**: Detailed offender and victim behavior patterns
- **Interactive Checkboxes**: Mark relevant behaviors for personal tracking
- **Personal Notes System**: Private note-taking for each section
- **Text-to-Speech**: Audio narration for all content and behaviors
- **Media Integration**: Educational videos and images from external API
- **Data Export**: Export all marked items and notes as JSON

### ⭐ Gamification System
- **10-Star Achievement System**:
  - Star 1: 5 items completed (0.9%)
  - Star 2: 68 items (11.7%)
  - Star 3: 132 items (22.8%)
  - Star 4: 196 items (33.9%)
  - Star 5: 260 items (44.9%)
  - Star 6: 323 items (55.8%)
  - Star 7: 387 items (66.8%)
  - Star 8: 451 items (77.9%)
  - Star 9: 515 items (88.9%)
  - Star 10: 579 items (100%)

- **Engagement Tracking**: Items marked "done" after:
  - Hovering over a card for 30+ seconds, OR
  - Listening to complete TTS audio

- **Celebration Modals**: Encouraging messages at each milestone
- **Progress Tracking**: Visual progress indicators in sidebar
- **Section Completion**: Stars replace progress when sections complete

### 🔒 Privacy & Security
- **Local Storage**: All user data stored locally on device
- **No Server Tracking**: Personal progress never leaves the device
- **Secure Export**: User controls their own data export
- **Crisis Support**: Quick access to crisis resources

## Technical Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **IndexedDB** for local data persistence

### Services
- **Progress Service**: Tracks completion and milestone achievements
- **Audio Service**: Manages TTS playback
- **Analytics Service**: Anonymous usage tracking (batched)
- **Storage Service**: IndexedDB abstraction for data management

### Backend Integration
- **PHP Endpoints**:
  - `/data.json` - Main content data
  - `/data-hash.php` - Content version tracking
  - `/cache.json` - Cache control
  - `/random-video.php` - Media content
  - `/analytics.php` - Anonymous analytics

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PHP 7.4+ (for backend endpoints)
- Web server (Apache/Nginx)

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Development server: `npm run dev`
4. Build for production: `npm run build`

### Deployment

1. Build: `npm run build`
2. Copy PWA files: `cp public/sw.js dist/sw.js && cp public/manifest.json dist/manifest.json`
3. Deploy the `dist/` folder to your web server

## PWA & Caching

### Service Worker Strategy
- **Static Assets**: Cache-first with background update
- **Data Files**: Network-first with cache fallback
- **API Endpoints**: Network-only
- **HTML Pages**: Network-first with cache fallback

### Cache Reset
To force cache reload, edit `dist/cache.json` and set `reset_cache: true`, then set back to `false` after users reload.

**Important**: User data in localStorage is NEVER cleared during cache resets.

## Customization

### Star Messages
Edit `services/progress.ts` around line 135-147.

### Theme Colors
Edit `index.html` Tailwind config or `manifest.json`.

### Star Distribution
Dynamic formula: first star at 5 items, then `(totalItems - 5) / 9` per additional star.

## Privacy Considerations

- ✅ All personal data stored locally only
- ✅ No cookies used
- ✅ No user authentication required
- ✅ Analytics are anonymous and optional
- ✅ Data export gives users full control
- ✅ Cache resets preserve user data

## Support Resources

If you or someone you know is experiencing coercive control:

- **National Domestic Violence Hotline**: 1-800-799-7233
- **Crisis Text Line**: Text HOME to 741741
- **UK National Domestic Abuse Helpline**: 0808 2000 247

## Acknowledgments

Built with love and care for someone very special. May this tool bring clarity, validation, and hope. 🤍

---

**Version**: 1.0.0  
**Last Updated**: November 2025
