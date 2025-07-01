# 🐾 Tamagotchi Pets - VS Code Extension

Your adorable virtual pet companion that helps you code, review, and stay motivated! Transform your workflow with a cute, growing sidekick.

![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

---

## 📚 Table of Contents

- [✨ What's New](#-whats-new)
- [🐾 Core Features](#-core-features)
- [🚀 Quick Start](#-quick-start)
- [📖 How to Use](#-how-to-use)
- [🎯 Pet Progression](#-pet-progression)
- [⚙️ Configuration](#️-configuration)
- [🎮 Fun Features](#-fun-features)
- [🔒 Privacy & Security](#-privacy--security)
- [🛠️ Development](#-development)
- [🤝 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [🆘 Troubleshooting](#-troubleshooting)
- [📞 Support & Contact](#-support--contact)
- [🙏 Acknowledgments](#-acknowledgments)
- [🌟 What Makes This Special?](#-what-makes-this-special)

---

## ✨ What's New

### v2.0.0 - Major UI Overhaul

- 🎨 Redesigned interface with smoother animations
- 💃 Dance button with sparkles and cooldown
- 🍒 Neon theme renamed to "Cherry" and improved
- 📱 Better chat readability & compact input styling
- 🚀 Explorer view upgraded with larger pet panel
- ✨ Fun mode with random encouraging messages
- ⚙️ Improved performance and responsiveness

---

## 🐾 Core Features

- 🐱 **Pet Companion**: Animated cat or raccoon with moods and levels
- 📈 **Progression**: Earn XP through interaction and AI use
- 🤖 **AI Assistant**: Powered by OpenRouter (DeepSeek, Gemini, Llama, Phi-3)
- 🎨 **Themes**: Auto, Light, Dark, Cherry, Minimal
- 🛠️ **Productivity**: Save reminders, git shortcuts, dual panel view
- 💬 **Chat Panel**: Ask questions and get answers from AI
- 💖 **Care Buttons**: Pat, feed, and dance with your pet

---

## 🚀 Quick Start

### Installation

1. Download or clone this repository
2. Move the folder into `.vscode/extensions/`
3. Restart VS Code
4. Look for the 🐾 icon in the Activity Bar

### Setup

1. Visit [OpenRouter.ai](https://openrouter.ai) to get a free API key
2. Open the pet panel, click ⚙️
3. Paste your API key and choose your pet and theme
4. Start coding and interacting!

---

## 📖 How to Use

### Panels

- **Activity Bar Panel**: Full-screen experience
- **Explorer Sidebar Panel**: Compact pet view

### Pet Actions

- 💖 Pat (10s cooldown)
- 🍎 Feed (15s cooldown)
- 💃 Dance (20s cooldown + sparkles!)
- 💤 Wake up sleeping pet

### Chat Features

- Ask questions with AI
- Type "meow", "nya", or "coffee" for Easter eggs
- Customize word limit and AI model

---

## 🎯 Pet Progression

Earn XP by:
- 🧠 Using AI chat (+8 XP)
- 💖 Patting (+5 XP)
- 🍎 Feeding (+8 XP)
- 💃 Dancing (+20 XP)
- 🔧 Setup completion (+10 XP)
- 🎉 Random interactions (+5 XP)

Your pet levels up and unlocks new reactions!

---

## ⚙️ Configuration

### Settings

- 🔑 API Key: From OpenRouter
- 🧠 AI Model: DeepSeek, Gemini, Llama, Phi-3
- 🎨 Theme: Auto, Light, Dark, Cherry, Minimal
- 🐾 Pet Type: Cat or Raccoon
- 📏 Word Limit: 50–400 words
- 💾 Save Reminders: Enable/disable
- 🔘 Toggle buttons: Show/hide action buttons

### Supported AI Models

- **DeepSeek R1** *(Free)*
- **DeepSeek Chat**
- **Gemini Flash 1.5**
- **Llama 3.1 8B** *(Free)*
- **Phi-3 Mini** *(Free)*

---

## 🎮 Fun Features

- 🐱 Easter eggs: "meow", "nya", "coffee"
- ✨ Dance mode: Sparkles and animations
- 🧠 Random motivational messages
- 🕒 Mood changes over time

---

## 🔒 Privacy & Security

- 🔐 API key stored securely in local settings
- 🧠 Code is only sent when using AI features
- 🛑 No background tracking or analytics
- 🧩 Processing happens locally or through selected model

---

## 🛠️ Development

### 🗂 Project Structure

```text
tamagotchi-pets/
├── src/
│   └── extension.js          # Main extension logic
├── media/
│   ├── icon.png              # Extension icon
│   ├── cat-*.gif             # Cat animations
│   └── raccoon-*.gif         # Raccoon animations
├── package.json              # Extension manifest
├── README.md                 # This file
└── LICENSE                   # MIT license
```

## 🧱 Building

To build the extension locally:

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension into a .vsix file
npx vsce package
```
## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs:** Open an issue with detailed reproduction steps  
2. **Suggest Features:** Share your ideas for new pet types or features  
3. **Submit PRs:** Fork the repo and submit pull requests  
4. **Share Feedback:** Let us know how we can improve the experience  

## 📝 Changelog

### v2.0.0 - Major UI Overhaul
- 🎨 Completely redesigned UI with dynamic animations  
- 💃 Added dedicated dance button with sparkle effects  
- 🍒 Renamed neon theme to "cherry" with improved styling  
- 📱 Improved text field sizing and chat readability  
- 🚀 Enhanced explorer view with bigger, more interactive pet  
- ✨ Added fun mode with random encouraging messages  
- 🎯 Better theme detection and contrast  
- 💫 Smooth transitions and hover effects throughout  

### v1.0.0 - Initial Release
- 🐾 Virtual pet system with cat and raccoon types  
- 🤖 AI-powered code assistance with multiple models  
- 🎨 5 beautiful themes (auto, light, dark, neon, minimal)  
- 💼 Dual panel experience (main + explorer views)  
- ⚙️ Comprehensive settings panel  
- 🎮 Easter eggs and interactive features  
- 📊 Pet progression and leveling system  

## 🆘 Troubleshooting

### Pet Not Responding?
- Check that your OpenRouter API key is set correctly  
- Verify your internet connection  
- Try refreshing the extension or restarting VS Code  

### API Errors?
- Ensure your API key is valid and starts with "sk-or-v1-"  
- Check if you have remaining credits on OpenRouter  
- Try switching to a different AI model  

### Animations Not Working?
- The extension uses GIF files that should load automatically  
- Try refreshing the webview or restarting VS Code  
- Check the developer console for any error messages  

### Themes Look Wrong?
- Try switching themes manually in settings  
- Auto theme detection works best with standard VS Code themes  
- Cherry theme is designed for dark environments  

## 📞 Support & Contact

- **GitHub Issues:** [GitHub Issues](https://github.com/husky-696/tamagotchi-pets/issues)  
- **GitHub Discussions:** [GitHub Discussions](https://github.com/hausky-696/tamagotchi-pets/discussions)  
- **Email:** ibtehaj252@gmail.com  
- **Discord:** hajin_oni 

## 🙏 Acknowledgments

- **OpenRouter** for providing free AI model access  
- **VS Code Team** for the amazing extension API  
- **Community** for feedback and feature suggestions  
- **Open Source** projects that inspired this extension  

---

**Made with 💖 by Hajin for developers who believe coding should be fun!**

## 🌟 What Makes This Special?

This isn't just another VS Code extension — it's a companion that makes coding more enjoyable:

- **Emotional Connection:** Your pet grows with you and celebrates your achievements  
- **Productivity Boost:** Gentle reminders and encouragement keep you motivated  
- **Stress Relief:** Interactive pet care provides quick mental breaks  
- **Learning Aid:** AI assistance helps you learn and solve problems  
- **Customizable:** Themes and settings adapt to your preferences  
- **Fun Factor:** Dance mode, sparkles, and easter eggs add joy to coding  

Join thousands of developers who've made coding more fun with their virtual pet companion! 🚀