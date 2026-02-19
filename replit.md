# StreamFusion

## Overview
StreamFusion is a streaming content platform built with React, Vite, and Tailwind CSS. It uses Firebase for authentication and Firestore for data, and TMDB API for content metadata. The app is in Spanish.

## Recent Changes
- 2026-02-19: Migrated from Lovable to Replit environment. Updated Vite config (port 5000, allowed all hosts), removed lovable-tagger plugin reference, configured static deployment.

## Project Architecture
- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: react-router-dom v6
- **State**: @tanstack/react-query
- **Auth**: Firebase (src/contexts/AuthContext.tsx)
- **Data**: Firestore (src/lib/firestore.ts)
- **Content API**: TMDB (src/lib/tmdb.ts)
- **Styling**: Tailwind CSS with shadcn/ui components, dark theme by default

## Structure
```
src/
  App.tsx          - Main app with routes
  main.tsx         - Entry point
  index.css        - Global styles and CSS variables
  components/
    ui/            - shadcn/ui components
    home/          - Homepage components (Hero, ContentCard, ContentCarousel)
    content/       - Content viewing components (VideoPlayer)
    layout/        - Layout components (Navbar)
  contexts/        - AuthContext
  hooks/           - Custom hooks (useContent, useInfiniteScroll, use-toast)
  lib/             - Utilities (firebase, firestore, tmdb, genres, image, slug)
  pages/           - Route pages
```

## Key Pages
- `/` - Home (Index)
- `/movies`, `/series`, `/animes`, `/doramas` - Category listings
- `/pelicula/:slug`, `/serie/:slug` - Content detail
- `/watch/:id` - Video player
- `/login` - Authentication
- `/admin` - Admin panel (protected)
- `/search` - Search
- `/profile` - User profile
- `/messages` - Messages

## User Preferences
- Language: Spanish (app UI is in Spanish)
