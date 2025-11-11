import { getExternalAdReply } from "../config/bot.js";

export function addExternalAdReply(content, skipExternalAd = false) {
    if (skipExternalAd || typeof content !== 'object' || !content) {
        return content;
    }
    
    const externalAd = getExternalAdReply();
    
    if (!content.contextInfo) {
        content.contextInfo = {};
    }
    
    if (!content.contextInfo.externalAdReply) {
        content.contextInfo.externalAdReply = externalAd;
    }
    
    if (!content.contextInfo.forwardedNewsletterMessageInfo) {
        content.contextInfo.isForwarded = true;
        content.contextInfo.forwardedNewsletterMessageInfo = {
            newsletterJid: "120363421377964290@newsletter",
            newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
            serverMessageId: 1,
        };
    }
    
    return content;
}

export function createPluginSendMessage(sock, commandName) {
    return async (jid, content, options = {}) => {
        const skipExternalAd = commandName === 'help' || commandName === 'menu';
        const enhancedContent = addExternalAdReply(content, skipExternalAd);
        return sock.sendMessage(jid, enhancedContent, options);
    };
}
