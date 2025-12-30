import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar'
import FloatingCoach from '@/components/FloatingCoach'
import CoachSidebar from '@/components/Coach/CoachSidebar'
import { TaskProvider } from '@/context/TaskContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daily 3 - High Leverage Tasks',
  description: 'Focus on what matters. Execute with high-leverage speed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} style={{ display: 'flex', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
        <TaskProvider>
          <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
             {/* Left Nav */}
             <Sidebar />
             
             {/* Center Content */}
             <main style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
               {children}
               <FloatingCoach />
             </main>

             {/* Right Intelligence Sidebar */}
             <aside style={{ width: '320px', height: '100vh', flexShrink: 0 }}>
                <CoachSidebar />
             </aside>
          </div>
        </TaskProvider>
      </body>
    </html>
  );
}
