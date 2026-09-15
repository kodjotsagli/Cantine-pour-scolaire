import React, { useState, useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { NetworkBanner } from './components/layout/NetworkBanner';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { ClassesPage } from './pages/ClassesPage';
import { PointagePage } from './pages/PointagePage';
import { DepositsPage } from './pages/DepositsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PrintExportPage } from './pages/PrintExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentFormModal } from './components/students/StudentFormModal';
import { DepositFormModal } from './components/deposits/DepositFormModal';
import { PrintableDepositReceipt } from './components/print/PrintableDepositReceipt';
import { LoginModal } from './components/auth/LoginModal';
import { useAuth } from './hooks/useAuth';
import { initializeDatabaseIfEmpty } from './db/initialData';
import type { DepositReceiptData } from './services/depositService';

export function AppContent() {
  const { isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem | 'student-detail'>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Global modals
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositStudentId, setDepositStudentId] = useState<string | null>(null);

  // Receipt modal
  const [activeReceipt, setActiveReceipt] = useState<DepositReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    initializeDatabaseIfEmpty();
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setCurrentTab('student-detail');
  };

  const handleOpenDepositForStudent = (id: string) => {
    setDepositStudentId(id);
    setIsDepositModalOpen(true);
  };

  const handleDepositSuccess = (receipt: DepositReceiptData) => {
    setActiveReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab === 'student-detail' ? 'students' : currentTab}
        onSelectTab={(tab) => {
          setSelectedStudentId(null);
          setCurrentTab(tab);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <NetworkBanner />
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenNewStudentModal={() => setIsNewStudentModalOpen(true)}
                onOpenDepositModal={() => {
                  setDepositStudentId(null);
                  setIsDepositModalOpen(true);
                }}
              />
            )}

            {currentTab === 'students' && (
              <StudentsPage
                onSelectStudent={handleSelectStudent}
                onOpenDepositForStudent={handleOpenDepositForStudent}
              />
            )}

            {currentTab === 'student-detail' && selectedStudentId && (
              <StudentDetailPage
                studentId={selectedStudentId}
                onBack={() => setCurrentTab('students')}
                onOpenDepositForStudent={handleOpenDepositForStudent}
              />
            )}

            {currentTab === 'classes' && (
              <ClassesPage
                onSelectStudent={handleSelectStudent}
                onOpenDepositForStudent={handleOpenDepositForStudent}
              />
            )}

            {currentTab === 'pointage' && (
              <PointagePage
                onOpenDepositModalForStudent={handleOpenDepositForStudent}
              />
            )}

            {currentTab === 'deposits' && (
              <DepositsPage
                onOpenNewDepositModal={() => {
                  setDepositStudentId(null);
                  setIsDepositModalOpen(true);
                }}
              />
            )}

            {currentTab === 'reports' && <ReportsPage />}

            {currentTab === 'print-export' && <PrintExportPage />}

            {currentTab === 'settings' && <SettingsPage />}
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav
          currentTab={currentTab === 'student-detail' ? 'students' : currentTab}
          onSelectTab={(tab) => {
            setSelectedStudentId(null);
            setCurrentTab(tab);
          }}
        />
      </div>

      {/* Global Modals */}
      <StudentFormModal
        isOpen={isNewStudentModalOpen}
        onClose={() => setIsNewStudentModalOpen(false)}
        onSaved={() => {
          window.dispatchEvent(new Event('sync-queue-updated'));
        }}
      />

      <DepositFormModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        preselectedStudentId={depositStudentId}
        onDepositSuccess={handleDepositSuccess}
      />

      <PrintableDepositReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={activeReceipt}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onNavigateToSettings={() => {
          setIsLoginModalOpen(false);
          setCurrentTab('settings');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
