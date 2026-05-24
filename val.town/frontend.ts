export function getFrontendHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIHive Command Center</title>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18",
      "react-dom/client": "https://esm.sh/react-dom@18/client",
      "react-dom": "https://esm.sh/react-dom@18",
      "lucide-react": "https://esm.sh/lucide-react@0.263.1"
    }
  }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #13131a; }
    ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #2a2a3e; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pulse-dot { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .typing-dot { animation: typing 1.4s infinite; display: inline-block; width: 7px; height: 7px; background: #6366f1; border-radius: 50%; margin: 0 2px; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .toast { animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards; }
    @keyframes toastIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
    .modal-overlay { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-card { animation: slideUp 0.25s ease; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .chat-panel { animation: chatSlideIn 0.3s ease; }
    @keyframes chatSlideIn { from { transform: translateY(20px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    input, textarea, select { outline: none; }
    input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .tab-active { border-bottom: 2px solid #6366f1; color: #e2e8f0; }
    .tab-inactive { border-bottom: 2px solid transparent; color: #64748b; }
    .tab-inactive:hover { color: #94a3b8; border-bottom-color: #2a2a3e; }
    .nav-active { background: rgba(99,102,241,0.15); color: #e2e8f0; border-right: 2px solid #6366f1; }
    .nav-inactive { color: #64748b; }
    .nav-inactive:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
    .toggle-on { background: #6366f1; }
    .toggle-off { background: #1e1e2e; }
    pre { white-space: pre-wrap; word-break: break-all; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #1e1e2e; font-size: 13px; }
    th { color: #64748b; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { color: #e2e8f0; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    th:hover { color: #e2e8f0; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/api/app-js"></script>
</body>
</html>`;
}
