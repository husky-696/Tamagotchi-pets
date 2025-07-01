# 🐾 Tamagotchi Pets - VS Code Extension

Your adorable virtual pet companion that helps with coding, reviews code, and keeps you motivated while programming! Transform your coding experience with a cute pet that grows as you code.

![Tamagotchi Pets Banner](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

## ✨ What's New in v2.0.0

### 🎨 **Completely Redesigned UI**
- **Dynamic Animations**: Smooth transitions, hover effects, and interactive elements
- **Better Themes**: Redesigned all themes with better contrast and readability
- **Cherry Theme**: New vibrant pink cyberpunk theme (renamed from neon)
- **Improved Chat**: Better readability, contrast, and typography
- **Compact Text Fields**: Smaller, more elegant input areas

### 💃 **New Dance Feature**
- **Dance Button**: Dedicated dance button for instant fun
- **Dance GIF**: Uses single dance animation for consistent experience
- **Sparkle Effects**: Enhanced visual effects during dance mode
- **Cooldown System**: Prevents spam with smart timing

### 🚀 **Enhanced Experience**
- **Dynamic Explorer View**: Bigger, more interactive pet in sidebar
- **Fun Mode**: Random encouraging messages and tips
- **Better Animations**: Smoother transitions and effects
- **Improved Performance**: Optimized code for better responsiveness

## ✨ Core Features

### 🐾 Virtual Pet Companion
- **Animated Pet**: Watch your pet sleep, wake up, work, dance, and celebrate with you
- **Pet Progression**: Level up your pet by coding and using AI features
- **Multiple Pet Types**: Choose between Cat 🐱 and Raccoon 🦝 companions
- **Interactive Care**: Pat, feed, and dance with your pet for heart reactions and bonuses
- **Mood System**: Your pet's mood changes based on interactions and activity

### 🤖 AI-Powered Code Assistant
- **Smart Chat**: Ask coding questions with AI-powered responses
- **Multiple AI Models**: Choose from DeepSeek, Gemini, Llama, and Phi-3
- **Context Awareness**: Remembers conversation history for better responses
- **Word Limit Control**: Customizable response length (50-400 words)

### 🎨 Beautiful Themes
- **Auto Theme**: Automatically follows your VS Code theme
- **Light Theme**: Clean and bright for daytime coding
- **Dark Theme**: Easy on the eyes for night coding with green accents
- **Cherry Theme**: Vibrant pink cyberpunk aesthetics with glow effects
- **Minimal Theme**: Clean and distraction-free design

### 💼 Productivity Features
- **Dual View Experience**: Full panel in activity bar + compact view in Explorer
- **Save Reminders**: Automatic notifications for unsaved work
- **Git Integration**: Quick access to git operations
- **Motivational Messages**: Periodic encouragement and health reminders
- **Customizable Interface**: Hide/show buttons based on your preferences

## 🚀 Quick Start

### Installation
1. Download the extension files
2. Place them in your VS Code extensions folder
3. Restart VS Code
4. Look for the 🐾 icon in the activity bar

### Setup
1. **Get API Key**: Visit [OpenRouter.ai](https://openrouter.ai) for free AI credits
2. **Configure**: Click the ⚙️ settings button in the pet panel
3. **Add API Key**: Paste your OpenRouter API key
4. **Choose Pet**: Select your preferred pet type and theme
5. **Start Coding**: Your pet is ready to help!

## 📖 How to Use

### Dual Panel Experience
- **Main Panel**: Click the 🐾 icon in the activity bar for the full experience
- **Explorer Panel**: Quick pet view in the Explorer sidebar
- **Dynamic Sizing**: Explorer view is now bigger and more interactive

### Pet Interaction
- **Wake Up**: Click on your sleeping pet to wake them up
- **Pat Pet**: Click 💖 Pat for heart animations and XP (10s cooldown)
- **Feed Pet**: Click 🍎 Feed to make your pet happy (15s cooldown)
- **Dance**: Click 💃 Dance for sparkle effects and fun (20s cooldown)
- **Watch Growth**: Your pet levels up as you use the extension

### AI Features
- **Chat**: Type questions in the chat box for AI assistance
- **Smart Responses**: AI remembers context for better conversations
- **Easter Eggs**: Try typing "meow", "nya", or "coffee" for special responses

### Customization
- **Settings Panel**: Click ⚙️ for comprehensive settings
- **Theme Selection**: Choose from 5 beautiful themes
- **Button Visibility**: Hide/show utility and code action buttons
- **Pet Type**: Switch between cat and raccoon companions

## 🎯 Pet Progression System

Your pet gains experience (XP) through:
- Using AI features (+8 XP)
- Getting patted (+5 XP)
- Being fed (+8 XP)
- Dancing (+20 XP)
- Setting up the extension (+10 XP)
- Random fun interactions (+5 XP)

**Level up your pet to unlock achievements and special interactions!**

## ⚙️ Configuration

### Available Settings
- **API Key**: Your OpenRouter API key for AI features
- **AI Model**: Choose your preferred AI model
- **Theme**: Select visual theme (auto, light, dark, cherry, minimal)
- **Pet Type**: Choose between cat and raccoon
- **Word Limit**: Control AI response length (50-400 words)
- **Auto-Save Reminders**: Toggle save notifications
- **Button Visibility**: Customize which buttons to show

### Supported AI Models
- **DeepSeek R1** (Free) - Latest reasoning model
- **DeepSeek Chat** - Great for conversations
- **Gemini Flash 1.5** - Fast and efficient
- **Llama 3.1 8B** (Free) - Open source alternative
- **Phi-3 Mini** (Free) - Lightweight option

## 🎮 Fun Features

- Type "meow" or "nya" in chat for special cat responses
- Try "coffee" for a coffee break interaction
- Use the dance button for sparkle effects and fun animations
- Discover random encouraging messages as you code
- Watch your pet's mood change naturally over time

## 🔒 Privacy & Security

- Your API key is stored securely in VS Code settings
- Code is only sent to AI when you explicitly use AI features
- No data collection or tracking
- All processing happens locally or through your chosen AI provider

## 🛠️ Development

### Project Structure
\`\`\`
tamagotchi-pets/
├── src/
│   └── extension.js          # Main extension logic
├── media/
│   ├── icon.png             # Extension icon
│   ├── cat-*.gif            # Cat animations
│   └── raccoon-*.gif        # Raccoon animations
├── package.json             # Extension manifest
├── README.md               # This file
└── LICENSE                 # MIT license
\`\`\`

### Building
\`\`\`bash
# Install dependencies
npm install

# Compile extension
npm run compile

# Package extension
vsce package
\`\`\`

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Share your ideas for new pet types or features
3. **Submit PRs**: Fork the repo and submit pull requests
4. **Share Feedback**: Let us know how we can improve the experience

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

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hajin-dev/tamagotchi-pets/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hajin-dev/tamagotchi-pets/discussions)
- **Email**: ibtehaj252@gmail.com

## 🙏 Acknowledgments

- **OpenRouter** for providing free AI model access
- **VS Code Team** for the amazing extension API
- **Community** for feedback and feature suggestions
- **Open Source** projects that inspired this extension

---

**Made with 💖 by Hajin for developers who believe coding should be fun!**

*Transform your coding experience with a virtual pet companion. Happy coding! 🐾✨*

## 🌟 What Makes This Special?

This isn't just another VS Code extension - it's a companion that makes coding more enjoyable:

- **Emotional Connection**: Your pet grows with you and celebrates your achievements
- **Productivity Boost**: Gentle reminders and encouragement keep you motivated
- **Stress Relief**: Interactive pet care provides quick mental breaks
- **Learning Aid**: AI assistance helps you learn and solve problems
- **Customizable**: Themes and settings adapt to your preferences
- **Fun Factor**: Dance mode, sparkles, and easter eggs add joy to coding

Join thousands of developers who've made coding more fun with their virtual pet companion! 🚀
