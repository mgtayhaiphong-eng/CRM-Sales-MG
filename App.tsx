import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Role, type User } from './types';
import { NotificationContext, useCrm } from './services/firebase';
import { GeminiService } from './services/geminiService';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  DoughnutController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip
} from 'chart.js';

// FIX: Register Chart.js components to prevent tree-shaking errors
Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  DoughnutController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip
);


// Import newly created component files
import { 
    MainLayoutSkeleton, 
    ViewSkeleton, 
    CustomerForm, 
    ConfirmationModal, 
    ScriptModal, 
    ReminderFormModal, 
    BulkActionBar,
    NotificationProvider,
    AuthProvider,
    BriefcaseIcon,
    LayoutDashboardIcon,
    BellIcon,
    KanbanSquareIcon,
    ListIcon,
    FileTextIcon,
    SettingsIcon,
    UserCircleIcon,
    LogOutIcon,
    MoonIcon,
    SunIcon,
    MenuIcon,
    SearchIcon,
    PlusIcon
} from './components/UIComponents';

// Lazy load views for code splitting and better performance
const LoginView = React.lazy(() => import('./views/LoginView'));
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const RemindersView = React.lazy(() => import('./views/RemindersView'));
const KanbanView = React.lazy(() => import('./views/KanbanView'));
const ListView = React.lazy(() => import('./views/ListView'));
const ReportsView = React.lazy(() => import('./views/ReportsView'));
const SettingsView = React.lazy(() => import('./views/SettingsView'));


const App: React.FC = () => (
    <AuthProvider>
        <NotificationProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><MainLayoutSkeleton /></div>}>
                <CrmApp />
            </Suspense>
        </NotificationProvider>
    </AuthProvider>
);

const CrmApp: React.FC = () => {
    const { currentUser } = useCrm();
    if (!currentUser) return <LoginView />;
    return <MainLayout />;
};

const MainLayout: React.FC = () => {
    const { currentUser, logout, addNotification, theme, toggleTheme, ...crm } = useCrm();
    
    const [activeView, setActiveView] = useState('dashboard');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, ids: [] as string[] });
    const [scriptModal, setScriptModal] = useState({ isOpen: false, script: '', isLoading: false });
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<any | null>(null);
    const [activeReminderCustomerId, setActiveReminderCustomerId] = useState<string | null>(null);

    // Reset selection and pagination on filter/view change
    useEffect(() => {
        crm.clearSelection();
        crm.resetPagination();
    }, [crm.searchTerm, activeView, crm.selectedUserId]);

    const handleGenerateScript = async (customer: any) => {
        if (!currentUser) return;
        setScriptModal({ isOpen: true, script: '', isLoading: true });
        try {
            const script = await GeminiService.generateScript(customer, currentUser.name);
            setScriptModal({ isOpen: true, script, isLoading: false });
        } catch (error) {
            console.error("Failed to generate script from UI:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setScriptModal({
                isOpen: true,
                script: `Đã xảy ra lỗi khi tạo kịch bản:\n${errorMessage}`,
                isLoading: false
            });
        }
    };

    const openAddCustomer = () => { setEditingCustomer(null); setShowCustomerForm(true); };
    const openEditCustomer = (customer: any) => { setEditingCustomer(customer); setShowCustomerForm(true); };
    const closeCustomerForm = () => { setShowCustomerForm(false); setEditingCustomer(null); };

    const openReminderModal = (customerId: string | null, reminder?: any) => {
        setActiveReminderCustomerId(customerId);
        setEditingReminder(reminder || null);
        setShowReminderForm(true);
    };
    const closeReminderModal = () => {
        setShowReminderForm(false);
        setEditingReminder(null);
        setActiveReminderCustomerId(null);
    };

    const renderView = () => {
        const commonProps = {
            addNotification,
            currentUser: currentUser!,
        };

        return (
            <Suspense fallback={<ViewSkeleton activeView={activeView} />}>
                {activeView === 'dashboard' && <DashboardView {...commonProps} customers={crm.dashboardCustomers} statuses={crm.crmData.statuses} reminders={crm.filteredReminders} onEditReminder={(rem) => openReminderModal(rem.customerId, rem)} onToggleComplete={crm.handleToggleReminderComplete} onDeleteReminder={crm.handleDeleteReminder} onOpenCustomer={openEditCustomer} theme={theme} />}
                {activeView === 'reminders' && <RemindersView {...commonProps} reminders={crm.filteredReminders} customers={crm.dashboardCustomers} onOpenReminderModal={openReminderModal} onToggleComplete={crm.handleToggleReminderComplete} onDelete={crm.handleDeleteReminder} />}
                {activeView === 'kanban' && <KanbanView {...commonProps} customers={crm.filteredCustomers} statuses={crm.crmData.statuses} reminders={crm.crmData.reminders} onCustomerEdit={openEditCustomer} onCustomerUpdate={crm.handleCustomerUpdate} onDelete={(ids) => setDeleteConfirm({isOpen: true, ids})} onAddInteraction={crm.handleAddInteraction} onDeleteInteraction={crm.handleDeleteInteraction} onGenerateScript={handleGenerateScript} onOpenReminderModal={(id) => openReminderModal(id)} users={crm.users} searchTerm={crm.searchTerm} selectedUserId={crm.selectedUserId} onSelectedUserChange={crm.setSelectedUserId} />}
                {activeView === 'list' && <ListView {...commonProps} customers={crm.paginatedCustomers} totalCustomers={crm.totalFilteredCustomers} statuses={crm.crmData.statuses} onCustomerEdit={openEditCustomer} onCustomerDelete={(ids) => setDeleteConfirm({isOpen: true, ids})} onGenerateScript={handleGenerateScript} onAddCustomer={openAddCustomer} users={crm.users} selectedUserId={crm.selectedUserId} onSelectedUserChange={crm.setSelectedUserId} searchTerm={crm.searchTerm} selectedCustomerIds={crm.selectedCustomerIds} onToggleSelectCustomer={crm.handleToggleSelectCustomer} onToggleSelectAll={crm.handleToggleSelectAll} sortConfig={crm.sortConfig} handleSort={crm.handleSort} pagination={crm.pagination} setPagination={crm.setPagination} />}
                {activeView === 'reports' && currentUser?.role === 'admin' && <ReportsView {...commonProps} crmData={crm.crmData} users={crm.users} theme={theme} />}
                {activeView === 'settings' && currentUser?.role === 'admin' && <SettingsView {...commonProps} users={crm.users} crmData={crm.crmData} setUsers={crm.setUsers} setCrmData={crm.setCrmData} />}
            </Suspense>
        );
    };
    
    const SidebarContent: React.FC<{isMobile: boolean}> = ({isMobile}) => {
        const navItems = useMemo(() => [
           { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboardIcon },
           { id: 'reminders', label: 'Nhắc hẹn', icon: BellIcon },
           { id: 'kanban', label: 'Pipeline', icon: KanbanSquareIcon },
           { id: 'list', label: 'Danh sách', icon: ListIcon },
           ...(currentUser?.role === 'admin' ? [
               { id: 'reports', label: 'Báo cáo', icon: FileTextIcon },
               { id: 'settings', label: 'Cài đặt', icon: SettingsIcon }
           ] : [])
       ], [currentUser?.role]);

       return (
           <div className="flex flex-col h-full bg-white dark:bg-gray-800">
               <div className="h-16 border-b dark:border-gray-700 flex items-center px-6 flex-shrink-0">
                   <BriefcaseIcon className="w-8 h-8 text-indigo-600"/>
                   <h1 className="text-xl font-bold ml-3 dark:text-white">CRM Sales MG</h1>
               </div>
               <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                   {navItems.map(item => (
                       <button key={item.id} onClick={() => { setActiveView(item.id); if(isMobile) setIsMobileNavOpen(false); }} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition ${activeView === item.id ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                           <item.icon className="w-5 h-5 mr-3"/>
                           {item.label}
                       </button>
                   ))}
               </nav>
               <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                   <div className="flex items-center mb-4">
                       <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500"/>
                       <div className="ml-3">
                           <p className="font-semibold text-sm dark:text-gray-200">{currentUser?.name}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role}</p>
                       </div>
                   </div>
                   <div className="flex items-center justify-between">
                       <button onClick={logout} className="flex-1 text-left flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                           <LogOutIcon className="w-5 h-5 mr-3"/>
                           Đăng xuất
                       </button>
                       <button onClick={toggleTheme} title="Chuyển đổi Giao diện" className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                           {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                       </button>
                   </div>
               </div>
           </div>
       );
   };

    if (crm.isLoading) {
        return <MainLayoutSkeleton />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden lg:block">
                <SidebarContent isMobile={false} />
            </aside>
            
            {/* Mobile Sidebar */}
            {isMobileNavOpen && (
                <div className="lg:hidden">
                    <div className="sidebar-mobile-overlay animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
                    <div className={`sidebar-mobile ${isMobileNavOpen ? 'open' : ''}`}>
                        <SidebarContent isMobile={true} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileNavOpen(true)} className="lg:hidden mr-4 p-2 text-gray-600 dark:text-gray-300">
                            <MenuIcon />
                        </button>
                        <div className="relative w-64 sm:w-96">
                            <input type="text" placeholder="Tìm kiếm khách hàng..." value={crm.searchTerm} onChange={e => crm.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500"/>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><SearchIcon/></div>
                        </div>
                    </div>
                    <div>
                        <button onClick={openAddCustomer} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center">
                        <PlusIcon className="w-4 h-4 mr-2" /> 
                        <span className="hidden sm:inline">Thêm KH</span>
                        <span className="sm:hidden">Thêm</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {activeView === 'list' && crm.selectedCustomerIds.size > 0 && (
                        <BulkActionBar 
                            selectedCount={crm.selectedCustomerIds.size}
                            statuses={crm.crmData.statuses}
                            users={crm.users}
                            currentUser={currentUser!}
                            onBulkUpdate={crm.handleBulkUpdate}
                            onBulkDelete={() => setDeleteConfirm({isOpen: true, ids: Array.from(crm.selectedCustomerIds)})}
                            onClearSelection={crm.clearSelection}
                        />
                    )}
                    {renderView()}
                </main>
                
                {/* Global Modals rendered here, inside the main div but outside <main> */}
                <>
                    <CustomerForm isOpen={showCustomerForm} onClose={closeCustomerForm} onSave={crm.handleSaveCustomer} customer={editingCustomer} statuses={crm.crmData.statuses} carModels={crm.crmData.carModels} customerSources={crm.crmData.customerSources} />
                    <ConfirmationModal 
                        isOpen={deleteConfirm.isOpen} 
                        title="Xác nhận xóa" 
                        message={`Bạn có chắc chắn muốn xóa ${deleteConfirm.ids.length} khách hàng này không? Mọi nhắc hẹn liên quan cũng sẽ bị xóa.`}
                        onConfirm={() => { crm.handleDelete(deleteConfirm.ids); setDeleteConfirm({ isOpen: false, ids: [] }); }} 
                        onCancel={() => setDeleteConfirm({ isOpen: false, ids: [] })} />
                    <ScriptModal isOpen={scriptModal.isOpen} isLoading={scriptModal.isLoading} script={scriptModal.script} onClose={() => setScriptModal({isOpen: false, script: '', isLoading: false})} addNotification={addNotification} />
                    <ReminderFormModal isOpen={showReminderForm} onClose={closeReminderModal} onSave={crm.handleSaveReminder} reminder={editingReminder} customerId={activeReminderCustomerId} customers={crm.crmData.customers} user={currentUser!} />
                </>
            </div>
        </div>
    );
};

export default App;