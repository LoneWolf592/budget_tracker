import { type ReactNode } from 'react';
import Sidebar from './Sidebar';

// AppLayout wraps every protected page with the sidebar.
// Usage in App.tsx: <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content area — takes up the remaining space */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
