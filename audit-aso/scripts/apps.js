/**
 * App configurations for ASO audit
 */

const path = require("path");

const OMAPPS = path.join(process.env.HOME, "Documents", "OmApps");
const SCRIPTS = path.join(OMAPPS, "scripts");

const APPS = {
  futevolution: {
    name: "FUT Evolution",
    bundleId: "com.futevolution.app",
    packageName: "com.futevolution.app",
    projectPath: path.join(OMAPPS, "futevo"),
    locales: {
      ios: ["en-US", "fr-FR", "es-ES"],
      android: ["en-US", "fr-FR", "es-ES"],
    },
    category: "Sports",
    competitors: [
      { name: "FUTBIN", iosId: "1080465358", androidId: "com.futbin" },
      { name: "FUT.GG", iosId: "6470957382", androidId: "com.futgg.futgg" },
      { name: "FUTWIZ", iosId: "579253659", androidId: "air.com.FUTWIZFUT" },
    ],
    keywords: {
      primary: ["fc 26", "ultimate team", "squad analyzer", "fut"],
      secondary: ["chemistry", "formation", "upgrade", "player prices", "meta", "evolutions"],
      longtail: ["fc 26 squad builder", "fut upgrade suggestions", "ai squad analysis"],
    },
    features: [
      "AI squad analysis from screenshots",
      "Face detection player matching",
      "Chemistry calculation",
      "Upgrade suggestions with coin prices",
      "Meta tier list",
      "AI coach chat",
      "30 formation support",
    ],
  },
  chatbook: {
    name: "ChatBook",
    bundleId: "com.whatsapptovideo.app",
    packageName: "com.whatsapptovideo.app",
    projectPath: path.join(OMAPPS, "chatbook"),
    locales: {
      ios: ["en-US", "fr-FR", "es-ES", "de-DE", "it-IT", "pt-BR", "nl-NL", "ar-SA", "zh-Hans"],
      android: ["en-US", "fr-FR", "es-ES", "de-DE", "it-IT", "pt-BR", "nl-NL", "ar", "zh-CN"],
    },
    category: "Social Networking",
    competitors: [],
    keywords: {
      primary: ["whatsapp", "chat", "video", "memories"],
      secondary: ["messenger", "telegram", "imessage", "anniversary"],
      longtail: ["whatsapp chat to video", "chat memories video"],
    },
    features: [
      "Convert WhatsApp chats to video",
      "Messenger memories",
      "Telegram chat albums",
      "iMessage memories",
      "Couples anniversary videos",
    ],
  },
};

// Script paths for App Store Connect and Google Play APIs
const ASC_SCRIPT = path.join(SCRIPTS, "appstore_connect.py");
const GPS_SCRIPT = path.join(SCRIPTS, "playstore_connect.py");

module.exports = { APPS, ASC_SCRIPT, GPS_SCRIPT, OMAPPS };
