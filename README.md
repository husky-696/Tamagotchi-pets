# 🐾 Tamagotchi Pets - VS Code Extension

Your adorable virtual pet companion that helps with coding, reviews code, and keeps you motivated while programming! Transform your coding experience with a cute pet that grows as you code.

![Tamagotchi Pets Banner](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

---

## 📚 Table of Contents

- [✨ What's New in v2.0.0](#-whats-new-in-v200)
- [✨ Core Features](#-core-features)
- [🚀 Quick Start](#-quick-start)
- [📖 How to Use](#-how-to-use)
- [🎯 Pet Progression System](#-pet-progression-system)
- [⚙️ Configuration](#-configuration)
- [🎮 Fun Features](#-fun-features)
- [🔒 Privacy & Security](#-privacy--security)
- [🛠️ Development](#-development)
- [🤝 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [🆘 Troubleshooting](#-troubleshooting)
- [📞 Support](#-support)
- [🙏 Acknowledgments](#-acknowledgments)
- [🌟 What Makes This Special?](#-what-makes-this-special)

---

## ✨ What's New in v2.0.0

### 🎨 Completely Redesigned UI
- Dynamic animations, hover effects, and smooth transitions
- Better contrast and readability
- New Cherry theme (renamed from Neon)
- Compact, elegant chat and input fields

### 💃 New Dance Feature
- Dedicated dance button
- Fun sparkle animations and cooldown system

### 🚀 Enhanced Experience
- Bigger, more interactive pet in Explorer
- Fun Mode: Encouraging messages and tips
- Smoother transitions and better performance

---

## ✨ Core Features

### 🐾 Virtual Pet Companion
- Animated cat 🐱 or raccoon 🦝
- Pet levels up as you code
- Interact via patting, feeding, and dancing
- Mood system that reacts to your behavior

### 🤖 AI-Powered Code Assistant
- Ask coding questions using AI chat
- Choose from DeepSeek, Gemini, Llama, Phi-3
- Remembers chat context
- Word limit customization

### 🎨 Beautiful Themes
- Auto: Follows your VS Code theme
- Light, Dark, Cherry 🌸, and Minimal

### 💼 Productivity Tools
- Dual panel (Activity Bar + Explorer)
- Git shortcuts
- Save reminders
- Motivational messages
- Hide/show buttons and customize UI

---

## 🚀 Quick Start

### Installation
1. Download or clone this repo
2. Move it into your `.vscode/extensions` folder
3. Restart VS Code
4. Click the 🐾 icon to start!

### Setup
1. Get an API key from [OpenRouter.ai](https://openrouter.ai)
2. Click ⚙️ in the pet panel
3. Paste your API key
4. Choose your pet and theme
5. Start coding!

---

## 📖 How to Use

### Dual Panel Experience
- 🐾 Activity Bar = Full view
- Explorer = Quick view (now bigger)

### Pet Interactions
- 💖 Pat = XP & heart reaction (10s cooldown)
- 🍎 Feed = Happy pet! (15s cooldown)
- 💃 Dance = Fun animation & sparkles (20s cooldown)
- 💤 Wake Up = Click to interact when asleep

### AI Chat
- Ask code questions
- Enjoy context-aware responses
- Try Easter eggs: “meow”, “nya”, “coffee”

### Customization
- ⚙️ Settings panel
- Pick themes and pet type
- Toggle button visibility

---

## 🎯 Pet Progression System

Gain XP by:
- Using AI features (+8 XP)
- Patting (+5 XP)
- Feeding (+8 XP)
- Dancing (+20 XP)
- Initial setup (+10 XP)
- Random fun (+5 XP)

📈 Level up to unlock new interactions!

---

## ⚙️ Configuration

### Settings
- **API Key**: OpenRouter key
- **AI Model**: DeepSeek, Gemini, Llama, Phi-3
- **Theme**: Auto, Light, Dark, Cherry, Minimal
- **Pet Type**: Cat 🐱 or Raccoon 🦝
- **Word Limit**: 50–400 words
- **Reminders**: Enable/disable auto-save tips
- **Buttons**: Choose which features are visible

### Supported AI Models
- 🧠 DeepSeek R1 *(Free)*
- 💬 DeepSeek Chat
- ⚡ Gemini Flash 1.5
- 🦙 Llama 3.1 8B *(Free)*
- 🌱 Phi-3 Mini *(Free)*

---

## 🎮 Fun Features

- Type “meow”, “nya”, or “coffee” in chat for surprises
- Sparkle effects during dance mode
- Random motivational quotes
- Pet reacts to time and mood

---

## 🔒 Privacy & Security

- Your API key is stored securely in settings
- Code is only sent when using AI
- No tracking or data collection
- All processing is local or via your AI provider

---

## 🛠️ Development

### 🗂️ Project Structure

```text
📦 tamagotchi-pets/
├── 📁 src/
│   └── extension.js           # Main extension logic
├── 📁 media/
│   ├── icon.png              # Extension icon
│   ├── cat-*.gif             # Cat animations
│   └── raccoon-*.gif         # Raccoon animations
├── 📄 package.json            # Extension manifest
├── 📘 README.md               # This file
└── 📄 LICENSE                 # MIT license

---

### 🛠️ What This Does:

- ✅ `npm install` → installs your dependencies from `package.json`
- ✅ `npm run compile` → if you have a build step (like TypeScript), this compiles your code
- ✅ `npx vsce package` → packages your extension into a `.vsix` file ready for install or publishing

If you don’t have a `compile` script, you can remove that line or add one in your `package.json`, like:

```json
"scripts": {
  "compile": "tsc"  // if you're using TypeScript
}