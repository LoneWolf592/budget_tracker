import AIChatPanel from '../components/ai/AIChatPanel';

export default function AIChat() {
  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Powered by Claude · Sees your real transaction and budget data
        </p>
      </div>
      {/* AIChatPanel fills the remaining screen height */}
      <div className="flex-1 overflow-hidden bg-white">
        <AIChatPanel />
      </div>
    </div>
  );
}
