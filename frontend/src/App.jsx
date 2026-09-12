import { useEffect, useRef, useState } from "react";

const API = "https://tooth-korean-insider-disclose.trycloudflare.com";


const uiStyles = `
  :root {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #252525;
    background: #f6f5f2;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-width: 320px;
    background: #f6f5f2;
    color: #252525;
  }

  button, textarea, input { font: inherit; }

  button { -webkit-tap-highlight-color: transparent; }

  .app-shell {
    min-height: 100vh;
    background: #f6f5f2;
  }

  .topbar {
    height: 68px;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,.96);
    border-bottom: 1px solid #e9e5df;
    position: relative;
    z-index: 20;
    backdrop-filter: blur(12px);
  }

  .brand-area, .assistant-info, .security-item-left, .sidebar-title-row,
  .permission-header, .audit-header {
    display: flex;
    align-items: center;
  }

  .brand-area { gap: 11px; }

  .brand-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    background: #f07c32;
    color: white;
    font-size: 19px;
    box-shadow: 0 3px 10px rgba(240,124,50,.18);
  }

  .brand-name {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -.01em;
  }

  .brand-subtitle {
    margin-top: 2px;
    color: #8b8883;
    font-size: 11px;
  }

  .topbar-status {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #5e5b56;
    font-size: 12px;
    font-weight: 600;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #43a66a;
    box-shadow: 0 0 0 3px rgba(67,166,106,.10);
  }

  .status-dot.small {
    width: 6px;
    height: 6px;
    box-shadow: none;
  }

  .main-layout {
    width: min(1420px, calc(100% - 48px));
    height: calc(100vh - 116px);
    min-height: 620px;
    margin: 24px auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 20px;
    align-items: stretch;
  }

  .chat-panel, .sidebar-card, .principle-card {
    background: #fff;
    border: 1px solid #e7e2db;
    box-shadow: 0 8px 28px rgba(53,47,40,.045);
  }

  .chat-panel {
    height: 100%;
    min-height: 0;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header {
    min-height: 76px;
    padding: 17px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #eeeae4;
  }

  .assistant-info { gap: 11px; }

  .assistant-avatar {
    width: 37px;
    height: 37px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #fff3ea;
    border: 1px solid #f6d7c1;
    color: #df6926;
    font-size: 17px;
  }

  .assistant-info h1 {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    letter-spacing: -.015em;
  }

  .assistant-status {
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #7d7973;
    font-size: 11px;
  }

  .local-chip {
    padding: 7px 10px;
    border: 1px solid #ebe5de;
    border-radius: 8px;
    color: #6d6963;
    background: #faf9f7;
    font-size: 11px;
    font-weight: 600;
  }

  .chat-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 28px 30px 12px;
  }

  .empty-state {
    max-width: 650px;
    margin: 0 auto;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 28px 0 18px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 18px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #fff3ea;
    border: 1px solid #f5d9c6;
    color: #e27330;
    font-size: 22px;
  }

  .empty-state h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: -.035em;
    color: #252525;
  }

  .empty-state p {
    max-width: 580px;
    margin: 12px auto 0;
    color: #77736d;
    font-size: 14px;
    line-height: 1.65;
  }

  .suggestion-grid {
    margin-top: 26px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .suggestion-card {
    min-height: 72px;
    padding: 13px 14px;
    border: 1px solid #e9e4dd;
    border-radius: 10px;
    background: #fff;
    color: #55514c;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: border-color .15s ease, background .15s ease, transform .15s ease;
  }

  .suggestion-card:hover {
    border-color: #e8b48f;
    background: #fffaf6;
    transform: translateY(-1px);
  }

  .suggestion-arrow {
    color: #e27330;
    font-size: 15px;
    align-self: flex-end;
  }

  .suggestion-card span:last-child {
    font-size: 12px;
    line-height: 1.45;
  }

  .messages-list {
    max-width: 820px;
    margin: 0 auto;
  }

  .message-row {
    display: flex;
    gap: 11px;
    margin-bottom: 24px;
  }

  .message-avatar {
    width: 31px;
    height: 31px;
    flex: 0 0 31px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
  }

  .user-avatar {
    background: #f0eeea;
    color: #68645e;
  }

  .ai-avatar {
    background: #fff1e8;
    border: 1px solid #f3d5c0;
    color: #dc6b29;
  }

  .message-wrapper { min-width: 0; flex: 1; }

  .message-meta {
    min-height: 18px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 6px;
  }

  .message-author {
    color: #34312d;
    font-size: 12px;
    font-weight: 700;
  }

  .message-label {
    padding: 3px 6px;
    border-radius: 5px;
    background: #f6f4f1;
    color: #858079;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .055em;
  }

  .error-label {
    background: #fff0ee;
    color: #b45145;
  }

  .message-bubble {
    width: fit-content;
    max-width: min(760px, 100%);
    padding: 12px 14px;
    border-radius: 11px;
    font-size: 14px;
    line-height: 1.65;
  }

  .user-bubble {
    background: #f4f1ed;
    color: #3d3934;
  }

  .assistant-bubble {
    background: #fff;
    border: 1px solid #eee9e2;
    color: #3f3b36;
  }

  .formatted-response { white-space: normal; }

  .response-line { min-height: 1.45em; }
  .response-spacer { height: 7px; }

  .response-list-item {
    display: flex;
    gap: 9px;
    margin: 4px 0;
  }

  .response-bullet, .response-number {
    color: #e27330;
    flex: 0 0 auto;
    font-weight: 700;
  }

  .typing-bubble {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 15px 17px;
  }

  .typing-bubble span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #b5b0aa;
    animation: typing 1.1s infinite ease-in-out;
  }

  .typing-bubble span:nth-child(2) { animation-delay: .15s; }
  .typing-bubble span:nth-child(3) { animation-delay: .3s; }

  @keyframes typing {
    0%, 60%, 100% { opacity: .35; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-2px); }
  }

  .permission-card {
    max-width: 820px;
    margin: 12px auto 4px;
    padding: 18px;
    border: 1px solid #ead8c9;
    border-radius: 11px;
    background: #fffaf6;
  }

  .permission-header { gap: 11px; }

  .permission-icon {
    width: 31px;
    height: 31px;
    flex: 0 0 31px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #f8e7d9;
    color: #bd612a;
    font-weight: 800;
  }

  .permission-header h3 {
    margin: 0;
    font-size: 13px;
    color: #413b35;
  }

  .permission-header p {
    margin: 4px 0 0;
    color: #80766e;
    font-size: 11px;
  }

  .permission-details {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .permission-detail {
    padding: 10px 11px;
    border: 1px solid #eee3da;
    border-radius: 8px;
    background: #fff;
  }

  .detail-label, .block-label {
    display: block;
    margin-bottom: 4px;
    color: #918982;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .detail-value {
    color: #4c4640;
    font-size: 12px;
  }

  .permission-note {
    margin-top: 11px;
    display: flex;
    gap: 8px;
    color: #7c746d;
    font-size: 10px;
    line-height: 1.5;
  }

  .permission-actions {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .deny-button, .share-button {
    border-radius: 7px;
    padding: 8px 13px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .deny-button {
    border: 1px solid #e5dfd8;
    background: #fff;
    color: #625d57;
  }

  .share-button {
    border: 1px solid #dc6f2e;
    background: #e8732e;
    color: #fff;
  }

  .deny-button:disabled, .share-button:disabled { opacity: .55; cursor: not-allowed; }

  .composer-area {
    padding: 14px 22px 17px;
    border-top: 1px solid #eeeae4;
    background: #fff;
  }

  .composer-box {
    min-height: 52px;
    padding: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #ddd8d1;
    border-radius: 11px;
    background: #fff;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .composer-box:focus-within {
    border-color: #e7b18b;
    box-shadow: 0 0 0 3px rgba(232,115,46,.08);
  }

  .composer-box textarea {
    flex: 1;
    min-width: 0;
    resize: none;
    border: 0;
    outline: 0;
    background: transparent;
    color: #33302c;
    padding: 10px 7px;
    line-height: 1.45;
    font-size: 13px;
  }

  .composer-box textarea::placeholder { color: #aaa49e; }

  .composer-box button:not(.send-button) {
    border: 1px solid #e7e1da !important;
    background: #faf9f7 !important;
    color: #6e6962 !important;
    border-radius: 8px !important;
  }

  .composer-box button:not(.send-button):hover:not(:disabled) {
    border-color: #e2b08e !important;
    background: #fff8f3 !important;
    color: #d76d2b !important;
  }

  .composer-box .send-button {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border: 0;
    border-radius: 8px;
    background: #e8732e;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: background .15s ease, transform .15s ease;
  }

  .composer-box .send-button:hover:not(:disabled) {
    background: #d96624;
    transform: translateY(-1px);
  }

  .composer-box .send-button:disabled { opacity: .38; cursor: not-allowed; }

  .composer-hint {
    min-height: 16px;
    margin: 7px 3px 0;
    color: #9a958e;
    font-size: 10px;
  }

  .sidebar {
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: #d7d2cc transparent;
  }

  .sidebar::-webkit-scrollbar { width: 6px; }
  .sidebar::-webkit-scrollbar-track { background: transparent; }
  .sidebar::-webkit-scrollbar-thumb {
    background: #d7d2cc;
    border-radius: 999px;
  }

  .sidebar-card, .principle-card {
    border-radius: 12px;
    padding: 17px;
  }

  .sidebar-title-row { justify-content: space-between; }

  .sidebar-eyebrow {
    color: #a09a93;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .1em;
  }

  .sidebar-card h2 {
    margin: 4px 0 14px;
    color: #302d29;
    font-size: 14px;
    letter-spacing: -.01em;
  }

  .shield-icon {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border: 1px solid #e9e4dd;
    border-radius: 8px;
    color: #df702d;
    background: #fff9f5;
    font-size: 13px;
  }

  .security-list {
    border-top: 1px solid #f0ece7;
  }

  .security-item {
    padding: 12px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px solid #f0ece7;
  }

  .security-item-left { gap: 9px; min-width: 0; }

  .security-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 7px;
    border-radius: 50%;
    background: #d2cec8;
  }

  .security-dot.active { background: #48a66c; }
  .security-dot.controlled { background: #e48a4f; }

  .security-item strong {
    display: block;
    color: #46413b;
    font-size: 11px;
    font-weight: 700;
  }

  .security-item-left span:not(.security-dot) {
    display: block;
    margin-top: 3px;
    color: #99938c;
    font-size: 9px;
  }

  .security-value {
    max-width: 100px;
    color: #77716a;
    font-size: 8px;
    font-weight: 800;
    text-align: right;
    letter-spacing: .05em;
  }

  .disclosure-level {
    padding: 10px 11px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #eee9e3;
    border-radius: 8px;
    background: #faf9f7;
    font-size: 10px;
    color: #8b857e;
  }

  .disclosure-level strong {
    color: #d56c2a;
    font-size: 9px;
    letter-spacing: .05em;
  }

  .disclosure-block {
    margin-top: 10px;
    padding: 10px 11px;
    border: 1px solid #eee9e3;
    border-radius: 8px;
  }

  .private-value {
    color: #4f4a44;
    font-size: 11px;
    font-weight: 600;
  }

  .value-warning { color: #b85e2b; }

  .cloud-payload {
    color: #716b64;
    font-size: 10px;
    line-height: 1.5;
  }

  .request-flow { margin-top: 4px; }

  .flow-step {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .flow-number {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    background: #f7f4f0;
    color: #8b857e;
    font-size: 8px;
    font-weight: 800;
  }

  .flow-step strong {
    display: block;
    color: #514c46;
    font-size: 10px;
  }

  .flow-step span:not(.flow-number) {
    display: block;
    margin-top: 2px;
    color: #9b958e;
    font-size: 9px;
  }

  .flow-line {
    width: 1px;
    height: 13px;
    margin: 3px 0 3px 13px;
    background: #e5e0da;
  }

  .audit-header { justify-content: space-between; }

  .refresh-button {
    width: 28px;
    height: 28px;
    border: 1px solid #e9e4de;
    border-radius: 7px;
    background: #fff;
    color: #77716a;
    cursor: pointer;
  }

  .refresh-button:hover {
    border-color: #e1b18e;
    color: #d96e2b;
  }

  .audit-empty {
    padding: 15px 4px 4px;
    text-align: center;
  }

  .audit-empty-icon {
    color: #b3ada6;
    font-size: 20px;
  }

  .audit-empty span {
    display: block;
    margin-top: 5px;
    color: #7f7972;
    font-size: 10px;
    font-weight: 600;
  }

  .audit-empty small {
    display: block;
    margin-top: 3px;
    color: #aaa49d;
    font-size: 9px;
    line-height: 1.45;
  }

  .audit-list {
    max-height: 230px;
    overflow: auto;
  }

  .audit-item {
    display: flex;
    gap: 8px;
    padding: 9px 0;
    border-top: 1px solid #f1ede8;
  }

  .audit-marker {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    display: grid;
    place-items: center;
    border-radius: 5px;
    background: #f4f2ef;
    color: #77716a;
    font-size: 9px;
    font-weight: 800;
  }

  .audit-warning { background: #fff2e9; color: #bd672e; }
  .audit-security { background: #edf7f0; color: #4d9467; }

  .audit-content { min-width: 0; flex: 1; }

  .audit-topline {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .audit-event {
    color: #5b554e;
    font-size: 9px;
    font-weight: 700;
  }

  .audit-time {
    color: #aaa49d;
    font-size: 8px;
    white-space: nowrap;
  }

  .audit-details {
    margin-top: 3px;
    color: #969089;
    font-size: 8px;
    line-height: 1.4;
  }

  .mini-flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    color: #77716a;
    font-size: 9px;
    line-height: 1.5;
  }

  .mini-flow > span:not(.mini-arrow) {
    padding: 4px 6px;
    border-radius: 5px;
    background: #f7f5f2;
  }

  .mini-arrow { color: #b2aca5; }

  .principle-card {
    background: #2f2d2a;
    border-color: #2f2d2a;
    color: #fff;
    padding: 19px;
  }

  .quote-mark {
    color: #e98545;
    font-size: 25px;
    line-height: 1;
  }

  .principle-card p {
    margin: 5px 0 14px;
    color: #f2efeb;
    font-size: 12px;
    line-height: 1.55;
  }

  .principle-card > span {
    color: #aaa49e;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .1em;
  }

  /* Attachment chip overrides the previous inline dark-theme values. */
  .composer-area > div:first-child > div {
    border-color: #e6ded5 !important;
    background: #faf7f3 !important;
    color: #6d655e !important;
  }

  .composer-area > div:first-child button {
    color: #9b6d4d !important;
  }

  @media (max-width: 1080px) {
    .main-layout {
      grid-template-columns: 1fr;
    }

    .sidebar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .principle-card {
      grid-column: span 2;
    }

    .chat-panel {
      min-height: 680px;
    }
  }

  @media (max-width: 700px) {
    .topbar {
      padding: 0 16px;
      height: 60px;
    }

    .brand-subtitle, .topbar-status span:last-child { display: none; }

    .main-layout {
      width: 100%;
      height: calc(100vh - 60px);
      min-height: 0;
      margin: 0;
      gap: 0;
    }

    .chat-panel {
      height: 100%;
      min-height: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .chat-header {
      padding: 13px 16px;
    }

    .local-chip { display: none; }

    .chat-content {
      padding: 22px 16px 10px;
    }

    .empty-state {
      min-height: auto;
      margin-top: 8vh;
      padding: 0 0 18px;
    }

    .empty-state h2 { font-size: 23px; }

    .suggestion-grid {
      grid-template-columns: 1fr;
    }

    .messages-list { max-width: none; }

    .message-bubble {
      max-width: 100%;
      font-size: 13px;
    }

    .permission-details {
      grid-template-columns: 1fr;
    }

    .composer-area {
      padding: 11px 12px 13px;
    }

    .sidebar {
      display: none;
    }
  }
`;


/*
 * PrivateAI Gateway
 * Frontend for the local privacy gateway + local Ollama/Gemma assistant.
 *
 * Important:
 * - The browser talks only to the local FastAPI gateway.
 * - The browser never talks directly to Ollama.
 * - Permission decisions are handled by the gateway.
 */

/*
 * Lightweight Markdown renderer
 * Supports the formatting Gemma commonly returns:
 * - **bold**
 * - bullet/numbered lines
 * - line breaks
 *
 * No external package is required.
 */
const renderInlineMarkdown = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length >= 4
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

const renderMessageText = (text) => {
  const lines = String(text ?? "").split(/\r?\n/);

  return (
    <div className="formatted-response">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div className="response-spacer" key={index} />;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
        const numberedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);

        if (bulletMatch) {
          return (
            <div className="response-list-item" key={index}>
              <span className="response-bullet">•</span>
              <span>{renderInlineMarkdown(bulletMatch[1])}</span>
            </div>
          );
        }

        if (numberedMatch) {
          return (
            <div className="response-list-item" key={index}>
              <span className="response-number">
                {trimmed.match(/^\d+/)[0]}.
              </span>
              <span>{renderInlineMarkdown(numberedMatch[1])}</span>
            </div>
          );
        }

        return (
          <div className="response-line" key={index}>
            {renderInlineMarkdown(trimmed)}
          </div>
        );
      })}
    </div>
  );
};

function App() {
  useEffect(() => {
    const styleId = "privateai-clean-ui";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = uiStyles;
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [privacyStatus, setPrivacyStatus] = useState({
    gateway: "ACTIVE",
    memory: "LOCAL ONLY",
    disclosure: "CONTROLLED",
  });

  const [permissionRequest, setPermissionRequest] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");

  const [disclosureInfo, setDisclosureInfo] = useState({
    level: "—",
    exactValue: false,
    cloudData: "No request processed yet.",
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [sending, setSending] = useState(false);

  // =====================================================
  // ATTACHMENTS
  // =====================================================

  const [attachmentContext, setAttachmentContext] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const attachmentInputRef = useRef(null);

  // =====================================================
  // ATTACHMENT INPUT
  // =====================================================

  const handleAttachmentClick = () => {
    if (sending || voiceLoading || isRecording || attachmentLoading) return;
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];

    // Reset the input so selecting the same file again still triggers change.
    event.target.value = "";

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "docx", "txt"];

    if (!allowed.includes(extension)) {
      setAttachmentError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError("File is too large. Maximum size is 10 MB.");
      return;
    }

    setAttachmentLoading(true);
    setAttachmentError("");
    setAttachmentContext(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await fetchJson(`${API}/attachment/analyze`, {
        method: "POST",
        body: formData,
      });

      if (String(data.status).toLowerCase() !== "success") {
        throw new Error(
          data.message || "The local gateway could not analyze the attachment."
        );
      }

      const protectedAttachment = {
        filename: data.filename || file.name,
        file_type: data.file_type || extension.toUpperCase(),
        text_length: Number(data.text_length || 0),
        safe_text: String(data.safe_text || ""),
        detected_data: Array.isArray(data.detected_data)
          ? data.detected_data
          : [],
        privacy_status: data.privacy_status || "Sensitive data protected locally",
      };

      if (!protectedAttachment.safe_text) {
        throw new Error("The gateway extracted no usable protected text from this file.");
      }

      setAttachmentContext(protectedAttachment);
      setPrivacyStatus((prev) => ({
        ...prev,
        gateway: "ACTIVE",
        memory: "LOCAL PROTECTED",
        disclosure: "CONTROLLED",
      }));

      await loadAuditLogs();
    } catch (error) {
      console.error("Attachment error:", error);
      setAttachmentError(
        error?.message || "The local gateway could not process the attachment."
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentContext(null);
    setAttachmentError("");
  };

  // =====================================================
  // VOICE INPUT
  // =====================================================

  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // =====================================================
  // SAFE API HELPER
  // =====================================================

  /*
   * The previous frontend used response.json() directly.
   * If the backend/proxy ever returns an empty or non-JSON response,
   * that throws before we can show a useful error.
   *
   * This helper gives us a controlled error instead.
   */
  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);

    const contentType =
      response.headers.get("content-type") || "";

    let data = null;
    let rawText = "";

    try {
      rawText = await response.text();

      if (rawText) {
        if (contentType.includes("application/json")) {
          data = JSON.parse(rawText);
        } else {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }
        }
      }
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail =
        data?.detail ||
        data?.message ||
        rawText ||
        `HTTP ${response.status}`;

      throw new Error(String(detail));
    }

    if (!data || typeof data !== "object") {
      throw new Error(
        "The local gateway returned an invalid response."
      );
    }

    return data;
  };

  // =====================================================
  // AUDIT LOG
  // =====================================================

  const loadAuditLogs = async () => {
    try {
      const data = await fetchJson(`${API}/audit/log`);
      setAuditLogs(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error("Audit log error:", error);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // =====================================================
  // ADD MESSAGE
  // =====================================================

  const addMessage = (role, text, meta = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text: String(text ?? ""),
        ...meta,
      },
    ]);
  };

  // =====================================================
  // APPLY CHAT RESPONSE
  // =====================================================

  const applyChatResponse = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Empty or invalid response from gateway.");
    }

    /*
     * Some backend versions may use status="error" while still
     * returning HTTP 200. Handle that explicitly instead of
     * treating it as a successful chat response.
     */
    if (
      data.status &&
      String(data.status).toLowerCase() === "error"
    ) {
      throw new Error(
        data.message ||
          data.detail ||
          "The local gateway could not process the request."
      );
    }

    // -----------------------------------------------------
    // PERMISSION REQUIRED
    // -----------------------------------------------------

    if (data.permission_required === true) {
      setPermissionRequest(data);

      setPrivacyStatus((prev) => ({
        ...prev,
        gateway: "ACTIVE",
        memory: "LOCAL PROTECTED",
        disclosure: "PERMISSION REQUIRED",
      }));

      setDisclosureInfo({
        level: "PERMISSION REQUIRED",
        exactValue: false,
        cloudData:
          "Exact private information is blocked until you approve.",
      });

      addMessage(
        "assistant",
        "The exact private information is protected locally. I need your permission before it can be disclosed for this request.",
        {
          label: "PERMISSION REQUIRED",
          secure: true,
        }
      );

      return "permission";
    }

    const level = String(
      data.disclosure_level || "protected"
    ).toLowerCase();

    const route = String(data.route || "").toUpperCase();

    let disclosureLabel = "PROTECTED";

    if (level === "minimum") {
      disclosureLabel = "MINIMUM NECESSARY";
    } else if (level === "local-only" || route === "LOCAL_AI") {
      disclosureLabel = "LOCAL AI";
    } else if (level === "protected") {
      disclosureLabel = "PROTECTED";
    } else {
      disclosureLabel = level.toUpperCase();
    }

    setPrivacyStatus((prev) => ({
      ...prev,
      gateway: "ACTIVE",
      memory:
        route === "LOCAL" || route === "LOCAL_AI"
          ? "LOCAL PROTECTED"
          : "LOCAL ONLY",
      disclosure:
        level === "minimum"
          ? "MINIMUM NECESSARY"
          : level === "local-only"
          ? "LOCAL ONLY"
          : level === "protected"
          ? "PROTECTED"
          : level.toUpperCase(),
    }));

    setDisclosureInfo({
      level: level.toUpperCase(),
      exactValue: Boolean(data.exact_value_exposed),
      cloudData:
        data.cloud_data ||
        (data.exact_value_exposed
          ? "Exact private value approved for this request only."
          : level === "minimum"
          ? "Minimum necessary derived context only."
          : "No exact private value was exposed."),
    });

    /*
     * The backend is responsible for sanitizing internal tokens
     * such as SALARY_1 before returning a response.
     *
     * We still normalize the value here so a malformed backend
     * response cannot crash the React UI.
     */
    if (data.response !== undefined && data.response !== null) {
      const assistantResponse = String(data.response).trim();

      if (assistantResponse) {
        addMessage("assistant", assistantResponse, {
          label: disclosureLabel,
          secure: true,
        });
      }
    }

    return "success";
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    const typedText = message.trim();

    if ((!typedText && !attachmentContext) || sending || attachmentLoading) {
      return;
    }

    const text = typedText || "Please summarize the attached document.";
    const currentAttachment = attachmentContext;

    // Only the privacy-protected attachment text is sent to /chat.
    // The original file and exact sensitive values remain local to the gateway.
    const requestText = currentAttachment
      ? `${text}\n\n[ATTACHED DOCUMENT: ${currentAttachment.filename}]\n${currentAttachment.safe_text}\n[END ATTACHED DOCUMENT]`
      : text;

    setSending(true);
    setMessage("");
    addMessage("user", typedText || `Summarize ${currentAttachment.filename}`, {
      attachment: currentAttachment
        ? {
            filename: currentAttachment.filename,
            fileType: currentAttachment.file_type,
            detectedCount: currentAttachment.detected_data?.length || 0,
          }
        : null,
    });

    try {
      const data = await fetchJson(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text: requestText,
        }),
      });

      // Save the original request only when the gateway asks
      // for permission. This is useful for the permission card.
      if (data.permission_required === true) {
        setPendingQuery(text);
      } else {
        setPendingQuery("");
      }

      applyChatResponse(data);

      if (currentAttachment) {
        setAttachmentContext(null);
      }

      await loadAuditLogs();
    } catch (error) {
      console.error("Gateway error:", error);

      const errorMessage =
        error?.message ||
        "Unknown local gateway error.";

      addMessage(
        "assistant",
        `The local AI gateway encountered an unexpected error. ${errorMessage}`,
        {
          label: "GATEWAY ERROR",
          error: true,
        }
      );
    } finally {
      setSending(false);
      await loadAuditLogs();
    }
  };

  // =====================================================
  // PERMISSION HANDLER
  // =====================================================

  const handlePermission = async (decision) => {
    if (permissionLoading) {
      return;
    }

    setPermissionLoading(true);

    try {
      const data = await fetchJson(`${API}/permission/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          decision,
        }),
      });

      // -------------------------------------------------
      // DENIED
      // -------------------------------------------------

      if (!data.approved) {
        setPrivacyStatus((prev) => ({
          ...prev,
          disclosure: "DENIED",
        }));

        setDisclosureInfo({
          level: "DENIED",
          exactValue: false,
          cloudData:
            "Private information was not disclosed.",
        });

        addMessage(
          "assistant",
          "Access denied. Your private information remains inside the local gateway and was not shared.",
          {
            label: "ACCESS DENIED",
            secure: true,
          }
        );

        setPermissionRequest(null);
        setPendingQuery("");

        await loadAuditLogs();
        return;
      }

      // -------------------------------------------------
      // APPROVED
      // -------------------------------------------------

      setPrivacyStatus((prev) => ({
        ...prev,
        gateway: "ACTIVE",
        memory: "LOCAL PROTECTED",
        disclosure: "ONE-TIME APPROVED",
      }));

      setDisclosureInfo({
        level: "ONE-TIME",
        exactValue: Boolean(
          data.exact_value_exposed ?? data.shared_value
        ),
        cloudData:
          `${data.data_type || "Private data"} approved for this request only.`,
      });

      setPermissionRequest(null);

      /*
       * Newer backend versions may return a final AI response
       * instead of shared_value. Prefer that response.
       *
       * Older prototype versions may return shared_value.
       * We support both so the UI remains compatible.
       */

      if (data.response) {
        addMessage(
          "assistant",
          String(data.response),
          {
            label: "ONE-TIME ACCESS",
            secure: true,
          }
        );
      } else if (data.shared_value) {
        const dataType = String(
          data.data_type || "private information"
        ).toLowerCase();

        if (dataType === "salary") {
          const numericSalary = Number(data.shared_value);

          const salaryText = Number.isFinite(numericSalary)
            ? `₹${numericSalary.toLocaleString("en-IN")}`
            : String(data.shared_value);

          addMessage(
            "assistant",
            `Sure. With your one-time permission, your monthly salary is ${salaryText}. The value was used only for this approved request.`,
            {
              label: "ONE-TIME ACCESS",
              secure: true,
            }
          );
        } else if (dataType === "phone") {
          addMessage(
            "assistant",
            `Sure. With your one-time permission, your phone number is ${String(
              data.shared_value
            )}. The value was used only for this approved request.`,
            {
              label: "ONE-TIME ACCESS",
              secure: true,
            }
          );
        } else if (dataType === "email") {
          addMessage(
            "assistant",
            `Sure. With your one-time permission, your email is ${String(
              data.shared_value
            )}. The value was used only for this approved request.`,
            {
              label: "ONE-TIME ACCESS",
              secure: true,
            }
          );
        } else {
          addMessage(
            "assistant",
            `Permission approved for this request only. The requested ${dataType} was disclosed through the controlled one-time access flow.`,
            {
              label: "ONE-TIME ACCESS",
              secure: true,
            }
          );
        }
      } else {
        addMessage(
          "assistant",
          "Permission approved for this request only. The gateway has authorized one-time disclosure of the requested private information.",
          {
            label: "ONE-TIME ACCESS",
            secure: true,
          }
        );
      }

      setPendingQuery("");
      await loadAuditLogs();
    } catch (error) {
      console.error("Permission error:", error);

      addMessage(
        "assistant",
        `Unable to process the permission decision. ${
          error?.message || "Please check that the backend is running."
        }`,
        {
          label: "GATEWAY ERROR",
          error: true,
        }
      );
    } finally {
      setPermissionLoading(false);
      await loadAuditLogs();
    }
  };

  // =====================================================
  // VOICE INPUT
  // =====================================================

  const startVoiceRecording = async () => {
    if (isRecording || voiceLoading || sending) return;

    setVoiceError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Microphone recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "";
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of supportedTypes) {
        if (window.MediaRecorder?.isTypeSupported?.(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setVoiceError("The browser could not record the microphone audio.");
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const actualType = recorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualType,
        });

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (!audioBlob.size) {
          setVoiceError("No audio was captured. Please try again.");
          return;
        }

        await processVoiceAudio(audioBlob, actualType);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);

      if (error?.name === "NotAllowedError") {
        setVoiceError(
          "Microphone permission was denied. Allow microphone access and try again."
        );
      } else {
        setVoiceError(error?.message || "Unable to access the microphone.");
      }

      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);
    recorder.stop();
  };

  const processVoiceAudio = async (audioBlob, mimeType) => {
    setVoiceLoading(true);
    setVoiceError("");

    try {
      const extension = mimeType.includes("mp4")
        ? "m4a"
        : mimeType.includes("ogg")
        ? "ogg"
        : "webm";

      const audioFile = new File([audioBlob], `voice-input.${extension}`, {
        type: mimeType,
      });

      const formData = new FormData();
      formData.append("file", audioFile);

      // Audio is sent only to the local Whisper endpoint.
      const transcription = await fetchJson(`${API}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      const transcript = String(transcription?.transcript || "").trim();

      if (!transcript) {
        throw new Error(
          "Whisper did not detect any speech. Please try speaking clearly."
        );
      }

      // The transcript enters the SAME /chat privacy pipeline as text.
      // PII detection, memory, policy, permission, and disclosure control
      // therefore remain active for voice input.
      addMessage("user", transcript, {
        voice: true,
        language: transcription?.language || "",
      });

      setSending(true);

      const data = await fetchJson(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text: transcript }),
      });

      if (data.permission_required === true) {
        setPendingQuery(transcript);
      } else {
        setPendingQuery("");
      }

      applyChatResponse(data);
      await loadAuditLogs();
    } catch (error) {
      console.error("Voice processing error:", error);

      const errorMessage =
        error?.message ||
        "The local voice pipeline could not process the recording.";

      setVoiceError(errorMessage);

      addMessage(
        "assistant",
        `The local voice pipeline encountered an error. ${errorMessage}`,
        {
          label: "VOICE ERROR",
          error: true,
        }
      );
    } finally {
      setSending(false);
      setVoiceLoading(false);
      await loadAuditLogs();
    }
  };

  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // =====================================================
  // SUGGESTIONS
  // =====================================================

  const suggestions = [
    "What is my phone number?",
    "My salary is 75000",
    "How does my salary compare with the industry average?",
  ];

  // =====================================================
  // AUDIT HELPERS
  // =====================================================

  const getSeverityClass = (severity) => {
    if (severity === "WARNING") {
      return "audit-warning";
    }

    if (severity === "SECURITY") {
      return "audit-security";
    }

    return "audit-info";
  };

  const getAuditIcon = (severity) => {
    if (severity === "WARNING") {
      return "!";
    }

    if (severity === "SECURITY") {
      return "✓";
    }

    return "•";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-area">
          <div className="brand-icon">
            <span>⌁</span>
          </div>

          <div>
            <div className="brand-name">
              PrivateAI Gateway
            </div>

            <div className="brand-subtitle">
              Privacy-first AI control plane
            </div>
          </div>
        </div>

        <div className="topbar-status">
          <span className="status-dot"></span>
          <span>Gateway Protected</span>
        </div>
      </header>

      <main className="main-layout">
        {/* =================================================
            CHAT PANEL
        ================================================= */}

        <section className="chat-panel">
          <div className="chat-header">
            <div className="assistant-info">
              <div className="assistant-avatar">✦</div>

              <div>
                <h1>AI Assistant</h1>

                <div className="assistant-status">
                  <span className="status-dot small"></span>
                  Local gateway active
                </div>
              </div>
            </div>

            <div className="local-chip">
              <span>⌂</span>
              Local Processing
            </div>
          </div>

          <div className="chat-content">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✦</div>

                <h2>
                  Private AI, under your control.
                </h2>

                <p>
                  Ask anything. Your local gateway
                  decides what stays private, what can
                  be processed locally, and what context
                  may be disclosed.
                </p>

                <div className="suggestion-grid">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-card"
                      onClick={() => setMessage(suggestion)}
                    >
                      <span className="suggestion-arrow">
                        →
                      </span>

                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={`message-row ${
                      item.role === "user"
                        ? "user-row"
                        : "assistant-row"
                    }`}
                  >
                    <div
                      className={`message-avatar ${
                        item.role === "user"
                          ? "user-avatar"
                          : "ai-avatar"
                      }`}
                    >
                      {item.role === "user" ? "U" : "✦"}
                    </div>

                    <div className="message-wrapper">
                      <div className="message-meta">
                        <span className="message-author">
                          {item.role === "user"
                            ? "You"
                            : "PrivateAI"}
                        </span>

                        {item.voice && (
                          <span className="message-label">
                            🎙 VOICE · {item.language || "AUTO"}
                          </span>
                        )}

                        {item.attachment && (
                          <span className="message-label">
                            📎 {item.attachment.fileType} · LOCAL PROTECTED
                          </span>
                        )}

                        {item.label && (
                          <span
                            className={`message-label ${
                              item.error
                                ? "error-label"
                                : ""
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>

                      <div
                        className={`message-bubble ${
                          item.role === "user"
                            ? "user-bubble"
                            : "assistant-bubble"
                        }`}
                      >
                        {renderMessageText(item.text)}
                      </div>
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="message-row assistant-row">
                    <div className="message-avatar ai-avatar">
                      ✦
                    </div>

                    <div className="message-wrapper">
                      <div className="message-meta">
                        <span className="message-author">
                          PrivateAI
                        </span>

                        <span className="message-label">
                          PROCESSING
                        </span>
                      </div>

                      <div className="message-bubble assistant-bubble typing-bubble">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                PERMISSION CARD
            ================================================= */}

            {permissionRequest && (
              <div className="permission-card">
                <div className="permission-header">
                  <div className="permission-icon">
                    !
                  </div>

                  <div>
                    <h3>Permission Required</h3>

                    <p>
                      The cloud model is requesting
                      access to private information.
                    </p>
                  </div>
                </div>

                <div className="permission-details">
                  <div className="permission-detail">
                    <span className="detail-label">
                      Information
                    </span>

                    <span className="detail-value">
                      {permissionRequest.data_type ||
                        "Private information"}
                    </span>
                  </div>

                  <div className="permission-detail">
                    <span className="detail-label">
                      Purpose
                    </span>

                    <span className="detail-value">
                      {permissionRequest.purpose ||
                        pendingQuery ||
                        "Current request"}
                    </span>
                  </div>
                </div>

                <div className="permission-note">
                  <span>🔒</span>

                  <span>
                    Your information is stored locally.
                    Sharing is limited to this request only.
                  </span>
                </div>

                <div className="permission-actions">
                  <button
                    className="deny-button"
                    disabled={permissionLoading}
                    onClick={() =>
                      handlePermission("DENY")
                    }
                  >
                    Deny
                  </button>

                  <button
                    className="share-button"
                    disabled={permissionLoading}
                    onClick={() =>
                      handlePermission("SHARE_ONCE")
                    }
                  >
                    {permissionLoading
                      ? "Processing..."
                      : "Share Once"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              COMPOSER
          ================================================= */}

          <div className="composer-area">
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleAttachmentChange}
              style={{ display: "none" }}
            />

            {(attachmentContext || attachmentLoading || attachmentError) && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {attachmentContext && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "8px 11px",
                      borderRadius: 12,
                      border: "1px solid rgba(74, 222, 128, 0.22)",
                      background: "rgba(74, 222, 128, 0.07)",
                      color: "#d1fae5",
                      fontSize: 12,
                    }}
                  >
                    <span>📎</span>
                    <strong>{attachmentContext.filename}</strong>
                    <span style={{ opacity: 0.72 }}>
                      {attachmentContext.file_type} · protected locally
                    </span>
                    {attachmentContext.detected_data.length > 0 && (
                      <span style={{ opacity: 0.72 }}>
                        · {attachmentContext.detected_data.length} sensitive item(s) protected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={removeAttachment}
                      disabled={sending}
                      aria-label="Remove attachment"
                      title="Remove attachment"
                      style={{
                        border: 0,
                        background: "transparent",
                        color: "#a7f3d0",
                        cursor: sending ? "not-allowed" : "pointer",
                        fontSize: 16,
                        padding: "0 2px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {attachmentLoading && (
                  <span style={{ fontSize: 12, color: "#a7f3d0" }}>
                    🔐 Scanning attachment locally...
                  </span>
                )}

                {attachmentError && (
                  <span style={{ fontSize: 12, color: "#fca5a5" }}>
                    {attachmentError}
                  </span>
                )}
              </div>
            )}

            <div className="composer-box">
              <button
                type="button"
                onClick={handleAttachmentClick}
                disabled={sending || isRecording || voiceLoading || attachmentLoading}
                aria-label="Attach PDF, DOCX, or TXT file"
                title="Attach PDF, DOCX, or TXT"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e5e7eb",
                  cursor:
                    sending || isRecording || voiceLoading || attachmentLoading
                      ? "not-allowed"
                      : "pointer",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  transition: "all 160ms ease",
                }}
              >
                📎
              </button>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? "Listening... click the microphone to stop"
                    : voiceLoading
                    ? "Transcribing locally..."
                    : "Ask the private assistant..."
                }
                rows={1}
                disabled={sending || isRecording || voiceLoading || attachmentLoading}
              />

              <button
                type="button"
                onClick={
                  isRecording ? stopVoiceRecording : startVoiceRecording
                }
                disabled={sending || voiceLoading}
                aria-label={
                  isRecording
                    ? "Stop voice recording"
                    : "Start voice recording"
                }
                title={isRecording ? "Stop recording" : "Speak to PrivateAI"}
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  borderRadius: 12,
                  border: isRecording
                    ? "1px solid rgba(248, 113, 113, 0.55)"
                    : "1px solid rgba(255, 255, 255, 0.10)",
                  background: isRecording
                    ? "rgba(239, 68, 68, 0.16)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: isRecording ? "#fca5a5" : "#e5e7eb",
                  cursor:
                    sending || voiceLoading ? "not-allowed" : "pointer",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  boxShadow: isRecording
                    ? "0 0 0 4px rgba(239, 68, 68, 0.08)"
                    : "none",
                  transition: "all 160ms ease",
                }}
              >
                {voiceLoading ? "…" : isRecording ? "■" : "🎙"}
              </button>

              <button
                className="send-button"
                onClick={sendMessage}
                disabled={
                  (!message.trim() && !attachmentContext) ||
                  sending ||
                  isRecording ||
                  voiceLoading ||
                  attachmentLoading
                }
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            <div className="composer-hint">
              {voiceError ? (
                <span style={{ color: "#fca5a5" }}>{voiceError}</span>
              ) : isRecording ? (
                "Recording locally · click the microphone to stop"
              ) : voiceLoading ? (
                "Whisper is transcribing on the local gateway..."
              ) : attachmentLoading ? (
                "Attachment is being extracted and privacy-scanned locally..."
              ) : attachmentContext ? (
                "Attachment protected locally · ask a question or press Enter to summarize"
              ) : (
                "Enter to send · Shift + Enter for new line · 📎 Attach · 🎙 Speak"
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="sidebar">
          {/* =================================================
              PRIVACY CENTER
          ================================================= */}

          <div className="sidebar-card">
            <div className="sidebar-title-row">
              <div>
                <div className="sidebar-eyebrow">
                  SECURITY
                </div>

                <h2>Privacy Center</h2>
              </div>

              <div className="shield-icon">◈</div>
            </div>

            <div className="security-list">
              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-dot active"></span>

                  <div>
                    <strong>
                      Local Privacy Gateway
                    </strong>

                    <span>
                      Requests inspected locally
                    </span>
                  </div>
                </div>

                <span className="security-value">
                  {privacyStatus.gateway}
                </span>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-dot active"></span>

                  <div>
                    <strong>Private Memory</strong>

                    <span>
                      Never directly exposed
                    </span>
                  </div>
                </div>

                <span className="security-value">
                  {privacyStatus.memory}
                </span>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-dot controlled"></span>

                  <div>
                    <strong>Cloud Disclosure</strong>

                    <span>Policy controlled</span>
                  </div>
                </div>

                <span className="security-value">
                  {privacyStatus.disclosure}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              DISCLOSURE CONTROL
          ================================================= */}

          <div className="sidebar-card">
            <div className="sidebar-eyebrow">
              DISCLOSURE CONTROL
            </div>

            <h2>Current Disclosure</h2>

            <div className="disclosure-level">
              <span>Disclosure level</span>

              <strong>{disclosureInfo.level}</strong>
            </div>

            <div className="disclosure-block">
              <span className="block-label">
                Exact private value
              </span>

              <div
                className={`private-value ${
                  disclosureInfo.exactValue
                    ? "value-warning"
                    : ""
                }`}
              >
                {disclosureInfo.exactValue
                  ? "Permission controlled"
                  : "Not exposed"}
              </div>
            </div>

            <div className="disclosure-block">
              <span className="block-label">
                Cloud payload
              </span>

              <div className="cloud-payload">
                {disclosureInfo.cloudData}
              </div>
            </div>
          </div>

          {/* =================================================
              GATEWAY DECISION
          ================================================= */}

          <div className="sidebar-card">
            <div className="sidebar-eyebrow">
              CURRENT REQUEST
            </div>

            <h2>Gateway Decision</h2>

            <div className="request-flow">
              <div className="flow-step">
                <div className="flow-number">01</div>

                <div>
                  <strong>Inspect</strong>

                  <span>
                    Detect sensitive data
                  </span>
                </div>
              </div>

              <div className="flow-line"></div>

              <div className="flow-step">
                <div className="flow-number">02</div>

                <div>
                  <strong>Decide</strong>

                  <span>
                    Local or cloud route
                  </span>
                </div>
              </div>

              <div className="flow-line"></div>

              <div className="flow-step">
                <div className="flow-number">03</div>

                <div>
                  <strong>Disclose</strong>

                  <span>
                    Minimum necessary context
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              AUDIT LOG
          ================================================= */}

          <div className="sidebar-card audit-card">
            <div className="audit-header">
              <div>
                <div className="sidebar-eyebrow">
                  SECURITY ACTIVITY
                </div>

                <h2>Audit Log</h2>
              </div>

              <button
                className="refresh-button"
                onClick={loadAuditLogs}
                title="Refresh audit log"
              >
                ↻
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="audit-empty">
                <div className="audit-empty-icon">
                  ◌
                </div>

                <span>
                  No security events yet.
                </span>

                <small>
                  Activity will appear here as
                  requests are processed.
                </small>
              </div>
            ) : (
              <div className="audit-list">
                {auditLogs.slice(0, 10).map(
                  (log, index) => (
                    <div
                      className="audit-item"
                      key={`${log.time}-${index}`}
                    >
                      <div
                        className={`audit-marker ${getSeverityClass(
                          log.severity
                        )}`}
                      >
                        {getAuditIcon(log.severity)}
                      </div>

                      <div className="audit-content">
                        <div className="audit-topline">
                          <span className="audit-event">
                            {log.event}
                          </span>

                          <span className="audit-time">
                            {log.time}
                          </span>
                        </div>

                        {log.details && (
                          <div className="audit-details">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* =================================================
              PRIVACY FLOW
          ================================================= */}

          <div className="sidebar-card flow-card">
            <div className="sidebar-eyebrow">
              PRIVACY FLOW
            </div>

            <h2>How your data moves</h2>

            <div className="mini-flow">
              <span>User</span>

              <span className="mini-arrow">→</span>

              <span>Local Gateway</span>

              <span className="mini-arrow">→</span>

              <span>Policy Engine</span>

              <span className="mini-arrow">→</span>

              <span>Approved Context</span>
            </div>
          </div>

          {/* =================================================
              PRIVACY PRINCIPLE
          ================================================= */}

          <div className="principle-card">
            <div className="quote-mark">“</div>

            <p>
              The model doesn't own your memory.
              It only gets permissioned access to it.
            </p>

            <span>PRIVATEAI PRINCIPLE</span>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
