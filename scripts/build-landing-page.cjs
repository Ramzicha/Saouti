const fs = require('fs');
const path = require('path');

// 1. Read base64 logos
const logos = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/logos-base64.json'), 'utf8'));

// 2. Generate Animated, Vibrant, Video-Only Landing Page
const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saouti — Discover What Matters. Create in Your Own Voice.</title>
  <meta name="description" content="AI-assisted social media content platform. Discover relevant topics and craft authentic posts in your own voice for LinkedIn, X, Instagram, and Reddit.">
  <link rel="icon" type="image/png" href="data:image/png;base64,${logos.favicon}">
  
  <!-- Typography from Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">

  <style>
    /* Saouti Design System Tokens */
    :root[data-theme='dark'] {
      --bg: #0b0b0c;
      --surface: #131314;
      --surface-raised: #1b1b1d;
      --border: #2a2a2d;
      --border-light: #38383c;
      --text: #f3f3f1;
      --muted: #a0a0a6;
      --accent: #ff6b9d;
      --accent-soft: #3a1626;
      --button: #f3f3f1;
      --on-button: #0b0b0c;
      --success: #4ade80;
      
      --agent-writer: #ff6b9d;
      --agent-critic: #f5b73d;
      --agent-art: #6db2ff;
      --agent-profiler: #4ade80;
      --agent-strategist: #b69cff;
      --agent-researcher: #38bdf8;

      --hero-glow-1: rgba(255, 107, 157, 0.16);
      --hero-glow-2: rgba(182, 156, 255, 0.12);
      --card-hover-glow: rgba(255, 107, 157, 0.12);
      --video-glow: 0 20px 60px -15px rgba(255, 107, 157, 0.18), 0 0 30px rgba(182, 156, 255, 0.12);
      
      --logo-dark-display: inline-block;
      --logo-light-display: none;
    }

    :root[data-theme='light'] {
      --bg: #fafaf8;
      --surface: #ffffff;
      --surface-raised: #f2f1ed;
      --border: #e3e1db;
      --border-light: #d0cdc3;
      --text: #141415;
      --muted: #5c5c62;
      --accent: #c21858;
      --accent-soft: #fce4ee;
      --button: #141415;
      --on-button: #fafaf8;
      --success: #15803d;
      
      --agent-writer: #c21858;
      --agent-critic: #92580a;
      --agent-art: #1d4ed8;
      --agent-profiler: #15803d;
      --agent-strategist: #6d28d9;
      --agent-researcher: #0284c7;

      --hero-glow-1: rgba(194, 24, 88, 0.08);
      --hero-glow-2: rgba(109, 40, 217, 0.06);
      --card-hover-glow: rgba(194, 24, 88, 0.08);
      --video-glow: 0 20px 50px -15px rgba(0, 0, 0, 0.12);
      
      --logo-dark-display: none;
      --logo-light-display: inline-block;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      scroll-behavior: smooth;
    }

    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      line-height: 1.5;
      position: relative;
    }

    /* Ambient Background Gradients */
    .ambient-bg-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100vw;
      max-width: 1200px;
      height: 650px;
      background: radial-gradient(ellipse 65% 50% at 50% 0%, var(--hero-glow-1) 0%, var(--hero-glow-2) 40%, transparent 80%);
      pointer-events: none;
      z-index: 0;
      animation: ambientPulse 8s ease-in-out infinite alternate;
    }

    @keyframes ambientPulse {
      0% {
        opacity: 0.8;
        transform: translateX(-50%) scale(0.98);
      }
      100% {
        opacity: 1.15;
        transform: translateX(-50%) scale(1.03);
      }
    }

    :focus-visible {
      outline: 2px solid var(--accent) !important;
      outline-offset: 2px !important;
    }

    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .ambient-bg-glow {
        animation: none !important;
      }
    }

    /* Colored Serif Accent Words */
    .serif-accent {
      font-family: 'Instrument Serif', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      font-size: 1.16em;
      padding: 0 0.06em;
      display: inline-block;
      background: linear-gradient(135deg, var(--accent) 0%, var(--agent-strategist) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 10px rgba(255, 107, 157, 0.25));
      transition: filter 0.3s ease;
    }

    .serif-accent:hover {
      filter: drop-shadow(0 3px 14px rgba(255, 107, 157, 0.45));
    }

    [lang="ar"], .arabic-text {
      font-family: 'Noto Sans Arabic', 'Inter', sans-serif;
      direction: rtl;
      text-align: right;
    }

    .container {
      width: 100%;
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    /* Header */
    header.site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transition: background-color 0.2s ease;
    }

    .header-inner {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .brand-logo-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      line-height: 0;
      transition: transform 0.2s ease;
    }

    .brand-logo-link:hover {
      transform: scale(1.02);
    }

    .brand-logo-img {
      height: 32px;
      width: auto;
      object-fit: contain;
    }

    .logo-dark { display: var(--logo-dark-display); }
    .logo-light { display: var(--logo-light-display); }

    nav.desktop-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }

    nav.desktop-nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: color 0.2s ease, transform 0.15s ease;
      position: relative;
    }

    nav.desktop-nav a:hover {
      color: var(--text);
      transform: translateY(-1px);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-height: 38px;
      border: 1px solid transparent;
    }

    .btn:active {
      transform: scale(0.97);
    }

    .btn-secondary {
      background: var(--surface-raised);
      color: var(--text);
      border-color: var(--border);
    }

    .btn-secondary:hover {
      border-color: var(--border-light);
      background: var(--surface);
      transform: translateY(-1px);
    }

    .btn-github {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-github:hover {
      background: var(--surface-raised);
      border-color: var(--border-light);
      transform: translateY(-1px);
    }

    .btn-video {
      background: linear-gradient(135deg, rgba(255, 107, 157, 0.12) 0%, rgba(182, 156, 255, 0.1) 100%);
      color: var(--text);
      border: 1px solid rgba(255, 107, 157, 0.35);
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }

    .btn-video:hover {
      background: linear-gradient(135deg, rgba(255, 107, 157, 0.22) 0%, rgba(182, 156, 255, 0.18) 100%);
      border-color: var(--accent);
      transform: translateY(-1.5px);
      box-shadow: 0 6px 20px rgba(255, 107, 157, 0.28);
    }

    .theme-toggle-btn {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-toggle-btn:hover {
      background: var(--surface-raised);
      transform: rotate(15deg);
    }

    /* Hero */
    section.hero {
      padding: 64px 0 60px 0;
      text-align: center;
      position: relative;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      max-width: 860px;
      margin: 0 auto;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      border-radius: 9999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      animation: floatBadge 4s ease-in-out infinite alternate;
    }

    @keyframes floatBadge {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }

    .pill-badge .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
      animation: dotPulse 2s ease-in-out infinite;
    }

    @keyframes dotPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
    }

    h1.hero-headline {
      font-size: clamp(34px, 5.2vw, 54px);
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--text);
      animation: fadeInDown 0.6s ease-out;
    }

    p.hero-subcopy {
      font-size: clamp(15.5px, 1.8vw, 18.5px);
      color: var(--muted);
      line-height: 1.55;
      max-width: 600px;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .hero-actions-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
      animation: fadeIn 1s ease-out;
    }

    /* Video Player Container (Cinema Grade Showcase) */
    .video-showcase-container {
      margin-top: 36px;
      width: 100%;
      max-width: 880px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--video-glow);
      transition: all 0.3s ease;
      animation: zoomInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .video-showcase-container:hover {
      border-color: rgba(255, 107, 157, 0.4);
    }

    @keyframes zoomInUp {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .video-header-bar {
      padding: 12px 18px;
      background: var(--surface-raised);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }

    .video-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .video-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--border);
    }

    .video-title-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
    }

    .live-badge {
      font-size: 11px;
      color: var(--accent);
      background: var(--accent-soft);
      border: 1px solid var(--accent);
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .live-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      animation: dotPulse 1.5s infinite;
    }

    /* Embedded Video Player */
    .video-aspect-ratio {
      position: relative;
      width: 100%;
      padding-top: 56.25%; /* 16:9 Cinema Aspect Ratio */
      background: #000;
    }

    .video-aspect-ratio iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }

    .video-placeholder-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: radial-gradient(circle at 50% 50%, #1e1e24 0%, #0c0c0e 100%);
      color: #ffffff;
      cursor: pointer;
      text-align: center;
      padding: 24px;
      transition: background 0.25s ease;
    }

    .video-placeholder-overlay:hover {
      background: radial-gradient(circle at 50% 50%, #25252c 0%, #101013 100%);
    }

    .video-play-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      color: #0b0b0c;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 0 rgba(255, 107, 157, 0.55);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      padding-left: 4px;
      animation: playPulse 2.8s infinite ease-out;
    }

    @keyframes playPulse {
      0% {
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 0 rgba(255, 107, 157, 0.55);
      }
      65% {
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 20px rgba(255, 107, 157, 0);
      }
      100% {
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 0 rgba(255, 107, 157, 0);
      }
    }

    .video-placeholder-overlay:hover .video-play-btn {
      transform: scale(1.12);
      animation: none;
      box-shadow: 0 12px 36px rgba(0,0,0,0.7), 0 0 35px rgba(255, 107, 157, 0.7);
    }

    /* Platforms Row with Glow on Hover */
    .platforms-row {
      padding: 18px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      text-align: center;
    }

    .platforms-chips {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .platform-chip {
      padding: 6px 14px;
      border-radius: 9999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
    }

    .platform-chip:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--card-hover-glow);
    }

    /* Sections */
    section.section-block {
      padding: 72px 0;
      border-bottom: 1px solid var(--border);
      position: relative;
    }

    .section-header {
      margin-bottom: 40px;
      text-align: center;
      max-width: 660px;
      margin-left: auto;
      margin-right: auto;
    }

    .section-eyebrow {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 8px;
      display: block;
    }

    h2.section-headline {
      font-size: clamp(26px, 3.4vw, 36px);
      font-weight: 600;
      line-height: 1.25;
      letter-spacing: -0.015em;
      color: var(--text);
      margin-bottom: 10px;
    }

    p.section-subcopy {
      font-size: 14.5px;
      color: var(--muted);
      line-height: 1.55;
    }

    /* Problem Grid with Smooth Hover Lift */
    .problem-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 760px) {
      .problem-cards-grid {
        grid-template-columns: 1fr;
      }
    }

    .problem-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.25s ease;
    }

    .problem-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-light);
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    }

    .card-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      margin-bottom: 4px;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .problem-card:hover .card-icon-box {
      transform: scale(1.08);
      background: var(--accent-soft);
    }

    .problem-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }

    .problem-card p {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.5;
    }

    /* Steps Timeline */
    .steps-timeline {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 860px) {
      .steps-timeline {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 500px) {
      .steps-timeline {
        grid-template-columns: 1fr;
      }
    }

    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.25s ease;
    }

    .step-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-light);
      box-shadow: 0 8px 20px -5px rgba(0,0,0,0.3);
    }

    .step-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text);
    }

    .step-card h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .step-card p {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.45;
    }

    /* Multi-Platform Studio with Subtle Glow */
    .studio-box {
      max-width: 780px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
    }

    .platform-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 16px;
      overflow-x: auto;
    }

    .platform-tab-btn {
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 500;
      border-radius: 6px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
    }

    .platform-tab-btn:hover {
      color: var(--text);
      background: var(--surface-raised);
    }

    .platform-tab-btn.active {
      color: var(--text);
      background: var(--surface-raised);
      border-color: var(--border);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .draft-display-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 180px;
      transition: border-color 0.2s ease;
    }

    .draft-text-content {
      font-size: 13.5px;
      color: var(--text);
      line-height: 1.6;
      white-space: pre-line;
      flex: 1;
    }

    .copy-draft-btn {
      font-size: 11.5px;
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      color: var(--text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }

    .copy-draft-btn:hover {
      background: var(--border);
      transform: scale(1.02);
    }

    /* Agents Grid */
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    @media (max-width: 800px) {
      .agents-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 500px) {
      .agents-grid {
        grid-template-columns: 1fr;
      }
    }

    .agent-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.25s ease;
    }

    .agent-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-light);
      box-shadow: 0 8px 20px -5px rgba(0,0,0,0.3);
    }

    .agent-tag {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .agent-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
    }

    .dot-profiler { background: var(--agent-profiler); color: var(--agent-profiler); }
    .dot-researcher { background: var(--agent-researcher); color: var(--agent-researcher); }
    .dot-strategist { background: var(--agent-strategist); color: var(--agent-strategist); }
    .dot-writer { background: var(--agent-writer); color: var(--agent-writer); }
    .dot-critic { background: var(--agent-critic); color: var(--agent-critic); }
    .dot-art { background: var(--agent-art); color: var(--agent-art); }

    .agent-card p {
      font-size: 12.5px;
      color: var(--muted);
      line-height: 1.45;
    }

    /* Audience Section */
    .audience-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 860px) {
      .audience-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .audience-grid {
        grid-template-columns: 1fr;
      }
    }

    .audience-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.25s ease;
    }

    .audience-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-light);
      box-shadow: 0 8px 20px -5px rgba(0,0,0,0.3);
    }

    .audience-card h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .audience-card p {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.45;
    }

    /* Final CTA */
    section.final-cta {
      padding: 80px 0;
      text-align: center;
      background: radial-gradient(circle at 50% 50%, var(--surface-raised) 0%, var(--bg) 80%);
      border-bottom: 1px solid var(--border);
    }

    /* Footer */
    footer.site-footer {
      background: var(--surface);
      padding: 48px 0 24px 0;
      font-size: 13px;
    }

    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .footer-nav {
      display: flex;
      gap: 20px;
    }

    .footer-nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
      transition: color 0.15s ease;
    }

    .footer-nav a:hover {
      color: var(--text);
    }

    .footer-social-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .footer-social-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted);
      text-decoration: none;
      font-size: 12px;
      transition: all 0.15s ease;
    }

    .footer-social-link:hover {
      color: var(--text);
      transform: translateY(-1px);
    }

    .footer-bottom {
      padding-top: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 12px;
    }

    .toast-msg {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--button);
      color: var(--on-button);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 2000;
      display: none;
    }
  </style>
</head>
<body>

  <!-- Ambient Design System Glow Effect -->
  <div class="ambient-bg-glow" aria-hidden="true"></div>

  <!-- ==================== HEADER ==================== -->
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a href="#top" class="brand-logo-link" aria-label="Saouti Home">
        <img class="brand-logo-img logo-dark" src="data:image/png;base64,${logos.dark}" alt="Saouti Logo">
        <img class="brand-logo-img logo-light" src="data:image/png;base64,${logos.light}" alt="Saouti Logo">
      </a>

      <nav class="desktop-nav" aria-label="Primary Navigation">
        <a href="#how-it-works">How It Works</a>
        <a href="#features">Features</a>
        <a href="#workflow">Workflow</a>
        <a href="#for-professionals">For Professionals</a>
      </nav>

      <div class="header-actions">
        <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle theme">
          <svg id="theme-sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg id="theme-moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>

        <a href="https://github.com/Ramzicha/Saouti" target="_blank" rel="noopener noreferrer" class="btn btn-github">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  </header>

  <!-- ==================== HERO SECTION (Video-Focused, Vibrant Glow) ==================== -->
  <section class="hero">
    <div class="container hero-content">
      <div class="pill-badge">
        <span class="dot"></span>
        <span>AI Topic Discovery & Voice Profiling</span>
      </div>

      <h1 class="hero-headline">
        The world moves fast. Say something that <span class="serif-accent">matters</span>.
      </h1>

      <p class="hero-subcopy">
        Saouti discovers what matters to your industry, then turns ideas into social posts in your own voice and style.
      </p>

      <!-- Actions Row: See How It Works + Watch Platform Video -->
      <div class="hero-actions-row">
        <a href="#how-it-works" class="btn btn-secondary" style="padding: 10px 20px;">
          <span>See How It Works</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>

        <!-- YouTube Video Button that triggers the video player -->
        <button type="button" class="btn btn-video" id="hero-watch-video-btn" style="padding: 10px 18px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>Watch Platform Video</span>
        </button>
      </div>

      <!-- Cinema-Grade Product Video Showcase (No interactive preview, Video only) -->
      <div class="video-showcase-container" id="video-showcase">
        <div class="video-header-bar">
          <div class="video-dots">
            <span class="video-dot" style="background:#ff5f56;"></span>
            <span class="video-dot" style="background:#ffbd2e;"></span>
            <span class="video-dot" style="background:#27c93f;"></span>
          </div>

          <div class="video-title-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Saouti Platform Walkthrough</span>
          </div>

          <span class="live-badge">
            <span class="live-badge-dot"></span>
            <span>HD Video</span>
          </span>
        </div>

        <!-- Responsive 16:9 Video Player -->
        <div class="video-aspect-ratio">
          <iframe 
            id="youtube-player-iframe"
            src="" 
            data-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
            title="Saouti Platform Video Demo" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>

          <!-- Clickable Play Cover Overlay -->
          <div class="video-placeholder-overlay" id="video-placeholder-overlay">
            <div class="video-play-btn">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <div style="font-weight:600; font-size:16px; color:#ffffff; letter-spacing:-0.01em;">
              Watch How Saouti Works
            </div>
            <div style="font-size:12.5px; color:#a0a0a6; max-width:400px; line-height:1.4;">
              Click to play the platform video demo directly in your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== PLATFORMS ROW ==================== -->
  <div class="platforms-row">
    <div class="container platforms-chips">
      <span style="color:var(--muted); font-size:12px; font-weight:600; margin-right:4px;">DRAFTS FOR:</span>
      
      <span class="platform-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>
        <span>LinkedIn</span>
      </span>

      <span class="platform-chip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        <span>X (Twitter)</span>
      </span>

      <span class="platform-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        <span>Instagram</span>
      </span>

      <span class="platform-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
        <span>Reddit</span>
      </span>
    </div>
  </div>

  <!-- ==================== THE PROBLEM (With Colored Serif Accent) ==================== -->
  <section class="section-block">
    <div class="container">
      <div class="section-header">
        <span class="section-eyebrow">The Challenge</span>
        <h2 class="section-headline">
          AI can write anything. But can it sound like <span class="serif-accent">you</span>?
        </h2>
        <p class="section-subcopy">
          Generic AI tools lack your context, principles, and audience understanding. Saouti brings discovery and personalized creation into one simple workflow.
        </p>
      </div>

      <div class="problem-cards-grid">
        <div class="problem-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <h3>Finding what to say</h3>
          <p>Keeping up with industry trends takes hours. Starting with a blank page makes consistent sharing difficult.</p>
        </div>

        <div class="problem-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </div>
          <h3>Sounding authentic</h3>
          <p>Generic AI creates boilerplate posts that strip away your voice, perspective, and credibility.</p>
        </div>

        <div class="problem-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <h3>Adapting across platforms</h3>
          <p>Reformatting the same idea for LinkedIn, X, and Reddit requires repeated manual effort.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== HOW IT WORKS ==================== -->
  <section class="section-block" id="how-it-works" style="background: var(--surface);">
    <div class="container">
      <div class="section-header">
        <span class="section-eyebrow">How It Works</span>
        <h2 class="section-headline">
          From discovery to content, in your own <span class="serif-accent">voice</span>.
        </h2>
      </div>

      <div class="steps-timeline">
        <div class="step-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="step-badge">1</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--agent-profiler);"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <h3>Teach Your Voice</h3>
          <p>Define your expertise, audience, tone, and principles once.</p>
        </div>

        <div class="step-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="step-badge">2</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--agent-researcher);"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          </div>
          <h3>Discover What Matters</h3>
          <p>Explore curated articles and trends aligned with your goals.</p>
        </div>

        <div class="step-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="step-badge">3</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--agent-writer);"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
          </div>
          <h3>Turn Insights to Posts</h3>
          <p>Generate drafts grounded in source facts and platform formats.</p>
        </div>

        <div class="step-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="step-badge">4</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--success);"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3>Refine and Save</h3>
          <p>Review, edit, and save drafts to your library. You stay in full control.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== FEATURE: MULTI-PLATFORM CREATION ==================== -->
  <section class="section-block" id="features">
    <div class="container">
      <div class="section-header">
        <span class="section-eyebrow">Studio</span>
        <h2 class="section-headline">
          One idea. Every <span class="serif-accent">platform</span>.
        </h2>
        <p class="section-subcopy">
          Select a platform to see how tone and structure adapt automatically.
        </p>
      </div>

      <div class="studio-box">
        <!-- Tabs with Brand Icons -->
        <div class="platform-tabs" id="create-platform-tabs">
          <button type="button" class="platform-tab-btn active" data-platform="linkedin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>
            <span>LinkedIn</span>
          </button>
          <button type="button" class="platform-tab-btn" data-platform="x">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X (Twitter)</span>
          </button>
          <button type="button" class="platform-tab-btn" data-platform="instagram">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span>Instagram</span>
          </button>
          <button type="button" class="platform-tab-btn" data-platform="reddit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            <span>Reddit</span>
          </button>
        </div>

        <!-- Draft Display -->
        <div class="draft-display-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span id="create-platform-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>
              </span>
              <span id="create-platform-label" style="font-weight:600; font-size:12.5px; color:var(--text);">LinkedIn Post</span>
            </div>
            <button type="button" class="copy-draft-btn" id="create-copy-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>

          <div class="draft-text-content" id="create-draft-text">We are witnessing a quiet shift in how enterprise technology is adopted.

The companies getting the highest return on AI aren't trying to rebuild their entire stack. They are identifying the 2-3 operational bottlenecks that drain their team's cognitive bandwidth and solving them cleanly.

For leadership teams, the mandate is clear: Stop looking for tools that do everything. Look for systems that integrate with the way your people already communicate.</div>
        </div>

        <!-- Languages -->
        <div style="margin-top:14px; display:flex; align-items:center; justify-content:space-between; font-size:12px;">
          <span style="color:var(--muted); display:flex; align-items:center; gap:5px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span>Language:</span>
          </span>
          <div style="display:flex; gap:6px;">
            <button type="button" class="platform-tab-btn lang-toggle-btn active" data-lang="en">English</button>
            <button type="button" class="platform-tab-btn lang-toggle-btn" data-lang="fr">Français</button>
            <button type="button" class="platform-tab-btn lang-toggle-btn" data-lang="ar">العربية (RTL)</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== WORKFLOW: THE 6 AGENTS ==================== -->
  <section class="section-block" id="workflow" style="background: var(--surface);">
    <div class="container">
      <div class="section-header">
        <span class="section-eyebrow">The Engine</span>
        <h2 class="section-headline">
          Specialized agents behind every <span class="serif-accent">draft</span>.
        </h2>
        <p class="section-subcopy">
          Behind the scenes, collaborative AI agents research, draft, and review your content.
        </p>
      </div>

      <div class="agents-grid">
        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-profiler"></span>
            <span>Profiler</span>
          </div>
          <p>Maintains your voice, principles, tone, and audience context.</p>
        </div>

        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-researcher"></span>
            <span>Researcher</span>
          </div>
          <p>Gathers factual information and external article insights.</p>
        </div>

        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-strategist"></span>
            <span>Strategist</span>
          </div>
          <p>Identifies high-relevance themes and content hooks.</p>
        </div>

        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-writer"></span>
            <span>Writer</span>
          </div>
          <p>Drafts natural posts tailored to each platform's style.</p>
        </div>

        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-critic"></span>
            <span>Critic</span>
          </div>
          <p>Reviews drafts for clarity, tone match, and factual accuracy.</p>
        </div>

        <div class="agent-card">
          <div class="agent-tag">
            <span class="agent-dot dot-art"></span>
            <span>Art Director</span>
          </div>
          <p>Provides visual direction and image prompts when needed.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== AUDIENCE ==================== -->
  <section class="section-block" id="for-professionals">
    <div class="container">
      <div class="section-header">
        <span class="section-eyebrow">Who It's For</span>
        <h2 class="section-headline">
          Built for people with something to <span class="serif-accent">say</span>.
        </h2>
      </div>

      <div class="audience-grid">
        <div class="audience-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path></svg>
          </div>
          <h3>Founders</h3>
          <p>Share company-building lessons, industry perspectives, and product developments.</p>
        </div>

        <div class="audience-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <h3>Professionals</h3>
          <p>Build a recognized presence by sharing expertise and insights in your field.</p>
        </div>

        <div class="audience-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h3>Creators</h3>
          <p>Turn ideas and articles into consistent content that reflects your point of view.</p>
        </div>

        <div class="audience-card">
          <div class="card-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3>Teams</h3>
          <p>Maintain consistent voice and communication standards across members.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== FINAL SECTION ==================== -->
  <section class="final-cta">
    <div class="container" style="display:flex; flex-direction:column; align-items:center; gap:16px;">
      <h2 class="section-headline">
        You have a perspective worth <span class="serif-accent">sharing</span>.
      </h2>
      <p class="section-subcopy">
        Discover what matters and express it in your own voice.
      </p>

      <a href="https://github.com/Ramzicha/Saouti" target="_blank" rel="noopener noreferrer" class="btn btn-github" style="padding: 10px 20px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
        </svg>
        <span>Explore on GitHub</span>
      </a>
    </div>
  </section>

  <!-- ==================== FOOTER ==================== -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-inner">
        <a href="#top" class="brand-logo-link" aria-label="Saouti Home">
          <img class="brand-logo-img logo-dark" src="data:image/png;base64,${logos.dark}" alt="Saouti Logo">
          <img class="brand-logo-img logo-light" src="data:image/png;base64,${logos.light}" alt="Saouti Logo">
        </a>

        <!-- Supported Social Destinations -->
        <div class="footer-social-row">
          <span style="color:var(--muted); font-size:12px; margin-right:4px;">Supported:</span>
          
          <span class="footer-social-link" title="LinkedIn Drafts">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>
            <span>LinkedIn</span>
          </span>

          <span class="footer-social-link" title="X (Twitter) Drafts">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </span>

          <span class="footer-social-link" title="Instagram Drafts">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span>Instagram</span>
          </span>

          <span class="footer-social-link" title="Reddit Drafts">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            <span>Reddit</span>
          </span>
        </div>

        <div class="footer-nav">
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#for-professionals">For Professionals</a>
          <a href="https://github.com/Ramzicha/Saouti" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; 2026 Saouti. Discover what matters. Create in your own voice.</span>
        <span>Content creation platform for professionals</span>
      </div>
    </div>
  </footer>

  <!-- Toast Element -->
  <div class="toast-msg" id="toast-msg">Copied to clipboard</div>

  <!-- Scripts -->
  <script>
    (function() {
      // =========================================================================
      // CONFIGURATION: Set your YouTube Video URL or Video ID below
      // Examples: "https://www.youtube.com/embed/YOUR_VIDEO_ID" or "YOUR_VIDEO_ID"
      // =========================================================================
      const YOUTUBE_VIDEO_EMBED_URL = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

      // 1. Theme Toggle
      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      const sunIcon = document.getElementById('theme-sun-icon');
      const moonIcon = document.getElementById('theme-moon-icon');
      const root = document.documentElement;

      function updateThemeIcons(theme) {
        if (theme === 'light') {
          sunIcon.style.display = 'inline-block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'inline-block';
        }
      }

      const savedTheme = localStorage.getItem('saouti-theme') || 
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      root.setAttribute('data-theme', savedTheme);
      updateThemeIcons(savedTheme);

      themeToggleBtn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('saouti-theme', next);
        updateThemeIcons(next);
      });

      // 2. YouTube Video Playback Handler
      const youtubePlayerIframe = document.getElementById('youtube-player-iframe');
      const videoPlaceholderOverlay = document.getElementById('video-placeholder-overlay');
      const heroWatchVideoBtn = document.getElementById('hero-watch-video-btn');

      function startVideoPlayback() {
        youtubePlayerIframe.src = YOUTUBE_VIDEO_EMBED_URL + '?autoplay=1';
        videoPlaceholderOverlay.style.display = 'none';
      }

      videoPlaceholderOverlay.addEventListener('click', startVideoPlayback);

      heroWatchVideoBtn.addEventListener('click', () => {
        startVideoPlayback();
        document.getElementById('video-showcase').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      // 3. Multi-Platform Tab Switcher
      const platformIcons = {
        linkedin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>',
        x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        instagram: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        reddit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>'
      };

      const platformDrafts = {
        linkedin: {
          label: "LinkedIn Post",
          text: "We are witnessing a quiet shift in how enterprise technology is adopted.\\n\\nThe companies getting the highest return on AI aren't trying to rebuild their entire stack. They are identifying the 2-3 operational bottlenecks that drain their team's cognitive bandwidth and solving them cleanly.\\n\\nFor leadership teams, the mandate is clear: Stop looking for tools that do everything. Look for systems that integrate with the way your people already communicate."
        },
        x: {
          label: "X (Twitter) Post",
          text: "The best enterprise AI strategy isn't automation—it's cognitive bandwidth restoration.\\n\\nSmall teams that succeed aren't replacing staff. They're removing back-office drag so their best minds can focus on product decisions and customer relationships."
        },
        instagram: {
          label: "Instagram Caption",
          text: "Automation shouldn't mean losing the human touch.\\n\\nWhen you eliminate routine administrative friction, your team actually has time to craft better experiences and build deeper relationships.\\n\\nFocus on decisions that matter. Let systems handle the rest. 💡"
        },
        reddit: {
          label: "Reddit Discussion Draft",
          text: "Is anyone else noticing small teams finding way higher ROI with targeted task AI than big all-in-one platforms?\\n\\nFrom what we're seeing across operations, automating 2 specific bottlenecks yields way better adoption than trying to overhaul an entire workflow. What's been your experience with team resistance vs practical adoption?"
        }
      };

      const multilingualDrafts = {
        en: "We are witnessing a quiet shift in how enterprise technology is adopted.\\n\\nThe companies getting the highest return on AI aren't trying to rebuild their entire stack. They are identifying the 2-3 operational bottlenecks that drain their team's cognitive bandwidth and solving them cleanly.",
        fr: "Nous assistons à une transformation discrète dans l'adoption des technologies d'entreprise.\\n\\nLes équipes qui tirent le meilleur parti de l'IA ne cherchent pas à tout automatiser. Elles identifient les 2 ou 3 goulets d'étranglement qui ralentissent leurs talents et les résolvent avec discernement.",
        ar: "نشهد اليوم تحولاً هادئاً في كيفية تبنّي الشركات للتقنية الحديثة.\\n\\nالفرق التي تحقق أعلى عائد من الذكاء الاصطناعي لا تسعى لأتمتة كل شيء دفعة واحدة، بل تركز على إزالة العقبات الروتينية التي تستهلك طاقة فريقها الذهنية، ليتفرغ المبدعون للقرارات التي تصنع فارقاً حقيقياً."
      };

      const platformTabs = document.querySelectorAll('#create-platform-tabs .platform-tab-btn');
      const draftTextElem = document.getElementById('create-draft-text');
      const platformLabelElem = document.getElementById('create-platform-label');
      const platformIconElem = document.getElementById('create-platform-icon');

      platformTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          platformTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const platform = btn.getAttribute('data-platform');
          const data = platformDrafts[platform];
          if (data) {
            draftTextElem.textContent = data.text.replace(/\\\\n/g, '\\n');
            draftTextElem.classList.remove('arabic-text');
            platformLabelElem.textContent = data.label;
            if (platformIcons[platform]) {
              platformIconElem.innerHTML = platformIcons[platform];
            }
          }
        });
      });

      const langBtns = document.querySelectorAll('.lang-toggle-btn');
      langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          langBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const lang = btn.getAttribute('data-lang');
          if (multilingualDrafts[lang]) {
            draftTextElem.textContent = multilingualDrafts[lang].replace(/\\\\n/g, '\\n');
            if (lang === 'ar') {
              draftTextElem.classList.add('arabic-text');
            } else {
              draftTextElem.classList.remove('arabic-text');
            }
          }
        });
      });

      // 4. Copy draft
      const toast = document.getElementById('toast-msg');
      function showToast(msg) {
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
      }

      document.getElementById('create-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(draftTextElem.innerText).then(() => {
          showToast('Draft copied to clipboard!');
        });
      });
    })();
  </script>
</body>
</html>
`;

// 3. Write files
fs.writeFileSync(path.join(__dirname, '../landing.html'), htmlContent);

const hostingerDir = path.join(__dirname, '../landing-hostinger');
if (!fs.existsSync(hostingerDir)) {
  fs.mkdirSync(hostingerDir, { recursive: true });
}
fs.writeFileSync(path.join(hostingerDir, 'index.html'), htmlContent);

fs.copyFileSync(path.join(__dirname, '../public/logo-dark.png'), path.join(hostingerDir, 'logo-dark.png'));
fs.copyFileSync(path.join(__dirname, '../public/logo-light.png'), path.join(hostingerDir, 'logo-light.png'));
fs.copyFileSync(path.join(__dirname, '../public/favicon.png'), path.join(hostingerDir, 'favicon.png'));

fs.writeFileSync(path.join(__dirname, '../public/landing.html'), htmlContent);

console.log('Successfully regenerated video-only landing page with vibrant gradients and animations:');
console.log(' - landing.html');
console.log(' - landing-hostinger/index.html');
console.log(' - public/landing.html');
