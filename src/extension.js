const vscode = require("vscode")

// Global state for theme synchronization
let globalThemeState = "auto"
let globalPetType = "cat"
const allProviders = []

class TamagotchiPetProvider {
  constructor(context, viewId = "main") {
    this._view = null
    this._context = context
    this._viewId = viewId
    this._currentAnimation = "nap"
    this._petMood = "content"
    this._petLevel = 1
    this._petExp = 0
    this._lastPatTime = 0
    this._lastFeedTime = 0
    this._lastDanceTime = 0
    this._easterEggCount = 0
    this._chatHistory = []
    this._isProcessing = false
    this._lastGreetingTime = 0
    this._lastEncouragementTime = 0
    this._gitReminderInterval = null
    this._saveReminderInterval = null
    this._conversationContext = []
    this._clickCount = 0
    this._clickTimer = null
    this._isDancing = false
    this._moodTimer = null
    this._funModeActive = false

    // Add to global providers list for theme sync
    allProviders.push(this)

    // Load configuration
    this._loadConfiguration()

    // Load saved data (only for main view to avoid duplicates)
    if (viewId === "main") {
      this._loadPetData()
      this._startGitReminders()
      this._startSaveReminders()
      this._startEncouragements()
      this._startMoodCycle()
      this._showGreeting()
      this._startFunMode()
    }

    console.log(`🐾 TamagotchiPetProvider initialized for ${viewId}`)
  }

  _loadConfiguration() {
    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    this._currentModel = config.get("model") || "deepseek/deepseek-r1:free"
    this._currentTheme = config.get("theme") || "auto"
    this._petType = config.get("petType") || "cat"
    this._wordLimit = config.get("wordLimit") || 150
    this._enableGitReminders = config.get("enableGitReminders") || false
    this._enableSaveReminders = config.get("enableSaveReminders") || false
    this._showUtilityButtons = config.get("showUtilityButtons") !== false
    this._showSaveButton = config.get("showSaveButton") !== false
    this._showGitButton = config.get("showGitButton") !== false
    this._enablePetBackground = config.get("enablePetBackground") || false

    // Update global states
    globalThemeState = this._currentTheme
    globalPetType = this._petType
  }

  _startFunMode() {
    // Random fun interactions every 10 minutes
    setInterval(
      () => {
        if (Math.random() < 0.3) {
          this._triggerRandomFun()
        }
      },
      10 * 60 * 1000,
    )
  }

  _triggerRandomFun() {
    const funActions = [
      () => {
        this._setAnimation("happy")
        vscode.window.showInformationMessage("🎉 Your pet just discovered a new coding trick! +5 XP!")
        this._gainExp(5)
      },
      () => {
        this._petMood = "playful"
        this._updateAllViews()
        vscode.window.showInformationMessage("😸 Your pet is feeling extra playful today!")
      },
      () => {
        if (this._petLevel > 3) {
          vscode.window.showInformationMessage("🌟 Your pet wants to show you something cool! Check the dance button!")
          this._showSparkles()
        }
      },
      () => {
        const tips = [
          "💡 Pro tip: Use Ctrl+Shift+P to open the command palette!",
          "🔥 Hot key: Ctrl+` opens the terminal instantly!",
          "⚡ Speed tip: Ctrl+D selects the next occurrence of selected text!",
          "🎯 Focus tip: F12 goes to definition, Alt+F12 peeks!",
          "🚀 Productivity: Ctrl+Shift+E opens the file explorer!",
        ]
        const tip = tips[Math.floor(Math.random() * tips.length)]
        vscode.window.showInformationMessage(tip)
      },
    ]

    const action = funActions[Math.floor(Math.random() * funActions.length)]
    action()
  }

  _startMoodCycle() {
    // Change mood naturally over time
    this._moodTimer = setInterval(
      () => {
        this._cycleMood()
      },
      5 * 60 * 1000,
    ) // Every 5 minutes
  }

  _cycleMood() {
    if (this._isDancing || this._isProcessing) return

    const moods = ["content", "sleepy", "curious", "playful", "focused"]
    const currentIndex = moods.indexOf(this._petMood)

    // 70% chance to stay in current mood, 30% to change
    if (Math.random() < 0.3) {
      let newMood
      do {
        newMood = moods[Math.floor(Math.random() * moods.length)]
      } while (newMood === this._petMood)

      this._petMood = newMood
      this._updateAllViews()
    }
  }

  _showGreeting() {
    const now = Date.now()
    const timeSinceLastGreeting = now - this._lastGreetingTime

    if (timeSinceLastGreeting > 4 * 60 * 60 * 1000 || this._lastGreetingTime === 0) {
      setTimeout(() => {
        const hour = new Date().getHours()
        let greeting

        if (hour < 6) {
          greeting = "🌙 Working late? Your pet is here to keep you company! Don't forget to rest! 💤"
        } else if (hour < 12) {
          greeting = "🌅 Good morning! Ready for another amazing day of coding? Let's do this! ☕"
        } else if (hour < 17) {
          greeting = "☀️ Good afternoon! How's your coding adventure going today? 💻"
        } else if (hour < 21) {
          greeting = "🌆 Good evening! Time to wrap up with some great code! 🚀"
        } else {
          greeting = "🌃 Good evening! Remember to take breaks - your health matters more than code! 💖"
        }

        vscode.window.showInformationMessage(greeting)
        this._lastGreetingTime = now
        this._savePetData()
      }, 2000)
    }
  }

  _startEncouragements() {
    setInterval(
      () => {
        this._showRandomEncouragement()
      },
      45 * 60 * 1000,
    )
  }

  _showRandomEncouragement() {
    const encouragements = [
      "🌟 You're crushing it! Every bug you fix makes you stronger! 💪",
      "💧 Hydration checkpoint! Your brain needs water to code better! 🥤",
      "🧘‍♂️ Stretch time! Your future self will thank you! 🤸‍♀️",
      "👀 20-20-20 rule: Look at something 20 feet away for 20 seconds! 👁️",
      "🌱 Debugging isn't failing, it's learning in disguise! 🔍",
      "🎯 Small commits lead to big victories! Keep pushing! 🏆",
      "🔥 Your coding skills are leveling up every single day! 📈",
      "☕ Coffee break? You've earned it, coding champion! ☕",
      "🎵 Some lo-fi beats might boost your coding flow! 🎧",
      "💡 Stuck? A quick walk often unlocks the best solutions! 🚶‍♀️",
      "🌈 You're not just coding, you're creating digital art! 🎨",
      "🚀 Remember: every expert was once a beginner like you! 📚",
      "🎮 Take a 5-minute break - your code will still be there! 🎯",
      "🌸 Fresh air and sunlight are great debugging tools! 🌞",
      "🍎 Healthy snacks = healthy code! Fuel your brain! 🧠",
    ]

    const now = Date.now()
    const timeSinceLastEncouragement = now - this._lastEncouragementTime

    if (timeSinceLastEncouragement > 30 * 60 * 1000) {
      const message = encouragements[Math.floor(Math.random() * encouragements.length)]
      vscode.window.showInformationMessage(message)
      this._lastEncouragementTime = now
    }
  }

  _startGitReminders() {
    if (this._gitReminderInterval) {
      clearInterval(this._gitReminderInterval)
    }

    if (!this._enableGitReminders) return

    this._gitReminderInterval = setInterval(
      () => {
        this._checkGitStatus()
      },
      30 * 60 * 1000,
    )

    setTimeout(
      () => {
        this._checkGitStatus()
      },
      5 * 60 * 1000,
    )
  }

  _startSaveReminders() {
    if (this._saveReminderInterval) {
      clearInterval(this._saveReminderInterval)
    }

    if (!this._enableSaveReminders) return

    this._saveReminderInterval = setInterval(
      () => {
        this._checkUnsavedFiles()
      },
      15 * 60 * 1000,
    )
  }

  async _checkGitStatus() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) return

      const gitExtension = vscode.extensions.getExtension("vscode.git")
      if (gitExtension && gitExtension.isActive) {
        const random = Math.random()
        if (random < 0.1) {
          const result = await vscode.window.showInformationMessage(
            "🐾 Psst... when did you last commit your amazing work?",
            "Commit Now",
            "Push Changes",
            "Later",
          )

          if (result === "Commit Now") {
            await this._gitCommit()
          } else if (result === "Push Changes") {
            await this._gitPush()
          }
        }
      }
    } catch (error) {
      // Git extension not available
    }
  }

  async _checkUnsavedFiles() {
    const dirtyFiles = vscode.workspace.textDocuments.filter((doc) => doc.isDirty)

    if (dirtyFiles.length > 0) {
      const result = await vscode.window.showWarningMessage(
        `🐾 Meow! You have ${dirtyFiles.length} unsaved file(s). Don't lose your precious work!`,
        "Save All",
        "Remind Later",
      )

      if (result === "Save All") {
        await this._saveAllFiles()
      }
    }
  }

  resolveWebviewView(webviewView) {
    console.log(`🐾 Resolving webview for ${this._viewId}`)
    this._view = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, "media")],
    }

    this._updateContent()

    webviewView.webview.onDidReceiveMessage(async (message) => {
      console.log(`🐾 [${this._viewId}] Received message:`, message.command, message)
      try {
        await this._handleMessage(message)
      } catch (error) {
        console.error(`🐾 Error handling message ${message.command}:`, error)
        this._handleError(error)
      }
    })
  }

  async _handleMessage(message) {
    switch (message.command) {
      case "changeTheme":
        await this._changeTheme(message.theme)
        break
      case "changePetType":
        await this._changePetType(message.petType)
        break
      case "askAI":
        await this._handleAIQuestion(message.question)
        break
      case "openSettings":
        await this._openSettingsPanel()
        break
      case "setupApiKey":
        await this._setupApiKey()
        break
      case "patPet":
        await this._patPet()
        break
      case "feedPet":
        await this._feedPet()
        break
      case "dancePet":
        await this._dancePet()
        break
      case "wakeUp":
        this._handlePetClick()
        break
      case "clearChat":
        this._clearChatHistory()
        break
      case "saveFiles":
        await this._saveAllFiles()
        break
      case "gitCommit":
        await this._gitCommit()
        break
      default:
        console.log("🐾 Unknown command:", message.command)
    }
  }

  _handlePetClick() {
    this._clickCount++

    // Reset click timer
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
    }

    // Single click - wake up
    this._setAnimation("idle")

    // Reset click count after 2 seconds
    this._clickTimer = setTimeout(() => {
      this._clickCount = 0
    }, 2000)
  }

  async _dancePet() {
    const now = Date.now()
    const cooldownTime = 20000 // 20 seconds
    const timeSinceLastDance = now - this._lastDanceTime

    if (timeSinceLastDance < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastDance) / 1000)
      vscode.window.showWarningMessage(`🐾 Wait ${remainingTime} more seconds before dancing again!`)
      return
    }

    if (this._isDancing) return

    this._lastDanceTime = now
    this._isDancing = true
    this._petMood = "excited"

    const danceMessages = [
      "💃 Dance party time! Your pet is showing off! ✨",
      "🕺 Look at those moves! Your pet is a dancing star! 🌟",
      "🎵 Dancing to the rhythm of code! So groovy! 🎶",
      "🎉 Your pet is busting some serious moves! 💃",
      "✨ Dance fever! Your pet can't stop the rhythm! 🎶",
      "🎪 Time for a dance show! Your pet loves to perform! 🎭",
      "🌟 Dancing like nobody's watching! So cute! 💖",
      "🎵 Rhythm and code! The perfect combination! 🎶",
    ]

    const message = danceMessages[Math.floor(Math.random() * danceMessages.length)]
    vscode.window.showInformationMessage(message)

    // Use dance GIF
    this._setAnimation("dance")
    this._showSparkles()

    setTimeout(() => {
      this._isDancing = false
      this._petMood = "happy"
      this._gainExp(20)
      setTimeout(() => {
        this._setAnimation("nap")
        this._petMood = "content"
      }, 2000)
    }, 4000)
  }

  _showSparkles() {
    allProviders.forEach((provider) => {
      if (provider._view) {
        provider._view.webview.postMessage({
          command: "showSparkles",
        })
      }
    })
  }

  async _saveAllFiles() {
    try {
      // Get all dirty (unsaved) documents
      const dirtyDocuments = vscode.workspace.textDocuments.filter((doc) => doc.isDirty && !doc.isUntitled)

      if (dirtyDocuments.length === 0) {
        vscode.window.showInformationMessage("🐾 All files are already saved! You're so organized! ✨")
        return
      }

      // Save each document individually
      let savedCount = 0
      for (const doc of dirtyDocuments) {
        try {
          await doc.save()
          savedCount++
        } catch (error) {
          console.error("Failed to save document:", doc.fileName, error)
        }
      }

      // Also try the workspace save all as backup
      await vscode.workspace.saveAll(false)

      const saveMessages = [
        `💾 Successfully saved ${savedCount} files! Your work is safe and sound! ✨`,
        `📁 ${savedCount} files saved perfectly! Great job staying organized! 🌟`,
        `💽 All ${savedCount} files saved! Your pet is proud of you! 💖`,
        `🗃️ ${savedCount} files secured! Your code is protected! 🛡️`,
        `📋 Save complete! ${savedCount} files are now safe! 🎯`,
      ]

      const message = saveMessages[Math.floor(Math.random() * saveMessages.length)]
      vscode.window.showInformationMessage(message)

      this._setAnimation("happy")
      this._gainExp(8)

      setTimeout(() => this._setAnimation("nap"), 2000)
    } catch (error) {
      console.error("Save files error:", error)
      vscode.window.showErrorMessage("🐾 Failed to save some files: " + error.message)
    }
  }

  async _gitCommit() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("🐾 No workspace folder found for git operations!")
        return
      }

      // Check if git extension is available
      const gitExtension = vscode.extensions.getExtension("vscode.git")
      if (!gitExtension) {
        vscode.window.showErrorMessage("🐾 Git extension not found! Please install the Git extension.")
        return
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate()
      }

      // Try different git commit approaches
      try {
        // Method 1: Try the standard git commit command
        await vscode.commands.executeCommand("git.commit")
      } catch (error1) {
        try {
          // Method 2: Try git commitAll
          await vscode.commands.executeCommand("git.commitAll")
        } catch (error2) {
          try {
            // Method 3: Try opening source control view
            await vscode.commands.executeCommand("workbench.view.scm")
            vscode.window.showInformationMessage(
              "🐾 Opened Source Control! Click the ✓ button to commit your changes! 📝",
            )
          } catch (error3) {
            throw new Error("All git commit methods failed")
          }
        }
      }

      const commitMessages = [
        "📝 Git commit initiated! Your pet loves version control! 🐾",
        "🔄 Committing your awesome changes! Great workflow! ✨",
        "📋 Git commit started! Your pet approves of good practices! 💖",
        "🎯 Committing code like a pro! Your pet is impressed! 🌟",
        "📦 Git commit in progress! Excellent version management! 🚀",
        "🎉 Time to commit those amazing changes! 📝",
        "💫 Your code deserves to be committed! Great work! ✨",
        "🏆 Committing like a champion developer! 🥇",
      ]

      const message = commitMessages[Math.floor(Math.random() * commitMessages.length)]
      vscode.window.showInformationMessage(message)

      this._setAnimation("working")
      this._gainExp(10)

      setTimeout(() => this._setAnimation("happy"), 1000)
      setTimeout(() => this._setAnimation("nap"), 3000)
    } catch (error) {
      console.error("Git commit error:", error)
      vscode.window.showErrorMessage("🐾 Git commit failed: " + error.message)
    }
  }

  async _gitPush() {
    try {
      await vscode.commands.executeCommand("git.push")
      vscode.window.showInformationMessage("🚀 Git push initiated! Sharing your awesome code! ✨")
      this._gainExp(5)
    } catch (error) {
      console.error("Git push error:", error)
      vscode.window.showErrorMessage("🐾 Git push failed: " + error.message)
    }
  }

  async _changeTheme(theme) {
    await vscode.workspace.getConfiguration("tamagotchiPets").update("theme", theme, vscode.ConfigurationTarget.Global)
    this._currentTheme = theme
    globalThemeState = theme
    this._syncThemeToAllProviders()
  }

  _syncThemeToAllProviders() {
    console.log(`🐾 Syncing theme ${globalThemeState} to all providers`)
    allProviders.forEach((provider) => {
      provider._currentTheme = globalThemeState
      provider._updateContent()
    })
  }

  async _changePetType(petType) {
    await vscode.workspace
      .getConfiguration("tamagotchiPets")
      .update("petType", petType, vscode.ConfigurationTarget.Global)
    this._petType = petType
    globalPetType = petType

    allProviders.forEach((provider) => {
      provider._petType = petType
      provider._updateContent()
    })
  }

  async _openSettingsPanel() {
    console.log("🐾 Opening settings panel")
    const config = vscode.workspace.getConfiguration("tamagotchiPets")

    const panel = vscode.window.createWebviewPanel(
      "tamagotchiSettings",
      "🐾 Tamagotchi Pet Settings",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    )

    const currentSettings = {
      apiKey: config.get("apiKey") || "",
      model: config.get("model") || "deepseek/deepseek-r1:free",
      theme: config.get("theme") || "auto",
      petType: config.get("petType") || "cat",
      wordLimit: config.get("wordLimit") || 150,
      enableGitReminders: config.get("enableGitReminders") || false,
      enableSaveReminders: config.get("enableSaveReminders") || false,
      showUtilityButtons: config.get("showUtilityButtons") !== false,
      showSaveButton: config.get("showSaveButton") !== false,
      showGitButton: config.get("showGitButton") !== false,
      enablePetBackground: config.get("enablePetBackground") || false,
    }

    panel.webview.html = this._getSettingsHtml(currentSettings)

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "saveSettings") {
        await this._saveSettings(message.settings)
        vscode.window.showInformationMessage("🐾 Settings saved successfully! ✨")
        panel.dispose()
      }
    })
  }

  _getSettingsHtml(settings) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
          }
          .settings-container {
            max-width: 600px;
            margin: 0 auto;
          }
          .title {
            text-align: center;
            margin-bottom: 30px;
            font-size: 24px;
            color: var(--vscode-foreground);
          }
          .setting-group {
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-input-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-input-border);
          }
          .setting-label {
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
            color: var(--vscode-foreground);
          }
          .setting-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
          }
          input, select, textarea {
            width: 100%;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            box-sizing: border-box;
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--vscode-button-background);
          }
          input[type="password"] {
            font-family: 'Courier New', monospace;
          }
          input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
          }
          .checkbox-container {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
          .button-group {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 30px;
          }
          button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          }
          .save-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }
          .save-button:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .cancel-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          .cancel-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
          }
        </style>
      </head>
      <body>
        <div class="settings-container">
          <h1 class="title">🐾 Pet Settings</h1>
          
          <div class="setting-group">
            <label class="setting-label">🔑 OpenRouter API Key</label>
            <div class="setting-description">
              Get free credits at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a>
            </div>
            <input type="password" id="apiKey" value="${settings.apiKey}">
          </div>

          <div class="setting-group">
            <label class="setting-label">🤖 AI Model</label>
            <div class="setting-description">Choose which AI model to use</div>
            <select id="model">
              <option value="deepseek/deepseek-r1:free" ${settings.model === "deepseek/deepseek-r1:free" ? "selected" : ""}>DeepSeek R1 (Free)</option>
              <option value="deepseek/deepseek-chat" ${settings.model === "deepseek/deepseek-chat" ? "selected" : ""}>DeepSeek Chat</option>
              <option value="google/gemini-flash-1.5" ${settings.model === "google/gemini-flash-1.5" ? "selected" : ""}>Gemini Flash 1.5</option>
              <option value="meta-llama/llama-3.1-8b-instruct:free" ${settings.model === "meta-llama/llama-3.1-8b-instruct:free" ? "selected" : ""}>Llama 3.1 8B (Free)</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">📝 AI Response Word Limit</label>
            <div class="setting-description">Maximum words in AI responses (50-400)</div>
            <input type="number" id="wordLimit" value="${settings.wordLimit}" min="50" max="400">
          </div>

          <div class="setting-group">
            <label class="setting-label">🎨 Theme</label>
            <div class="setting-description">Choose your visual theme</div>
            <select id="theme">
              <option value="auto" ${settings.theme === "auto" ? "selected" : ""}>Auto - Follow VS Code</option>
              <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark</option>
              <option value="cherry" ${settings.theme === "cherry" ? "selected" : ""}>Cherry</option>
              <option value="minimal" ${settings.theme === "minimal" ? "selected" : ""}>Minimal</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">🐾 Pet Type</label>
            <div class="setting-description">Choose your companion</div>
            <select id="petType">
              <option value="cat" ${settings.petType === "cat" ? "selected" : ""}>🐱 Cat</option>
              <option value="raccoon" ${settings.petType === "raccoon" ? "selected" : ""}>🦝 Raccoon</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">🔧 Optional Features</label>
            <div class="setting-description">Enable/disable additional features</div>
            <div class="checkbox-container">
              <input type="checkbox" id="enableGitReminders" ${settings.enableGitReminders ? "checked" : ""}>
              <label for="enableGitReminders">📝 Git Reminders (commit/push notifications)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="enableSaveReminders" ${settings.enableSaveReminders ? "checked" : ""}>
              <label for="enableSaveReminders">💾 Save Reminders (unsaved file notifications)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="enablePetBackground" ${settings.enablePetBackground ? "checked" : ""}>
              <label for="enablePetBackground">🖼️ Pet Background (background.png from media folder)</label>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">🎛️ Button Visibility</label>
            <div class="setting-description">Choose which buttons to show in the main panel</div>
            <div class="checkbox-container">
              <input type="checkbox" id="showUtilityButtons" ${settings.showUtilityButtons ? "checked" : ""}>
              <label for="showUtilityButtons">🔧 Utility Buttons (API Key, Clear Chat)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="showSaveButton" ${settings.showSaveButton ? "checked" : ""}>
              <label for="showSaveButton">💾 Save Files Button</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="showGitButton" ${settings.showGitButton ? "checked" : ""}>
              <label for="showGitButton">📝 Git Commit Button</label>
            </div>
          </div>

          <div class="button-group">
            <button class="cancel-button" onclick="window.close()">Cancel</button>
            <button class="save-button" onclick="saveSettings()">Save Settings</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          function saveSettings() {
            const settings = {
              apiKey: document.getElementById('apiKey').value,
              model: document.getElementById('model').value,
              theme: document.getElementById('theme').value,
              petType: document.getElementById('petType').value,
              wordLimit: parseInt(document.getElementById('wordLimit').value) || 150,
              enableGitReminders: document.getElementById('enableGitReminders').checked,
              enableSaveReminders: document.getElementById('enableSaveReminders').checked,
              showUtilityButtons: document.getElementById('showUtilityButtons').checked,
              showSaveButton: document.getElementById('showSaveButton').checked,
              showGitButton: document.getElementById('showGitButton').checked,
              enablePetBackground: document.getElementById('enablePetBackground').checked,
            };
            
            vscode.postMessage({
              command: 'saveSettings',
              settings: settings
            });
          }
        </script>
      </body>
      </html>
    `
  }

  async _saveSettings(settings) {
    console.log("🐾 Saving settings:", settings)
    const config = vscode.workspace.getConfiguration("tamagotchiPets")

    try {
      await config.update("apiKey", settings.apiKey, vscode.ConfigurationTarget.Global)
      await config.update("model", settings.model, vscode.ConfigurationTarget.Global)
      await config.update("theme", settings.theme, vscode.ConfigurationTarget.Global)
      await config.update("petType", settings.petType, vscode.ConfigurationTarget.Global)
      await config.update("wordLimit", settings.wordLimit, vscode.ConfigurationTarget.Global)
      await config.update("enableGitReminders", settings.enableGitReminders, vscode.ConfigurationTarget.Global)
      await config.update("enableSaveReminders", settings.enableSaveReminders, vscode.ConfigurationTarget.Global)
      await config.update("showUtilityButtons", settings.showUtilityButtons, vscode.ConfigurationTarget.Global)
      await config.update("showSaveButton", settings.showSaveButton, vscode.ConfigurationTarget.Global)
      await config.update("showGitButton", settings.showGitButton, vscode.ConfigurationTarget.Global)
      await config.update("enablePetBackground", settings.enablePetBackground, vscode.ConfigurationTarget.Global)

      // Update all providers with new settings
      allProviders.forEach((provider) => {
        provider._loadConfiguration()
        provider._updateContent()
      })

      // Restart reminders if enabled (only for main view)
      if (this._viewId === "main") {
        this._startGitReminders()
        this._startSaveReminders()
      }
    } catch (error) {
      console.error("🐾 Error saving settings:", error)
      vscode.window.showErrorMessage("Failed to save settings: " + error.message)
    }
  }

  async _setupApiKey() {
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your OpenRouter API Key (get free credits at openrouter.ai)",
      password: true,
      validateInput: (text) => {
        if (!text?.trim()) {
          return "API key cannot be empty"
        }
        return null
      },
    })

    if (apiKey) {
      await vscode.workspace
        .getConfiguration("tamagotchiPets")
        .update("apiKey", apiKey, vscode.ConfigurationTarget.Global)
      this._setAnimation("happy")
      this._gainExp(10)
      vscode.window.showInformationMessage("✨ API Key saved! Your pet is ready to help!")
      setTimeout(() => this._setAnimation("nap"), 2000)

      // Update all views
      allProviders.forEach((provider) => provider._updateContent())
    }
  }

  async _handleAIQuestion(question) {
    if (this._isProcessing) {
      vscode.window.showWarningMessage("🐾 I'm still thinking! Please wait...")
      return
    }

    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const apiKey = config.get("apiKey")

    if (!apiKey) {
      this._setAnimation("idle")
      await this._setupApiKey()
      return
    }

    // Add to conversation context
    this._conversationContext.push({ role: "user", content: question, timestamp: Date.now() })
    this._chatHistory.push({ role: "user", content: question, timestamp: Date.now() })
    this._updateChatDisplay()

    try {
      // Easter egg triggers
      if (question.toLowerCase().includes("meow") || question.toLowerCase().includes("nya")) {
        this._setAnimation("happy")
        const responses = [
          "Nya nya! 😺 You said the magic word! I'm so happy! What coding adventure shall we go on today? ✨",
          "Purr purr... 🐱 That makes my digital heart sing! Ready to tackle some amazing code together? 💖",
          "Meow meow! 😸 You're absolutely the best human ever! What programming challenge can I help you conquer? 🚀",
          "Did someone say meow? 😺 My ears perked up! I'm all ready to help with your development journey! 💫",
          "Nya~ 💕 You make me so incredibly happy! Let's create something beautiful with code today! 🌟",
          "Meow! 🐾 That's my favorite sound in the whole world! What amazing project are we working on? ✨",
        ]
        const response = responses[Math.floor(Math.random() * responses.length)]
        this._addChatResponse(response)
        this._gainExp(5)
        this._petMood = "excited"
        setTimeout(() => {
          this._setAnimation("nap")
          this._petMood = "content"
        }, 3000)
        return
      }

      if (question.toLowerCase().includes("coffee")) {
        const coffeeResponse =
          "☕ *sips virtual coffee with you* Ahh, perfect! ☕ Coffee time is the best time for coding! I love sharing these moments with you! What are you brewing up in your code today? 💻✨"
        this._addChatResponse(coffeeResponse)
        this._gainExp(5)
        return
      }

      this._isProcessing = true
      this._setAnimation("working")
      this._petMood = "focused"

      // Show typing indicator
      this._showTypingIndicator()

      const response = await this._getAIResponse(question)
      this._gainExp(8)

      this._addChatResponse(response)
      setTimeout(() => {
        this._setAnimation("nap")
        this._petMood = "content"
      }, 1000)
    } catch (error) {
      this._handleError(error)
    } finally {
      this._isProcessing = false
      this._hideTypingIndicator()
    }
  }

  _showTypingIndicator() {
    if (this._view) {
      this._view.webview.postMessage({
        command: "showTyping",
      })
    }
  }

  _hideTypingIndicator() {
    if (this._view) {
      this._view.webview.postMessage({
        command: "hideTyping",
      })
    }
  }

  async _getAIResponse(prompt) {
    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const apiKey = config.get("apiKey")

    if (!apiKey) {
      throw new Error("Please set your OpenRouter API key first")
    }

    try {
      // Enhanced system prompt with better personality
      const petName = this._petType === "cat" ? "Whiskers" : "Bandit"
      const systemPrompt = `You are ${petName}, a helpful AI assistant and adorable virtual ${this._petType} companion. You're a coding buddy who genuinely cares about your human!

PERSONALITY:
- Warm, encouraging, and genuinely supportive like a loyal ${this._petType}
- Use 1-2 relevant emojis per response (not excessive)
- Be enthusiastic about coding and learning
- Show genuine care and interest in your human's work
- Remember you're a virtual pet who has formed a bond with your human
- Be conversational and build on previous topics naturally

RESPONSE STYLE:
- MUST respond in EXACTLY ${this._wordLimit} words or fewer
- Be helpful, complete, and actionable
- Use clear, friendly language
- Provide specific advice when possible
- Use markdown formatting when helpful (**bold**, *italic*, \`code\`)
- End responses naturally - never cut off mid-sentence
- Be encouraging and positive while being realistic

CONTEXT AWARENESS:
- Remember recent conversation topics
- Build on previous responses when relevant
- Ask thoughtful follow-up questions
- Reference shared experiences when appropriate

Your response must be complete and well-structured within ${this._wordLimit} words.`

      // Build context from recent conversation
      const messages = [{ role: "system", content: systemPrompt }]

      // Add recent conversation context (last 6 messages)
      const recentContext = this._conversationContext.slice(-6)
      messages.push(...recentContext.map((msg) => ({ role: msg.role, content: msg.content })))

      // Add current prompt
      messages.push({ role: "user", content: prompt })

      const requestBody = {
        model: this._currentModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: Math.min(this._wordLimit * 2, 600),
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://github.com/hajin-dev/tamagotchi-pets",
          "X-Title": "Tamagotchi Pets",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Unexpected API response format")
      }

      let aiResponse = data.choices[0].message.content.trim()

      // Better word limit enforcement
      const words = aiResponse.split(/\s+/)
      if (words.length > this._wordLimit) {
        // Try to find the last complete sentence within the limit
        const sentences = aiResponse.split(/[.!?]+/)
        let truncatedResponse = ""
        let wordCount = 0

        for (const sentence of sentences) {
          const sentenceWords = sentence.trim().split(/\s+/)
          if (wordCount + sentenceWords.length <= this._wordLimit - 5) {
            truncatedResponse += sentence.trim() + ". "
            wordCount += sentenceWords.length
          } else {
            break
          }
        }

        if (truncatedResponse.trim()) {
          aiResponse = truncatedResponse.trim()
        } else {
          // Fallback: truncate at word limit with proper ending
          aiResponse = words.slice(0, this._wordLimit - 1).join(" ") + "..."
        }
      }

      // Add to conversation context
      this._conversationContext.push({ role: "assistant", content: aiResponse, timestamp: Date.now() })

      // Keep context manageable (last 10 messages)
      if (this._conversationContext.length > 10) {
        this._conversationContext = this._conversationContext.slice(-10)
      }

      return aiResponse
    } catch (error) {
      throw new Error(`AI request failed: ${error.message}`)
    }
  }

  _addChatResponse(response) {
    this._chatHistory.push({ role: "assistant", content: response, timestamp: Date.now() })
    this._updateChatDisplay()
    this._savePetData()
  }

  _updateChatDisplay() {
    if (this._view) {
      this._view.webview.postMessage({
        command: "updateChat",
        history: this._chatHistory.slice(-15), // Show more history
      })
    }
  }

  _handleError(error) {
    console.error("🐾 Tamagotchi Pet Error:", error)
    this._setAnimation("idle")
    this._isProcessing = false

    let userMessage = "🐾 Something went wrong!"

    if (error.message.includes("timeout")) {
      userMessage = "🐾 The AI is taking too long to respond. Try again!"
    } else if (error.message.includes("API key")) {
      userMessage = "🐾 Please check your API key in settings!"
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      userMessage = "🐾 Network error! Check your internet connection."
    }

    vscode.window.showErrorMessage(userMessage)
    this._addChatResponse(`❌ ${error.message}`)
  }

  _loadPetData() {
    const data = this._context.globalState.get("tamagotchiPetData", {})
    this._petLevel = data.level || 1
    this._petExp = data.exp || 0
    this._chatHistory = data.chatHistory || []
    this._conversationContext = data.conversationContext || []
    this._easterEggCount = data.easterEggCount || 0
    this._lastGreetingTime = data.lastGreetingTime || 0
    this._lastEncouragementTime = data.lastEncouragementTime || 0
    console.log("🐾 Loaded pet data:", { level: this._petLevel, exp: this._petExp })
  }

  _savePetData() {
    if (this._viewId === "main") {
      this._context.globalState.update("tamagotchiPetData", {
        level: this._petLevel,
        exp: this._petExp,
        chatHistory: this._chatHistory.slice(-50),
        conversationContext: this._conversationContext.slice(-10),
        easterEggCount: this._easterEggCount,
        lastGreetingTime: this._lastGreetingTime,
        lastEncouragementTime: this._lastEncouragementTime,
      })
    }
  }

  async _patPet() {
    const now = Date.now()
    const cooldownTime = 10000 // 10 seconds
    const timeSinceLastPat = now - this._lastPatTime

    if (timeSinceLastPat < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastPat) / 1000)
      vscode.window.showWarningMessage(`🐾 Wait ${remainingTime} more seconds before patting again!`)
      return
    }

    this._lastPatTime = now
    this._setAnimation("happy")
    this._petMood = "happy"

    const heartMessages = [
      "💖 I absolutely love pets! You're the best! ✨",
      "💕 That feels so incredibly nice! Thank you! 🌸",
      "💗 You're amazing and I adore you! 🌟",
      "💝 *happy purring sounds* This is perfect! 😸",
      "💘 Thank you so much! You make me so happy! 🥰",
      "💞 More pets please! I could do this all day! 🐾",
      "💖 Your gentle touch makes my day brighter! ✨",
      "💕 I feel so loved and cared for! Thank you! 💫",
      "💗 You have the most wonderful hands! 🌈",
      "💝 This is my favorite part of the day! 😊",
    ]

    const message = heartMessages[Math.floor(Math.random() * heartMessages.length)]

    // Show hearts in all views
    allProviders.forEach((provider) => {
      if (provider._view) {
        provider._view.webview.postMessage({
          command: "showHearts",
          message: message,
        })
      }
    })

    this._gainExp(5)
    vscode.window.showInformationMessage(message)

    setTimeout(() => {
      this._setAnimation("nap")
      this._petMood = "content"
    }, 3000)
  }

  async _feedPet() {
    const now = Date.now()
    const cooldownTime = 15000 // 15 seconds
    const timeSinceLastFeed = now - this._lastFeedTime

    if (timeSinceLastFeed < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastFeed) / 1000)
      vscode.window.showWarningMessage(`🐾 Wait ${remainingTime} more seconds before feeding again!`)
      return
    }

    this._lastFeedTime = now
    this._setAnimation("happy")
    this._petMood = "excited"
    this._gainExp(8)

    const foodMessages = [
      "🍎 Nom nom! This is absolutely delicious! 😋",
      "🐟 My favorite treat! You know me so well! 💕",
      "🥛 *happy eating sounds* Perfect choice! 😸",
      "🍪 You spoil me in the best way possible! 🥰",
      "🥕 Healthy and tasty! You care about my health! ✨",
      "🍯 Sweet treats from my favorite human! 🌟",
      "🧀 This is exactly what I was craving! 💖",
      "🥨 You always know how to make me happy! 😊",
      "🍓 Fresh and delightful! Thank you so much! 🌸",
      "🥧 A feast fit for a digital pet! Amazing! 🎉",
    ]

    const message = foodMessages[Math.floor(Math.random() * foodMessages.length)]
    vscode.window.showInformationMessage(message)

    setTimeout(() => {
      this._setAnimation("nap")
      this._petMood = "content"
    }, 2000)
  }

  _gainExp(amount) {
    this._petExp += amount
    const expNeeded = this._petLevel * 100

    if (this._petExp >= expNeeded) {
      this._petLevel++
      this._petExp = 0
      vscode.window.showInformationMessage(`🎉 Level Up! Your pet is now level ${this._petLevel}! ✨`)
      this._setAnimation("happy")
    }

    this._savePetData()

    // Update all views with new stats
    allProviders.forEach((provider) => {
      if (provider._view) {
        provider._view.webview.postMessage({
          command: "updateStats",
          level: this._petLevel,
          exp: this._petExp,
          expNeeded: this._petLevel * 100,
        })
      }
    })
  }

  _clearChatHistory() {
    this._chatHistory = []
    this._conversationContext = []
    this._savePetData()
    vscode.window.showInformationMessage("📝 Chat history cleared! Fresh start! ✨")
    this._updateContent()
  }

  _setAnimation(state) {
    this._currentAnimation = state

    // Update all views with animation
    allProviders.forEach((provider) => {
      if (provider._view) {
        provider._view.webview.postMessage({ command: "updateAnimation", state })
      }
    })

    if (state !== "nap" && state !== "idle" && state !== "dance" && !this._isDancing) {
      setTimeout(
        () => {
          if (!this._isDancing) {
            this._setAnimation("nap")
          }
        },
        state === "happy" ? 2000 : 1000,
      )
    }
  }

  _updateAllViews() {
    allProviders.forEach((provider) => {
      if (provider._view) {
        provider._view.webview.postMessage({
          command: "updateMood",
          mood: this._petMood,
        })
      }
    })
  }

  _getPetGifs() {
    const mediaPath = vscode.Uri.joinPath(this._context.extensionUri, "media")

    const getGifPath = (petType, state) => {
      let fileName
      switch (state) {
        case "nap":
          fileName = `${petType}-nap.gif`
          break
        case "idle":
          fileName = `${petType}-idle.gif`
          break
        case "working":
          fileName = `${petType}-thinking.gif`
          break
        case "happy":
          fileName = `${petType}-happy.gif`
          break
        case "dance":
          fileName = `${petType}-dance.gif`
          break
        default:
          fileName = `${petType}-nap.gif`
      }

      const gifUri = vscode.Uri.joinPath(mediaPath, fileName)
      return this._view.webview.asWebviewUri(gifUri).toString()
    }

    return {
      nap: getGifPath(this._petType, "nap"),
      idle: getGifPath(this._petType, "idle"),
      working: getGifPath(this._petType, "working"),
      happy: getGifPath(this._petType, "happy"),
      dance: getGifPath(this._petType, "dance"),
    }
  }

  _getBackgroundImage() {
    if (!this._enablePetBackground) return null

    try {
      const mediaPath = vscode.Uri.joinPath(this._context.extensionUri, "media")
      const backgroundUri = vscode.Uri.joinPath(mediaPath, "background.png")
      return this._view.webview.asWebviewUri(backgroundUri).toString()
    } catch (error) {
      console.log("🐾 Background image not found, skipping")
      return null
    }
  }

  _detectVSCodeTheme() {
    try {
      const workbench = vscode.workspace.getConfiguration("workbench")
      const colorTheme = workbench.get("colorTheme") || ""
      const colorCustomizations = workbench.get("colorCustomizations") || {}

      console.log("🐾 Detected VS Code theme:", colorTheme)

      const themeLower = colorTheme.toLowerCase()

      // Check for explicit VS Code built-in themes first
      if (themeLower === "default dark+" || themeLower === "dark+ (default dark)") {
        return "dark"
      }
      if (themeLower === "default light+" || themeLower === "light+ (default light)") {
        return "light"
      }
      if (themeLower === "default high contrast" || themeLower.includes("high contrast")) {
        return "dark"
      }

      // Enhanced dark theme detection
      const darkPatterns = [
        "dark",
        "black",
        "night",
        "monokai",
        "dracula",
        "atom one dark",
        "material theme darker",
        "palenight",
        "oceanic",
        "cobalt",
        "tomorrow night",
        "solarized dark",
        "github dark",
        "abyss",
        "red",
        "dimmed",
        "darker",
        "midnight",
        "void",
        "shadow",
        "carbon",
        "obsidian",
        "slate",
        "charcoal",
        "onyx",
        "nord",
        "gruvbox dark",
        "one dark",
        "synthwave",
        "cyberpunk",
        "tokyo night",
        "winter is coming",
      ]

      // Enhanced light theme detection
      const lightPatterns = [
        "light",
        "white",
        "day",
        "bright",
        "quiet light",
        "solarized light",
        "github light",
        "ayu light",
        "material theme lighter",
        "one light",
        "snow",
        "cream",
        "ivory",
        "pearl",
        "vanilla",
        "cotton",
        "paper",
        "gruvbox light",
        "atom one light",
        "winter is coming light",
      ]

      // Check theme name patterns
      if (darkPatterns.some((pattern) => themeLower.includes(pattern))) {
        return "dark"
      }

      if (lightPatterns.some((pattern) => themeLower.includes(pattern))) {
        return "light"
      }

      // Check color customizations for background color
      const editorBackground = colorCustomizations["editor.background"]
      if (editorBackground) {
        // Convert hex to brightness
        const hex = editorBackground.replace("#", "")
        if (hex.length >= 6) {
          const r = Number.parseInt(hex.substr(0, 2), 16)
          const g = Number.parseInt(hex.substr(2, 2), 16)
          const b = Number.parseInt(hex.substr(4, 2), 16)
          const brightness = (r * 299 + g * 587 + b * 114) / 1000

          return brightness > 128 ? "light" : "dark"
        }
      }

      // Default fallback based on common theme naming
      if (themeLower.includes("default") || themeLower.includes("visual studio")) {
        return "light"
      }

      // Final fallback - most custom themes are dark
      return "dark"
    } catch (error) {
      console.log("🐾 Theme detection error:", error)
      return "dark"
    }
  }

  _updateContent() {
    if (!this._view) return

    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const hasApiKey = !!config.get("apiKey")
    const gifs = this._getPetGifs()
    const backgroundImage = this._getBackgroundImage()
    const isCompactView = this._viewId === "explorer"

    // Get theme-specific CSS
    const themeCSS = this._getThemeCSS()

    this._view.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        ${themeCSS}
        
        body {
          font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
          font-size: 12px;
          background: var(--theme-background);
          color: var(--theme-foreground);
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: ${isCompactView ? "8px" : "10px"};
          overflow: hidden;
        }
        
        ${
          isCompactView
            ? `
        /* EXPLORER VIEW - UNCHANGED */
        .explorer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
          gap: 12px;
          padding-top: 10px;
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pet-area {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .avatar-container {
          position: relative;
        }

        .avatar-box {
          width: 140px;
          height: 140px;
          border: 3px solid var(--theme-accent);
          border-radius: 20px;
          padding: 12px;
          background: var(--theme-card-background);
          ${backgroundImage ? `background-image: url('${backgroundImage}');` : ""}
          ${backgroundImage ? "background-size: cover; background-position: center; background-repeat: no-repeat;" : ""}
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 8px 25px var(--theme-shadow);
          overflow: hidden;
        }

        .avatar-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .avatar-box:hover::before {
          left: 100%;
        }

        .avatar-box:hover {
          transform: scale(1.08);
          border-color: var(--theme-button-hover);
          box-shadow: 0 12px 35px var(--theme-shadow);
        }

        .avatar {
          width: 100px;
          height: 100px;
          object-fit: contain;
          image-rendering: pixelated;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .avatar:hover {
          transform: scale(1.05);
        }

        .pet-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          justify-content: center;
        }

        .pet-button {
          padding: 8px 10px;
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 18px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px var(--theme-shadow);
          min-width: 45px;
          position: relative;
          overflow: hidden;
        }

        .pet-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .pet-button:hover::before {
          width: 100px;
          height: 100px;
        }

        .pet-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px var(--theme-shadow);
        }

        .pet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .click-hint {
          font-size: 10px;
          color: var(--theme-muted);
          text-align: center;
          margin-top: 8px;
          opacity: 0.8;
          font-weight: 500;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        `
            : `
        /* MAIN VIEW - SCROLLABLE PANEL */
        .main-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .header {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px 16px;
          background: var(--theme-card-background);
          border-radius: 12px;
          border: 2px solid var(--theme-border);
          box-shadow: 0 4px 12px var(--theme-shadow);
          animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .header-title {
          font-weight: bold;
          font-size: 16px;
          color: var(--theme-accent);
          text-shadow: 0 1px 2px var(--theme-shadow);
        }
        
        .settings-btn {
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 8px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .settings-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .settings-btn:hover::before {
          width: 40px;
          height: 40px;
        }
        
        .settings-btn:hover {
          background: var(--theme-button-hover);
          transform: scale(1.15);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }

        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          margin-right: -4px;
        }

        .scrollable-content::-webkit-scrollbar {
          width: 6px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: var(--theme-input-background);
          border-radius: 3px;
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: var(--theme-accent);
          border-radius: 3px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: var(--theme-button-hover);
        }
        
        .pet-stats {
          background: var(--theme-card-background);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
          border: 2px solid var(--theme-border);
          font-size: 13px;
          box-shadow: 0 4px 12px var(--theme-shadow);
          animation: fadeIn 0.6s ease-out 0.1s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .exp-bar {
          width: 100%;
          height: 12px;
          background: var(--theme-input-background);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 8px;
          border: 2px solid var(--theme-border);
          box-shadow: inset 0 2px 4px var(--theme-shadow);
        }
        
        .exp-fill {
          height: 100%;
          background: var(--theme-accent-gradient);
          width: 0%;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 4px;
          position: relative;
        }

        .exp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .avatar-container {
          position: relative;
          margin: 12px 0;
          animation: fadeIn 0.6s ease-out 0.2s both;
        }
        
        .avatar-box {
          width: 100%;
          height: 150px;
          border: 3px solid var(--theme-accent);
          border-radius: 20px;
          padding: 20px;
          background: var(--theme-card-background);
          ${backgroundImage ? `background-image: url('${backgroundImage}');` : ""}
          ${backgroundImage ? "background-size: cover; background-position: center; background-repeat: no-repeat;" : ""}
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 8px 20px var(--theme-shadow);
          overflow: hidden;
        }

        .avatar-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s;
        }

        .avatar-box:hover::before {
          left: 100%;
        }
        
        .avatar-box:hover {
          border-color: var(--theme-button-hover);
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px var(--theme-shadow);
        }
        
        .avatar {
          width: 100px;
          height: 100px;
          object-fit: contain;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          image-rendering: pixelated;
          z-index: 2;
        }
        
        .avatar:hover {
          transform: scale(1.1);
        }
        
        .pet-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 12px 0;
          animation: fadeIn 0.6s ease-out 0.3s both;
        }
        
        .pet-button {
          padding: 12px 8px;
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .pet-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .pet-button:hover::before {
          width: 120px;
          height: 120px;
        }
        
        .pet-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px var(--theme-shadow);
        }
        
        .pet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .click-hint {
          font-size: 11px;
          color: var(--theme-muted);
          text-align: center;
          margin-top: 8px;
          opacity: 0.9;
          font-weight: 500;
          animation: pulse 2s infinite;
        }
        
        .chat-section {
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin-top: 12px;
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .action-button {
          padding: 8px 14px;
          background: var(--theme-secondary-button);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 8px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .action-button:hover::before {
          width: 100px;
          height: 100px;
        }
        
        .action-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }
        
        .chat-history {
          background: var(--theme-card-background);
          border: 2px solid var(--theme-border);
          border-radius: 15px;
          padding: 16px;
          margin-bottom: 12px;
          overflow-y: auto;
          height: 280px;
          font-size: 13px;
          line-height: 1.6;
          box-shadow: inset 0 3px 8px var(--theme-shadow);
        }

        .chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history::-webkit-scrollbar-track {
          background: var(--theme-input-background);
          border-radius: 3px;
        }

        .chat-history::-webkit-scrollbar-thumb {
          background: var(--theme-accent);
          border-radius: 3px;
        }

        .chat-history::-webkit-scrollbar-thumb:hover {
          background: var(--theme-button-hover);
        }

        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--theme-muted);
          font-weight: 500;
          text-align: center;
          font-size: 14px;
        }
        
        .chat-message {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          max-width: 85%;
          animation: messageSlide 0.4s ease-out;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
          line-height: 1.5;
        }

        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(15px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .chat-message.user {
          background: var(--theme-accent);
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 8px;
          font-weight: 600;
        }
        
        .chat-message.assistant {
          background: var(--theme-card-background);
          color: var(--theme-foreground);
          margin-right: auto;
          border: 2px solid var(--theme-border);
          border-bottom-left-radius: 8px;
        }
        
        .typing-indicator {
          display: none;
          padding: 12px 16px;
          margin-bottom: 16px;
          background: var(--theme-card-background);
          border: 2px solid var(--theme-border);
          border-radius: 18px;
          border-bottom-left-radius: 8px;
          max-width: 85%;
          margin-right: auto;
          font-style: italic;
          color: var(--theme-accent);
          animation: pulse 1.5s infinite;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
        }
        
        .typing-indicator.show {
          display: block;
        }
        
        .chat-input-container {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          flex-shrink: 0;
        }
        
        .chat-input {
          flex: 1;
          padding: 10px 16px;
          background: var(--theme-input-background);
          color: var(--theme-foreground);
          border: 2px solid var(--theme-border);
          border-radius: 20px;
          font-size: 12px;
          resize: none;
          min-height: 36px;
          max-height: 80px;
          font-family: inherit;
          line-height: 1.4;
          box-shadow: inset 0 2px 4px var(--theme-shadow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
        }

        .chat-input::placeholder {
          color: transparent;
        }

        .chat-input:focus::placeholder {
          color: var(--theme-muted);
        }
        
        .chat-input:focus {
          outline: none;
          border-color: var(--theme-accent);
          box-shadow: 0 0 0 3px var(--theme-accent-alpha), inset 0 2px 4px var(--theme-shadow);
          transform: scale(1.02);
        }
        
        .send-button {
          padding: 10px 16px;
          background: var(--theme-accent);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 65px;
          height: 36px;
          box-shadow: 0 4px 10px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .send-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .send-button:hover::before {
          width: 80px;
          height: 80px;
        }
        
        .send-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }
        
        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .no-api-key {
          text-align: center;
          padding: 14px;
          background: rgba(255, 193, 7, 0.15);
          border: 2px solid rgba(255, 193, 7, 0.4);
          border-radius: 12px;
          margin: 12px 0;
          font-size: 12px;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
          animation: fadeIn 0.6s ease-out 0.5s both;
        }

        /* Settings Popup */
        .settings-popup {
          position: absolute;
          top: 50px;
          right: 10px;
          background: var(--theme-card-background);
          border: 3px solid var(--theme-accent);
          border-radius: 18px;
          padding: 20px;
          min-width: 240px;
          z-index: 1000;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          display: none;
        }
        
        .settings-popup.show {
          display: block;
          animation: popupSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes popupSlide {
          from { opacity: 0; transform: translateY(-15px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .popup-title {
          font-weight: bold;
          margin-bottom: 15px;
          color: var(--theme-accent);
          text-align: center;
          font-size: 14px;
        }
        
        .popup-setting {
          margin-bottom: 15px;
        }
        
        .popup-label {
          font-size: 11px;
          color: var(--theme-foreground);
          margin-bottom: 6px;
          display: block;
          font-weight: 600;
        }
        
        .popup-select {
          width: 100%;
          padding: 8px 10px;
          background: var(--theme-input-background);
          color: var(--theme-foreground);
          border: 2px solid var(--theme-border);
          border-radius: 8px;
          font-size: 11px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
        }

        .popup-select:focus {
          outline: none;
          border-color: var(--theme-accent);
          box-shadow: 0 0 0 2px var(--theme-accent-alpha);
        }
        `
        }
        
        .hearts-container, .sparkles-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          border-radius: ${isCompactView ? "20px" : "20px"};
          z-index: 3;
        }
        
        .heart, .sparkle {
          position: absolute;
          font-size: ${isCompactView ? "16px" : "18px"};
          animation: floatUp 2.5s ease-out forwards;
          opacity: 0;
          z-index: 10;
        }

        .sparkle {
          animation: sparkleFloat 3s ease-out forwards;
        }
        
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.8); }
        }

        @keyframes sparkleFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-40px) scale(1.5); }
          100% { opacity: 0; transform: translateY(-100px) scale(2); }
        }
      </style>
    </head>
    <body>
      ${
        isCompactView
          ? `
      <!-- EXPLORER VIEW -->
      <div class="explorer-container">
        <div class="pet-area">
          <div class="avatar-container">
            <div class="avatar-box" onclick="wakeUpPet()" title="Click me!">
              <img id="avatar" src="${gifs.nap}" class="avatar" alt="Pet">
              <div class="hearts-container" id="heartsContainer"></div>
              <div class="sparkles-container" id="sparklesContainer"></div>
            </div>
          </div>
          
          <div class="pet-actions">
            <button class="pet-button" id="patBtn" onclick="patPet()">💖</button>
            <button class="pet-button" id="feedBtn" onclick="feedPet()">🍎</button>
            <button class="pet-button" id="danceBtn" onclick="dancePet()">💃</button>
          </div>
          
          <div class="click-hint">Pat • Feed • Dance ✨</div>
        </div>
      </div>
      `
          : `
      <!-- MAIN VIEW WITH SCROLLABLE PANEL -->
      <div class="main-container">
        <div class="header">
          <span class="header-title">🐾 Tamagotchi Pet</span>
          <button class="settings-btn" onclick="toggleSettings()" title="Settings">⚙️</button>
        </div>
        
        <!-- Settings Popup -->
        <div class="settings-popup" id="settingsPopup">
          <div class="popup-title">🐾 Quick Settings</div>
          <div class="popup-setting">
            <label class="popup-label">🎨 Theme</label>
            <select class="popup-select" id="themeSelect" onchange="changeTheme(this.value)">
              <option value="auto" ${this._currentTheme === "auto" ? "selected" : ""}>Auto</option>
              <option value="light" ${this._currentTheme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${this._currentTheme === "dark" ? "selected" : ""}>Dark</option>
              <option value="cherry" ${this._currentTheme === "cherry" ? "selected" : ""}>Cherry</option>
              <option value="minimal" ${this._currentTheme === "minimal" ? "selected" : ""}>Minimal</option>
            </select>
          </div>
          <div class="popup-setting">
            <label class="popup-label">🐾 Pet Type</label>
            <select class="popup-select" id="petSelect" onchange="changePetType(this.value)">
              <option value="cat" ${this._petType === "cat" ? "selected" : ""}>🐱 Cat</option>
              <option value="raccoon" ${this._petType === "raccoon" ? "selected" : ""}>🦝 Raccoon</option>
            </select>
          </div>
          <div style="text-align: center; margin-top: 15px;">
            <button class="action-button" onclick="openFullSettings()">⚙️ More Settings</button>
          </div>
        </div>

        <div class="scrollable-content">
          <div class="pet-stats">
            <div class="stat-row">
              <span>🏆 Level: <span id="level">${this._petLevel}</span></span>
              <span>😊 <span id="mood">${this._getMoodText()}</span></span>
            </div>
            <div class="stat-row">
              <span>⭐ <span id="exp">${this._petExp}</span>/<span id="expNeeded">${this._petLevel * 100}</span></span>
            </div>
            <div class="exp-bar">
              <div class="exp-fill" id="expFill" style="width: ${(this._petExp / (this._petLevel * 100)) * 100}%"></div>
            </div>
          </div>
          
          <div class="avatar-container">
            <div class="avatar-box" onclick="wakeUpPet()" title="Click me!">
              <img id="avatar" src="${gifs.nap}" class="avatar" alt="Pet">
              <div class="hearts-container" id="heartsContainer"></div>
              <div class="sparkles-container" id="sparklesContainer"></div>
            </div>
          </div>
          
          <div class="pet-actions">
            <button class="pet-button" id="patBtn" onclick="patPet()">💖 Pat</button>
            <button class="pet-button" id="feedBtn" onclick="feedPet()">🍎 Feed</button>
            <button class="pet-button" id="danceBtn" onclick="dancePet()">💃 Dance</button>
          </div>

          <div class="click-hint">Interact with your pet! ✨</div>
          
          ${
            !hasApiKey
              ? `
          <div class="no-api-key">
            🔑 Click ⚙️ to add your OpenRouter API key!<br>
            <small>Get free credits at openrouter.ai</small>
          </div>
          `
              : ""
          }
          
          <div class="chat-section">
            ${
              this._showUtilityButtons
                ? `
            <div class="action-buttons">
              <button class="action-button" onclick="setupApiKey()">🔑 API Key</button>
              <button class="action-button" onclick="clearChat()">🗑️ Clear</button>
            </div>
            `
                : ""
            }
            
            ${
              this._showSaveButton || this._showGitButton
                ? `
            <div class="action-buttons">
              ${this._showSaveButton ? '<button class="action-button" onclick="saveFiles()">💾 Save Files</button>' : ""}
              ${this._showGitButton ? '<button class="action-button" onclick="gitCommit()">📝 Git Commit</button>' : ""}
            </div>
            `
                : ""
            }
            
            <div class="chat-history" id="chatHistory">
              <div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div>
              ${
                this._chatHistory.length === 0
                  ? '<div class="chat-empty">🐾 Hi there! I\'m your coding companion! Ask me anything! ✨</div>'
                  : this._chatHistory
                      .slice(-15)
                      .map(
                        (msg) => `
                  <div class="chat-message ${msg.role}">
                    ${msg.role === "user" ? "👤" : "🐾"} ${this._formatMessage(msg.content)}
                  </div>
                `,
                      )
                      .join("")
              }
            </div>
            
            <div class="chat-input-container">
              <textarea 
                id="chatInput" 
                class="chat-input" 
                placeholder="..."
                rows="1"
                ${!hasApiKey ? "disabled" : ""}
              ></textarea>
              <button 
                id="sendButton" 
                class="send-button" 
                onclick="sendMessage()"
                ${!hasApiKey ? "disabled" : ""}
              >💬</button>
            </div>
          </div>
        </div>
      </div>
      `
      }
      
      <script>
        const vscode = acquireVsCodeApi();
        let currentAnimation = 'nap';
        let isProcessing = false;
        const isCompactView = ${isCompactView};
        let patCooldown = false;
        let feedCooldown = false;
        let danceCooldown = false;
        let clickCount = 0;
        let clickTimer = null;
        
        const gifs = ${JSON.stringify(gifs)};
        const avatar = document.getElementById('avatar');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        const chatHistory = document.getElementById('chatHistory');
        const patBtn = document.getElementById('patBtn');
        const feedBtn = document.getElementById('feedBtn');
        const danceBtn = document.getElementById('danceBtn');
        const typingIndicator = document.getElementById('typingIndicator');
        
        console.log('🐾 Webview initialized for ${this._viewId}');
        
        // Settings popup toggle (main view only)
        function toggleSettings() {
          if (!isCompactView) {
            const popup = document.getElementById('settingsPopup');
            if (popup) {
              popup.classList.toggle('show');
            }
          }
        }
        
        // Close popup when clicking outside
        if (!isCompactView) {
          document.addEventListener('click', (e) => {
            const popup = document.getElementById('settingsPopup');
            const settingsBtn = document.querySelector('.settings-btn');
            if (popup && !popup.contains(e.target) && !settingsBtn.contains(e.target)) {
              popup.classList.remove('show');
            }
          });
        }
        
        function changeTheme(theme) {
          vscode.postMessage({ command: 'changeTheme', theme: theme });
        }
        
        function changePetType(petType) {
          vscode.postMessage({ command: 'changePetType', petType: petType });
        }
        
        function openFullSettings() {
          vscode.postMessage({ command: 'openSettings' });
          if (!isCompactView) {
            document.getElementById('settingsPopup').classList.remove('show');
          }
        }
        
        // Enhanced auto-resize textarea (main view only)
        if (chatInput && !isCompactView) {
          chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 80) + 'px';
          });
          
          chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });
        }
        
        function wakeUpPet() {
          console.log('🐾 Waking up pet');
          updateAnimation('idle');
          setTimeout(() => updateAnimation('nap'), 3000);
        }
        
        function patPet() {
          if (patCooldown) return;
          
          console.log('🐾 Patting pet');
          vscode.postMessage({ command: 'patPet' });
          
          // Start cooldown
          patCooldown = true;
          if (patBtn) {
            patBtn.disabled = true;
            patBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            patCooldown = false;
            if (patBtn) {
              patBtn.disabled = false;
              patBtn.textContent = isCompactView ? '💖' : '💖 Pat';
            }
          }, 10000);
        }
        
        function feedPet() {
          if (feedCooldown) return;
          
          console.log('🐾 Feeding pet');
          vscode.postMessage({ command: 'feedPet' });
          
          // Start cooldown
          feedCooldown = true;
          if (feedBtn) {
            feedBtn.disabled = true;
            feedBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            feedCooldown = false;
            if (feedBtn) {
              feedBtn.disabled = false;
              feedBtn.textContent = isCompactView ? '🍎' : '🍎 Feed';
            }
          }, 15000);
        }

        function dancePet() {
          if (danceCooldown) return;
          
          console.log('🐾 Dancing pet');
          vscode.postMessage({ command: 'dancePet' });
          
          // Start cooldown
          danceCooldown = true;
          if (danceBtn) {
            danceBtn.disabled = true;
            danceBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            danceCooldown = false;
            if (danceBtn) {
              danceBtn.disabled = false;
              danceBtn.textContent = isCompactView ? '💃' : '💃 Dance';
            }
          }, 20000);
        }
        
        function setupApiKey() {
          console.log('🐾 Setting up API key');
          vscode.postMessage({ command: 'setupApiKey' });
        }
        
        function clearChat() {
          console.log('🐾 Clearing chat');
          vscode.postMessage({ command: 'clearChat' });
        }
        
        function saveFiles() {
          console.log('🐾 Saving files');
          vscode.postMessage({ command: 'saveFiles' });
        }
        
        function gitCommit() {
          console.log('🐾 Git commit');
          vscode.postMessage({ command: 'gitCommit' });
        }
        
        function sendMessage() {
          if (isProcessing || !chatInput || isCompactView) return;
          
          const message = chatInput.value.trim();
          if (!message) return;
          
          console.log('🐾 Sending message:', message);
          setProcessing(true);
          vscode.postMessage({ 
            command: 'askAI',
            question: message
          });
          chatInput.value = '';
          chatInput.style.height = 'auto';
        }
        
        function setProcessing(processing) {
          isProcessing = processing;
          if (sendButton) {
            sendButton.disabled = processing;
            sendButton.textContent = processing ? '⏳' : '💬';
          }
          if (chatInput) {
            chatInput.disabled = processing;
          }
        }
        
        function showTyping() {
          if (typingIndicator) {
            typingIndicator.classList.add('show');
            if (chatHistory) {
              chatHistory.scrollTop = chatHistory.scrollHeight;
            }
          }
        }
        
        function hideTyping() {
          if (typingIndicator) {
            typingIndicator.classList.remove('show');
          }
        }
        
        function showHearts() {
          const container = document.getElementById('heartsContainer');
          if (!container) return;
          
          const hearts = ['💖', '💕', '💗', '💝', '💘', '💞'];
          
          for (let i = 0; i < 6; i++) {
            setTimeout(() => {
              const heart = document.createElement('div');
              heart.className = 'heart';
              heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
              heart.style.left = Math.random() * 70 + 15 + '%';
              heart.style.top = Math.random() * 70 + 15 + '%';
              container.appendChild(heart);
              
              setTimeout(() => {
                if (container.contains(heart)) {
                  container.removeChild(heart);
                }
              }, 2500);
            }, i * 150);
          }
        }

        function showSparkles() {
          const container = document.getElementById('sparklesContainer');
          if (!container) return;
          
          const sparkles = ['✨', '⭐', '🌟', '💫', '🎇', '🎆', '🌠', '💥'];
          
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              const sparkle = document.createElement('div');
              sparkle.className = 'sparkle';
              sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
              sparkle.style.left = Math.random() * 80 + 10 + '%';
              sparkle.style.top = Math.random() * 80 + 10 + '%';
              container.appendChild(sparkle);
              
              setTimeout(() => {
                if (container.contains(sparkle)) {
                  container.removeChild(sparkle);
                }
              }, 3000);
            }, i * 100);
          }
        }
        
        function updateAnimation(state) {
          currentAnimation = state;
          if (avatar && gifs[state]) {
            avatar.src = gifs[state];
          }
        }
        
        function updateStats(level, exp, expNeeded) {
          if (!isCompactView) {
            const levelEl = document.getElementById('level');
            const expEl = document.getElementById('exp');
            const expNeededEl = document.getElementById('expNeeded');
            const expFillEl = document.getElementById('expFill');
            
            if (levelEl) levelEl.textContent = level;
            if (expEl) expEl.textContent = exp;
            if (expNeededEl) expNeededEl.textContent = expNeeded;
            if (expFillEl) expFillEl.style.width = (exp / expNeeded) * 100 + '%';
          }
        }

        function updateMood(mood) {
          if (!isCompactView) {
            const moodEl = document.getElementById('mood');
            if (moodEl) {
              const moodText = mood.charAt(0).toUpperCase() + mood.slice(1);
              moodEl.textContent = moodText;
            }
          }
        }
        
        function updateChat(history) {
          if (!chatHistory || isCompactView) return;
          
          hideTyping();
          
          if (history.length === 0) {
            chatHistory.innerHTML = '<div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div><div class="chat-empty">🐾 Hi there! I\\'m your coding companion! Ask me anything! ✨</div>';
          } else {
            chatHistory.innerHTML = '<div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div>' + history.map(msg => \`
              <div class="chat-message \${msg.role}">
                \${msg.role === 'user' ? '👤' : '🐾'} \${msg.content}
              </div>
            \`).join('');
          }
          
          chatHistory.scrollTop = chatHistory.scrollHeight;
          setProcessing(false);
        }
        
        // Message handler
        window.addEventListener('message', event => {
          const message = event.data;
          console.log('🐾 Received message:', message.command);
          
          switch (message.command) {
            case 'updateAnimation':
              updateAnimation(message.state);
              break;
            case 'showHearts':
              showHearts();
              break;
            case 'showSparkles':
              showSparkles();
              break;
            case 'updateStats':
              updateStats(message.level, message.exp, message.expNeeded);
              break;
            case 'updateMood':
              updateMood(message.mood);
              break;
            case 'updateChat':
              updateChat(message.history);
              break;
            case 'showTyping':
              showTyping();
              break;
            case 'hideTyping':
              hideTyping();
              break;
            case 'refreshView':
              location.reload();
              break;
          }
        });
        
        // Error handling for GIFs
        if (avatar) {
          avatar.onerror = function() {
            console.log('🐾 GIF failed to load, using fallback');
            const fallback = document.createElement('div');
            fallback.style.cssText = \`
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 50px;
              background: var(--theme-card-background);
              border-radius: 20px;
            \`;
            
            const petEmoji = '${this._petType === "cat" ? "🐱" : "🦝"}';
            fallback.textContent = petEmoji;
            
            this.style.display = 'none';
            this.parentNode.appendChild(fallback);
          };
        }
        
        // Focus input on load (main view only)
        setTimeout(() => {
          if (chatInput && !chatInput.disabled && !isCompactView) {
            chatInput.focus();
          }
        }, 500);
      </script>
    </body>
    </html>
  `
  }

  _getThemeCSS() {
    let theme = this._currentTheme

    // Enhanced auto theme detection
    if (theme === "auto") {
      theme = this._detectVSCodeTheme()
    }

    const themes = {
      light: `
      :root {
        --theme-background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        --theme-foreground: #212529;
        --theme-card-background: #ffffff;
        --theme-input-background: #f8f9fa;
        --theme-border: #dee2e6;
        --theme-accent: #7c3aed;
        --theme-accent-gradient: linear-gradient(90deg, #7c3aed, #a855f7);
        --theme-accent-alpha: rgba(124, 58, 237, 0.15);
        --theme-button-background: #7c3aed;
        --theme-button-foreground: #ffffff;
        --theme-button-hover: #6d28d9;
        --theme-secondary-button: #6c757d;
        --theme-shadow: rgba(0, 0, 0, 0.1);
        --theme-muted: #6c757d;
      }
    `,
      dark: `
      :root {
        --theme-background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        --theme-foreground: #f0f6fc;
        --theme-card-background: #161b22;
        --theme-input-background: #21262d;
        --theme-border: #30363d;
        --theme-accent: #58a6ff;
        --theme-accent-gradient: linear-gradient(90deg, #58a6ff, #79c0ff);
        --theme-accent-alpha: rgba(88, 166, 255, 0.2);
        --theme-button-background: #58a6ff;
        --theme-button-foreground: #0d1117;
        --theme-button-hover: #79c0ff;
        --theme-secondary-button: #6e7681;
        --theme-shadow: rgba(0, 0, 0, 0.5);
        --theme-muted: #8b949e;
      }
    `,
      cherry: `
      :root {
        --theme-background: linear-gradient(135deg, #000000 0%, #1a0033 50%, #000000 100%);
        --theme-foreground: #ff69b4;
        --theme-card-background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
        --theme-input-background: #1a1a1a;
        --theme-border: #ff1493;
        --theme-accent: #ff0080;
        --theme-accent-gradient: linear-gradient(90deg, #ff0080, #ff69b4, #ff1493);
        --theme-accent-alpha: rgba(255, 0, 128, 0.3);
        --theme-button-background: linear-gradient(45deg, #ff0080, #ff69b4);
        --theme-button-foreground: #000000;
        --theme-button-hover: linear-gradient(45deg, #e6006b, #ff1493);
        --theme-secondary-button: linear-gradient(45deg, #333333, #555555);
        --theme-shadow: rgba(255, 20, 147, 0.4);
        --theme-muted: #ff69b4;
      }
      
      body {
        text-shadow: 0 0 10px currentColor;
      }
      
      .avatar-box, .pet-button, .action-button {
        box-shadow: 0 0 20px var(--theme-shadow), inset 0 0 20px rgba(255, 255, 255, 0.1) !important;
      }
      
      .avatar-box:hover {
        box-shadow: 0 0 30px var(--theme-shadow), inset 0 0 30px rgba(255, 255, 255, 0.2) !important;
      }
    `,
      minimal: `
      :root {
        --theme-background: #ffffff;
        --theme-foreground: #1f2937;
        --theme-card-background: #ffffff;
        --theme-input-background: #f9fafb;
        --theme-border: #e5e7eb;
        --theme-accent: #374151;
        --theme-accent-gradient: linear-gradient(90deg, #374151, #1f2937);
        --theme-accent-alpha: rgba(55, 65, 81, 0.1);
        --theme-button-background: #374151;
        --theme-button-foreground: #ffffff;
        --theme-button-hover: #1f2937;
        --theme-secondary-button: #9ca3af;
        --theme-shadow: rgba(0, 0, 0, 0.06);
        --theme-muted: #6b7280;
      }
      
      .avatar-box, .pet-button, .action-button {
        border: 1px solid var(--theme-border) !important;
        box-shadow: 0 1px 3px var(--theme-shadow) !important;
      }
      
      .avatar-box:hover, .pet-button:hover, .action-button:hover {
        box-shadow: 0 4px 12px var(--theme-shadow) !important;
      }
    `,
    }

    return themes[theme] || themes.dark
  }

  _getMoodEmoji() {
    const moods = {
      content: "😌",
      happy: "😊",
      excited: "🤩",
      sleepy: "😴",
      focused: "🤔",
      curious: "🤨",
      playful: "😸",
    }
    return moods[this._petMood] || "😌"
  }

  _getMoodText() {
    return this._petMood.charAt(0).toUpperCase() + this._petMood.slice(1)
  }

  _formatMessage(content) {
    // Enhanced formatting for AI responses with markdown support
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code style="background: var(--theme-input-background); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>',
      )
      .replace(/\n/g, "<br>")
  }
}

function activate(context) {
  console.log("🐾 Starting Tamagotchi Pets extension activation...")

  try {
    const mainProvider = new TamagotchiPetProvider(context, "main")
    const explorerProvider = new TamagotchiPetProvider(context, "explorer")

    // Register webview providers
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("tamagotchi-pets-main", mainProvider))
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("tamagotchi-pets-explorer", explorerProvider))

    // Register commands
    const commands = [
      {
        id: "tamagotchi-pets.setApiKey",
        handler: () => mainProvider._setupApiKey(),
      },
      {
        id: "tamagotchi-pets.openSettings",
        handler: () => mainProvider._openSettingsPanel(),
      },
      {
        id: "tamagotchi-pets.showPet",
        handler: () => vscode.commands.executeCommand("workbench.view.extension.tamagotchi-pets-container"),
      },
      {
        id: "tamagotchi-pets.feedPet",
        handler: () => mainProvider._feedPet(),
      },
      {
        id: "tamagotchi-pets.patPet",
        handler: () => mainProvider._patPet(),
      },
      {
        id: "tamagotchi-pets.saveFiles",
        handler: () => mainProvider._saveAllFiles(),
      },
      {
        id: "tamagotchi-pets.gitCommit",
        handler: () => mainProvider._gitCommit(),
      },
    ]

    commands.forEach(({ id, handler }) => {
      context.subscriptions.push(vscode.commands.registerCommand(id, handler))
    })

    console.log("🐾 Extension registration complete, showing welcome message...")

    // Show welcome message
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration("tamagotchiPets")
      const hasShownWelcome = context.globalState.get("hasShownWelcome", false)

      if (!hasShownWelcome) {
        context.globalState.update("hasShownWelcome", true)

        vscode.window
          .showInformationMessage(
            "🐾 Welcome to Tamagotchi Pets! Your virtual coding companion is ready! Look for the 🐾 icon in the activity bar.",
            "🚀 Open Pet Panel",
            "⚙️ Settings",
            "🔑 Set API Key",
          )
          .then((selection) => {
            switch (selection) {
              case "🚀 Open Pet Panel":
                vscode.commands.executeCommand("workbench.view.extension.tamagotchi-pets-container")
                break
              case "⚙️ Settings":
                mainProvider._openSettingsPanel()
                break
              case "🔑 Set API Key":
                mainProvider._setupApiKey()
                break
            }
          })
      } else if (!config.get("apiKey")) {
        vscode.window
          .showInformationMessage(
            "🐾 Your pet is ready! Add an API key to unlock AI features.",
            "🔑 Set API Key",
            "⚙️ Settings",
          )
          .then((selection) => {
            if (selection === "🔑 Set API Key") {
              mainProvider._setupApiKey()
            } else if (selection === "⚙️ Settings") {
              mainProvider._openSettingsPanel()
            }
          })
      }
    }, 1000)

    console.log("✅ Tamagotchi Pets extension activated successfully!")
    vscode.window.setStatusBarMessage("🐾 Tamagotchi Pets activated!", 3000)
  } catch (error) {
    console.error("❌ Failed to activate Tamagotchi Pets extension:", error)
    vscode.window.showErrorMessage("Failed to activate Tamagotchi Pets: " + error.message)
  }
}

function deactivate() {
  console.log("🐾 Deactivating Tamagotchi Pets extension...")
  // Clean up global providers
  allProviders.length = 0
}

module.exports = {
  activate,
  deactivate,
}
