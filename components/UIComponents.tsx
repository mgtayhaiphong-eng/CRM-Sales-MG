import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback } from 'react';
import { Chart } from 'chart.js';
import { Role, type User, type Customer, type Status, type CarModel, type CustomerSource, type Interaction, type Reminder, type CrmData, type MarketingSpend } from '../types';
import { VIETNAM_CITIES, CUSTOMER_TIERS } from '../constants';
import { useCrmDataManager, CrmContext, NotificationContext } from '../services/firebase';

// START: ICONS
export const Icon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
export const BriefcaseIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></Icon>;
export const LayoutDashboardIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></Icon>;
export const KanbanSquareIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M6 5h12"/><path d="M6 12h12"/><path d="M6 19h12"/></Icon>;
export const ListIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></Icon>;
export const SettingsIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0 .73 2.73l-.22.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Icon>;
export const LogOutIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></Icon>;
export const PlusIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></Icon>;
export const GripVerticalIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></Icon>;
export const SearchIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>;
export const XIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>;
export const PhoneIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
export const MailIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Icon>;
export const CarIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M14 16.94V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h12v2.94M12 4l4 4H8Z"/><path d="M12 4v4H4"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></Icon>;
export const LayersIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
export const MapPinIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>;
export const DollarSignIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;
export const ClockIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
export const Edit2Icon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Icon>;
export const Trash2Icon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>;
export const SparklesIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></Icon>;
export const AlertTriangleIcon = ({ className = "w-12 h-12" }) => <Icon className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></Icon>;
export const SaveIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Icon>;
export const UsersIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
export const TrendingUpIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Icon>;
export const TargetIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>;
export const DatabaseIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></Icon>;
export const ChevronUpIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="m18 15-6-6-6 6"/></Icon>;
export const ChevronDownIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="m6 9 6 6 6-6"/></Icon>;
export const RefreshCwIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></Icon>;
export const UserCircleIcon = ({ className = "w-8 h-8" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="4"/><path d="M12 16c-2.5 0-4.7.9-6.3 2.4"/></Icon>;
export const FileTextIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></Icon>;
export const DownloadIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></Icon>;
export const BellIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>;
export const CheckCircleIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>;
export const MenuIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></Icon>;
export const FolderPlusIcon = ({ className = "w-12 h-12" }) => <Icon className={className}><path d="M20 12h-8"/><path d="M16 16V8"/><path d="M2 17.6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-2h4l2 2h4a2 2 0 0 1 2 2v2.4"/></Icon>;
export const BotIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></Icon>;
export const ChevronsUpDownIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></Icon>;
export const SunIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></Icon>;
export const MoonIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></Icon>;
// END: ICONS


// START: HELPER FUNCTIONS
export const formatCurrency = (amount: number | string) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};
export const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleDateString('vi-VN') : '---';
export const formatDateTime = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '---';
// END: HELPER FUNCTIONS


// START: REUSABLE UI COMPONENTS
export const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-8 h-full w-full">
        <div className="flex flex-col items-center">
            <RefreshCwIcon className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400 mt-2">Đang tải dữ liệu...</span>
        </div>
    </div>
);

interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, maxWidth = 'max-w-lg' }) => {
    if (!isOpen) return null;
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-start pt-8 sm:pt-16 p-4 animate-fade-in" onClick={handleBackdropClick}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${maxWidth} transform transition-all duration-300`}>
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} maxWidth="max-w-sm">
        <div className="text-center p-4">
            <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="px-6 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Hủy bỏ</button>
                <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">Xác nhận</button>
            </div>
        </div>
    </Modal>
);

interface ScriptModalProps {
    isOpen: boolean;
    isLoading: boolean;
    script: string;
    onClose: () => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
}
export const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, isLoading, script, onClose, addNotification }) => {
    const copyToClipboard = () => {
        if (!script) return;
        navigator.clipboard.writeText(script).then(() => {
            addNotification('Đã sao chép kịch bản!', 'success');
        }, () => {
            addNotification('Sao chép thất bại!', 'error');
        });
    };

    return (
        <Modal isOpen={isOpen} title="Kịch bản Chăm sóc AI" onClose={onClose} maxWidth="max-w-xl">
            <div className="space-y-4 min-h-[250px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                        <SparklesIcon className="w-10 h-10 animate-pulse text-indigo-500" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">AI đang phân tích và tạo kịch bản...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg whitespace-pre-wrap text-gray-800 dark:text-gray-200 border dark:border-gray-600 min-h-[150px]">{script}</div>
                        <div className="mt-4 flex justify-end items-center space-x-3">
                            <button onClick={copyToClipboard} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Sao chép</button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export const EmptyState: React.FC<{
    icon: React.ReactNode;
    title: string;
    message: string;
    action?: React.ReactNode;
}> = ({ icon, title, message, action }) => (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg border-2 border-dashed dark:border-gray-700">
        <div className="text-gray-400 dark:text-gray-500 mx-auto mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
        <p className="mb-4">{message}</p>
        {action}
    </div>
);

interface NotificationToastProps {
    notifications: {id: number, message: string, type: 'success' | 'error'}[]
}
export const NotificationToasts: React.FC<NotificationToastProps> = ({ notifications }) => (
    <div className="fixed top-5 right-5 z-[100] space-y-3">
        {notifications.map(n => (
            <div key={n.id} className={`toast flex items-center p-4 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {n.type === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <AlertTriangleIcon className="w-6 h-6 mr-3" />}
                <span>{n.message}</span>
            </div>
        ))}
    </div>
);
// END: REUSABLE UI COMPONENTS


// START: SKELETON COMPONENTS
const SkeletonBox: React.FC<{className?: string}> = ({ className }) => <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className} skeleton-pulse`}></div>;

export const MainLayoutSkeleton: React.FC = () => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <aside className="w-64 flex-shrink-0 hidden lg:block bg-white dark:bg-gray-800 p-4">
            <SkeletonBox className="h-8 w-3/4 mb-8" />
            <div className="space-y-3">
                <SkeletonBox className="h-10 w-full" />
                <SkeletonBox className="h-10 w-full opacity-90" />
                <SkeletonBox className="h-10 w-full opacity-80" />
                <SkeletonBox className="h-10 w-full opacity-70" />
            </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
                <SkeletonBox className="h-8 w-1/2" />
                <SkeletonBox className="h-10 w-24" />
            </header>
            <main className="flex-1 overflow-y-auto p-6">
                 <SkeletonBox className="h-8 w-1/4 mb-6" />
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <SkeletonBox className="h-24" />
                     <SkeletonBox className="h-24" />
                     <SkeletonBox className="h-24" />
                     <SkeletonBox className="h-24" />
                 </div>
                 <SkeletonBox className="h-80 mt-6" />
            </main>
        </div>
    </div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        <SkeletonBox className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonBox className="h-24" />
            <SkeletonBox className="h-24" />
            <SkeletonBox className="h-24" />
            <SkeletonBox className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonBox className="lg:col-span-2 h-80" />
            <SkeletonBox className="h-80" />
        </div>
        <SkeletonBox className="h-48" />
    </div>
);

const KanbanSkeleton: React.FC = () => (
    <div>
        <SkeletonBox className="h-8 w-1/4 mb-4" />
        <div className="kanban-container overflow-x-auto pb-6">
            <div className="flex space-x-4 min-w-max">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="kanban-column flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        <SkeletonBox className="h-6 w-3/4 mb-4" />
                        <div className="space-y-3">
                            <SkeletonBox className="h-32" />
                            <SkeletonBox className="h-40" />
                            <SkeletonBox className="h-28" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ListViewSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <SkeletonBox className="h-8 w-1/3 mb-4" />
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr>
                        {[...Array(6)].map((_, i) => (
                            <th key={i} className="px-6 py-3"><SkeletonBox className="h-5 w-full" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                             {[...Array(6)].map((_, j) => (
                                <td key={j} className="px-6 py-4"><SkeletonBox className="h-5 w-full" /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const GenericViewSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
            <SkeletonBox className="h-8 w-1/3" />
            <SkeletonBox className="h-10 w-24" />
        </div>
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonBox key={i} className="h-16 w-full" />)}
        </div>
    </div>
);

export const ViewSkeleton: React.FC<{ activeView: string }> = ({ activeView }) => {
    switch (activeView) {
        case 'dashboard':
            return <DashboardSkeleton />;
        case 'kanban':
            return <KanbanSkeleton />;
        case 'list':
            return <ListViewSkeleton />;
        case 'reminders':
        case 'reports':
        case 'settings':
            return <GenericViewSkeleton />;
        default:
            return <div className="p-6"><SkeletonBox className="h-96" /></div>;
    }
};
// END: SKELETON COMPONENTS


// START: CRM COMPONENTS
interface InteractionHistoryProps {
    customer: Customer;
    onAddInteraction: (interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (interactionId: string) => void;
    users: User[];
    currentUser: User | null;
    addNotification: (message: string, type: 'success' | 'error') => void;
}
export const InteractionHistory: React.FC<InteractionHistoryProps> = ({ customer, onAddInteraction, onDeleteInteraction, users, currentUser, addNotification }) => {
    const [newInteraction, setNewInteraction] = useState({ type: 'call', notes: '', duration: 0, outcome: 'neutral' });
    const [isAdding, setIsAdding] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const { interactions } = customer;

    const interactionTypes = [
        { value: 'call', label: '📞 Cuộc gọi', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        { value: 'email', label: '✉️ Email', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        { value: 'meeting', label: '🤝 Gặp mặt', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
        { value: 'test_drive', label: '🚗 Lái thử', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
        { value: 'quotation', label: '💰 Báo giá', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' },
        { value: 'other', label: '📝 Khác', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
    ];

    const getInteractionPlaceholder = (type: string): string => {
        switch(type) {
            case 'test_drive': return "Ghi lại phản hồi của khách hàng sau khi lái thử, các điểm họ thích/không thích, lộ trình đã đi...";
            case 'quotation': return "Ghi chú về báo giá đã gửi, các hạng mục, chương trình khuyến mãi đi kèm...";
            case 'meeting': return "Tóm tắt nội dung cuộc gặp, các cam kết hoặc các bước tiếp theo...";
            default: return "Mô tả nội dung tương tác, phản hồi của khách hàng...";
        }
    };

    const handleAddInteraction = () => {
        if (!newInteraction.notes.trim()) { 
            addNotification('Vui lòng nhập nội dung tương tác', 'error');
            return; 
        }
        if (!currentUser) return;
        
        onAddInteraction({
            type: newInteraction.type as Interaction['type'],
            date: Date.now(),
            notes: newInteraction.notes,
            duration: newInteraction.duration || 0,
            outcome: newInteraction.outcome as Interaction['outcome'],
            userId: currentUser.id
        });
        setNewInteraction({ type: 'call', notes: '', duration: 0, outcome: 'neutral' });
        setIsAdding(false);
    };

    const handleGenerateScript = async () => {
        // This needs to be passed down or imported
        alert("GeminiService not connected in this component yet");
    };
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Lịch sử Tương tác ({interactions.length})</h4>
                <button onClick={() => setIsAdding(!isAdding)} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" /> Thêm
                </button>
            </div>

            {isAdding && (
                <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50/70 dark:bg-gray-700/30 animate-fade-in-right space-y-3">
                    <textarea 
                        placeholder={getInteractionPlaceholder(newInteraction.type)} 
                        value={newInteraction.notes} 
                        onChange={(e) => setNewInteraction(p => ({ ...p, notes: e.target.value }))} 
                        rows={4} 
                        className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" 
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Loại</label>
                            <select value={newInteraction.type} onChange={(e) => setNewInteraction(p => ({ ...p, type: e.target.value }))} className="p-2 border dark:border-gray-600 rounded-lg w-full mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                {interactionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Kết quả</label>
                            <select value={newInteraction.outcome} onChange={(e) => setNewInteraction(p => ({ ...p, outcome: e.target.value as Interaction['outcome'] }))} className="p-2 border dark:border-gray-600 rounded-lg w-full mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                <option value="positive">✅ Tích cực</option>
                                <option value="neutral">⚪ Trung lập</option>
                                <option value="negative">❌ Tiêu cực</option>
                            </select>
                        </div>
                    </div>

                    {['call', 'meeting', 'test_drive'].includes(newInteraction.type) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thời lượng (phút)</label>
                            <input 
                                type="number"
                                value={newInteraction.duration}
                                onChange={(e) => setNewInteraction(p => ({ ...p, duration: parseInt(e.target.value, 10) || 0 }))}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                min="0"
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={handleGenerateScript}
                            disabled={isGeneratingScript}
                            className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                        >
                            {isGeneratingScript ? (
                                <><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                            ) : (
                                <><SparklesIcon className="w-4 h-4 mr-2" /> Gợi ý AI</>
                            )}
                        </button>
                        <div className="flex space-x-2">
                             <button onClick={() => setIsAdding(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Hủy</button>
                             <button onClick={handleAddInteraction} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center">
                                 <SaveIcon className="w-4 h-4 mr-2" /> Lưu
                             </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {interactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-2">📝</div>
                        <p>Chưa có tương tác</p>
                    </div>
                ) : (
                    [...interactions].sort((a, b) => b.date - a.date).map(interaction => {
                        const typeConfig = interactionTypes.find(t => t.value === interaction.type);
                        const outcomeIcons = { positive: '✅', neutral: '⚪', negative: '❌' };
                        return (
                            <div key={interaction.id} className="p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${typeConfig?.color}`}>{typeConfig?.label}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(interaction.date)}</span>
                                    </div>
                                    <button aria-label="Xóa tương tác" onClick={() => onDeleteInteraction(interaction.id)} className="text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-lg mt-0.5">{outcomeIcons[interaction.outcome]}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800 dark:text-gray-300">{interaction.notes}</p>
                                        <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            <span>bởi: {getUserName(interaction.userId)}</span>
                                            {interaction.duration > 0 && (
                                                 <span className="ml-3 flex items-center"><ClockIcon className="w-3 h-3 mr-1"/> {interaction.duration} phút</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const Highlight: React.FC<{ text: string | undefined; highlight: string }> = ({ text, highlight }) => {
    const safeText = text || '';
    if (!highlight.trim()) {
        return <>{safeText}</>;
    }
    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = safeText.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-400 dark:text-black p-0 rounded-sm">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

interface CustomerCardProps {
    customer: Customer;
    statuses: Status[];
    reminders: Reminder[];
    onCustomerEdit: (customer: Customer) => void;
    onDelete: (customerIds: string[]) => void;
    onStatusChange: (customerId: string, newStatusId: string) => void;
    onAddInteraction: (customerId: string, interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (customerId: string, interactionId: string) => void;
    onGenerateScript: (customer: Customer) => void;
    onOpenReminderModal: (customerId: string) => void;
    users: User[];
    searchTerm?: string;
    currentUser: User | null;
    addNotification: (message: string, type: 'success' | 'error') => void;
}
export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, statuses, reminders, onCustomerEdit, onDelete, onStatusChange, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users, searchTerm = '', currentUser, addNotification }) => {
    const [showDetails, setShowDetails] = useState(false);
    const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
    const activeReminder = useMemo(() => reminders.find(r => r.customerId === customer.id && !r.completed), [reminders, customer.id]);
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md dark:hover:shadow-indigo-900/30 transition-all duration-200 hover:scale-[1.02]">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate pr-2 min-w-0 text-gray-900 dark:text-gray-100"><Highlight text={customer.name} highlight={searchTerm} /></h3>
                     <div className="flex items-center space-x-2 flex-shrink-0">
                         {activeReminder && <div className="text-yellow-500" title={`Nhắc hẹn: ${formatDate(activeReminder.dueDate)}`}><BellIcon className="w-4 h-4"/></div>}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tierConfig?.color} border border-current`}>{tierConfig?.value}</span>
                    </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4"><PhoneIcon className="w-4 h-4 mr-2" /><Highlight text={customer.phone} highlight={searchTerm} /></div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center"><CarIcon className="w-4 h-4 mr-2" /><span><Highlight text={customer.carModel} highlight={searchTerm} /></span></div>
                    <div className="flex items-center"><LayersIcon className="w-4 h-4 mr-2" /><span><Highlight text={customer.source} highlight={searchTerm} /></span></div>
                </div>
                <select value={customer.statusId} onChange={(e) => onStatusChange(customer.id, e.target.value)} className="w-full p-2 border dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                    {statuses.sort((a, b) => a.order - b.order).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                </select>
            </div>
            <div className="px-4 pb-4 flex justify-center">
                <button onClick={() => setShowDetails(!showDetails)} className="flex items-center px-4 py-1.5 text-sm rounded-full border dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-sm">
                    <span>{showDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
                    {showDetails ? <ChevronUpIcon className="w-4 h-4 ml-2 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />}
                </button>
            </div>

            {showDetails && (
                 <div className="border-t dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/50 animate-fade-in-right">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700 dark:text-gray-300 mb-4 pb-4 border-b dark:border-gray-700">
                        <div className="flex items-start col-span-1 sm:col-span-2"><MailIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span>{customer.email || 'Chưa có'}</span></div>
                        <div className="flex items-start"><MapPinIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span>{customer.city || 'Chưa có'}</span></div>
                        <div className="flex items-start"><DollarSignIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span>{formatCurrency(customer.salesValue)}</span></div>
                        <div className="flex items-start"><ClockIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span className="whitespace-nowrap">Tạo: {formatDate(customer.createdDate)}</span></div>
                        <div className="flex items-start"><ClockIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span className="whitespace-nowrap">LH cuối: {formatDate(customer.lastContactDate)}</span></div>
                        {(currentUser?.role === Role.ADMIN || customer.userId) && (
                             <div className="flex items-start col-span-1 sm:col-span-2"><UserCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <span>NV Phụ trách: {customer.userId ? getUserName(customer.userId) : 'Chưa phân công'}</span></div>
                        )}
                        {customer.notes && <div className="col-span-1 sm:col-span-2 flex items-start"><FileTextIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.notes}</p></div>}
                    </div>
                    <InteractionHistory
                        customer={customer}
                        onAddInteraction={(interaction) => onAddInteraction(customer.id, interaction)}
                        onDeleteInteraction={(interactionId) => onDeleteInteraction(customer.id, interactionId)}
                        users={users}
                        currentUser={currentUser}
                        addNotification={addNotification}
                    />
                </div>
            )}
            
            <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end items-center space-x-2">
                <button aria-label="Đặt lịch hẹn" onClick={() => onOpenReminderModal(customer.id)} className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded-full transition-colors" title="Đặt lịch hẹn"><BellIcon className="w-5 h-5"/></button>
                <button aria-label="Tạo kịch bản chăm sóc AI" onClick={() => onGenerateScript(customer)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors" title="Tạo kịch bản chăm sóc AI"><SparklesIcon className="w-5 h-5"/></button>
                <button aria-label="Chỉnh sửa khách hàng" onClick={() => onCustomerEdit(customer)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Chỉnh sửa"><Edit2Icon className="w-5 h-5"/></button>
                <button aria-label="Xóa khách hàng" onClick={() => onDelete([customer.id])} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customerData: Omit<Customer, 'id' | 'userId' | 'createdDate' | 'lastContactDate' | 'interactions'>, existingCustomerId?: string) => void;
    customer?: Customer | null;
    statuses: Status[];
    carModels: CarModel[];
    customerSources: CustomerSource[];
}
export const CustomerForm: React.FC<CustomerFormProps> = ({ isOpen, onClose, onSave, customer, statuses, carModels, customerSources }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', carModel: '', source: '', statusId: '', city: '', notes: '', salesValue: 0, tier: 'COLD' as Customer['tier']});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setFormData({
                    name: customer.name || '', phone: customer.phone || '', email: customer.email || '',
                    carModel: customer.carModel || '', source: customer.source || '', statusId: customer.statusId || (statuses[0]?.id || ''),
                    city: customer.city || '', notes: customer.notes || '', salesValue: customer.salesValue || 0, tier: customer.tier || 'COLD'
                });
            } else {
                 setFormData({ name: '', phone: '', email: '', carModel: '', source: '', statusId: statuses.find(s=>s.order === 1)?.id || statuses[0]?.id || '', city: '', notes: '', salesValue: 0, tier: 'COLD' });
            }
            setErrors({});
        }
    }, [customer, isOpen, statuses]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên';
        if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập SĐT';
        else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'SĐT không hợp lệ';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSave({ ...formData, salesValue: Number(formData.salesValue) || 0 }, customer?.id);
        onClose();
    };

    const handleChange = (field: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const inputClasses = "w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500";
    const errorInputClasses = "border-red-500 dark:border-red-500";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <Modal isOpen={isOpen} title={customer ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Tên *</label>
                        <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`${inputClasses} ${errors.name ? errorInputClasses : 'border-gray-300'}`} />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                     <div>
                        <label className={labelClasses}>SĐT *</label>
                        <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`${inputClasses} ${errors.phone ? errorInputClasses : 'border-gray-300'}`} />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Email</label>
                        <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`${inputClasses} ${errors.email ? errorInputClasses : 'border-gray-300'}`} />
                         {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                     <div>
                        <label className={labelClasses}>Thành phố</label>
                         <select value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className={`${inputClasses} border-gray-300`}>
                             <option value="">Chọn TP</option>
                            {VIETNAM_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                         </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Dòng xe</label>
                        <select value={formData.carModel} onChange={(e) => handleChange('carModel', e.target.value)} className={`${inputClasses} border-gray-300`}>
                             <option value="">Chọn xe</option>
                             {carModels.map(model => <option key={model.id} value={model.name}>{model.name}</option>)}
                         </select>
                    </div>
                     <div>
                        <label className={labelClasses}>Nguồn</label>
                         <select value={formData.source} onChange={(e) => handleChange('source', e.target.value)} className={`${inputClasses} border-gray-300`}>
                             <option value="">Chọn nguồn</option>
                             {customerSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                         </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Trạng thái</label>
                        <select value={formData.statusId} onChange={(e) => handleChange('statusId', e.target.value)} className={`${inputClasses} border-gray-300`}>
                             {statuses.sort((a,b) => a.order - b.order).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                         </select>
                    </div>
                     <div>
                        <label className={labelClasses}>Phân loại</label>
                         <select value={formData.tier} onChange={(e) => handleChange('tier', e.target.value as Customer['tier'])} className={`${inputClasses} border-gray-300`}>
                              {CUSTOMER_TIERS.map(tier => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
                         </select>
                    </div>
                </div>
                 <div>
                    <label className={labelClasses}>Giá trị (VNĐ)</label>
                    <input type="number" value={formData.salesValue} onChange={(e) => handleChange('salesValue', e.target.value)} className={`${inputClasses} border-gray-300`} min="0" />
                </div>
                 <div>
                    <label className={labelClasses}>Ghi chú</label>
                    <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} className={`${inputClasses} border-gray-300`} />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" /> {customer ? 'Cập nhật' : 'Lưu'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface BulkActionBarProps {
    selectedCount: number;
    statuses: Status[];
    users: User[];
    currentUser: User;
    onBulkUpdate: (updates: Partial<Customer>) => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}
export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, statuses, users, currentUser, onBulkUpdate, onBulkDelete, onClearSelection }) => {
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const statusId = e.target.value;
        if (statusId) {
            onBulkUpdate({ statusId });
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        if (userId) {
            onBulkUpdate({ userId });
        }
    };

    return (
        <div className="bg-indigo-600 text-white p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 animate-fade-in">
            <div className="flex items-center">
                <span className="font-semibold">{selectedCount} khách hàng được chọn</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <select onChange={handleStatusChange} defaultValue="" className="bg-indigo-500 text-white rounded-md px-3 py-1.5 text-sm hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white">
                    <option value="" disabled>-- Chuyển Trạng thái --</option>
                    {statuses.sort((a,b) => a.order - b.order).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                {currentUser.role === Role.ADMIN && (
                     <select onChange={handleUserChange} defaultValue="" className="bg-indigo-500 text-white rounded-md px-3 py-1.5 text-sm hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white">
                        <option value="" disabled>-- Giao cho NV --</option>
                        {users.filter(u => u.role === Role.USER).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                )}

                <button onClick={onBulkDelete} className="flex items-center bg-red-500 text-white rounded-md px-3 py-1.5 text-sm hover:bg-red-400">
                    <Trash2Icon className="w-4 h-4 mr-1.5" /> Xóa
                </button>
            </div>
             <button onClick={onClearSelection} className="text-indigo-200 hover:text-white">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
}
export const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }) => {
    if (totalItems <= itemsPerPage && currentPage === 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center mb-2 sm:mb-0">
                <span className="mr-2">Hiển thị</span>
                <select 
                    value={itemsPerPage} 
                    onChange={e => onItemsPerPageChange(Number(e.target.value))}
                    className="p-1 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
                <span className="ml-2">kết quả</span>
            </div>
            <div className="flex items-center">
                <span>{startItem}-{endItem} của {totalItems}</span>
                <div className="ml-4">
                    <button 
                        onClick={() => onPageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="px-3 py-1 border dark:border-gray-600 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Trước
                    </button>
                    <button 
                        onClick={() => onPageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border-t border-b border-r dark:border-gray-600 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SortableHeaderProps {
    label: string;
    sortKey: keyof Customer;
    currentSortKey: keyof Customer;
    direction: 'ascending' | 'descending';
    onSort: (key: keyof Customer) => void;
    className?: string;
}
export const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSortKey, direction, onSort, className }) => {
    const isSorting = currentSortKey === sortKey;
    return (
        <th scope="col" className={`px-6 py-3 ${className}`}>
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 group">
                {label}
                {isSorting ? (
                    direction === 'ascending' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                ) : (
                    <ChevronsUpDownIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                )}
            </button>
        </th>
    );
};


export const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode}> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center transition-transform duration-200 hover:scale-105">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-300 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

export const ReportCard: React.FC<{title: string, onExport: () => void, children: React.ReactNode}> = ({ title, onExport, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{title}</h3>
             <button onClick={onExport} className="px-3 py-1.5 text-xs border dark:border-gray-600 rounded-lg flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <DownloadIcon className="w-3 h-3 mr-1.5" /> Xuất CSV
            </button>
        </div>
        {children}
    </div>
);

export const BarChart: React.FC<{data: any, options?: any, theme: string}> = ({data, options, theme}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) chartInstance.current.destroy();
        
        const textColor = theme === 'dark' ? '#cbd5e1' : '#475569';
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        const finalOptions = { 
            responsive: true, 
            maintainAspectRatio: false, 
            ...options,
            scales: {
                y: { ...options?.scales?.y, ticks: { ...options?.scales?.y?.ticks, color: textColor }, grid: { ...options?.scales?.y?.grid, color: gridColor } },
                x: { ...options?.scales?.x, ticks: { ...options?.scales?.x?.ticks, color: textColor }, grid: { ...options?.scales?.x?.grid, color: gridColor } }
            },
            plugins: {
                ...options?.plugins,
                legend: { ...options?.plugins?.legend, labels: { ...options?.plugins?.legend?.labels, color: textColor } }
            }
        };

        chartInstance.current = new Chart(ctx, { type: 'bar', data, options: finalOptions });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [data, options, theme]);
    return <canvas ref={chartRef} />;
};

export const PieChart: React.FC<{data: any, options?: any, theme: string}> = ({data, options, theme}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) chartInstance.current.destroy();
        
        const textColor = theme === 'dark' ? '#e2e8f0' : '#334155';
        const borderColor = theme === 'dark' ? '#1f2937' : '#ffffff';
        
        const finalData = {
            ...data,
            datasets: data.datasets.map((ds: any) => ({ ...ds, borderColor }))
        };
        
        const finalOptions = { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { color: textColor } } }, 
            ...options 
        };

        chartInstance.current = new Chart(ctx, { type: 'pie', data: finalData, options: finalOptions });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [data, options, theme]);
    return <canvas ref={chartRef} />;
};

interface EditableSettingListProps<T extends { id: string, name: string }> {
    title: string;
    items: T[];
    displayFields: (keyof T)[];
    itemFactory: () => T;
    onUpdate: (updatedItems: T[]) => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
    enableDragDrop?: boolean;
    helpText?: string;
}

export function EditableSettingList<T extends { id: string, name: string, order?: number, color?: string, type?: string, amount?: number }>({ title, items, displayFields, itemFactory, onUpdate, addNotification, enableDragDrop = false, helpText }: EditableSettingListProps<T>) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [data, setData] = useState<Partial<T>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newData, setNewData] = useState<Partial<T>>({});

    const handleEdit = (item: T) => {
        setEditingId(item.id);
        setData(item);
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!editingId) return;
        const updatedItems = items.map(item => item.id === editingId ? { ...item, ...data } : item);
        onUpdate(updatedItems);
        addNotification('Đã lưu thay đổi.', 'success');
        setEditingId(null);
    };

    const handleAdd = () => {
        if (!newData.name?.trim()) { 
            addNotification('Tên không được để trống', 'error');
            return; 
        }
        const newItem = { ...itemFactory(), ...newData };
        onUpdate([...items, newItem]);
        addNotification('Đã thêm mục mới.', 'success');
        setIsAdding(false);
        setNewData({} as Partial<T>);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Hành động này sẽ không xóa khách hàng liên quan, nhưng bạn sẽ cần cập nhật họ sau. Bạn chắc chứ?")) {
            onUpdate(items.filter(item => item.id !== id));
            addNotification('Đã xóa mục.', 'success');
        }
    };
    
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("draggedIndex", index.toString());
    };
    
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);
        onUpdate(newItems);
    };

    const renderEditForm = (item: Partial<T>, isNew: boolean, stateSetter: (d: Partial<T>) => void) => (
        <div className="grid grid-cols-2 gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            {displayFields.map(field => (
                 <div key={field as string}>
                     <label className="text-xs capitalize dark:text-gray-300">{field as string}</label>
                     <input 
                        type={field === 'color' ? 'color' : field === 'amount' ? 'number' : 'text'}
                        value={item[field] as string || ''}
                        onChange={e => stateSetter({ ...item, [field]: e.target.value })}
                        className="w-full p-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                    />
                 </div>
            ))}
            { 'type' in itemFactory() &&
                 <div>
                     <label className="text-xs dark:text-gray-300">Type</label>
                      <select value={item['type']} onChange={e => stateSetter({...item, type: e.target.value})} className="w-full p-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                          <option value="pipeline">Pipeline</option><option value="win">Win</option><option value="delivered">Delivered</option><option value="lostsale">Lost Sale</option>
                      </select>
                 </div>
            }
             <div className="col-span-2 flex justify-end space-x-2">
                 <button onClick={() => isNew ? setIsAdding(false) : setEditingId(null)} className="px-2 py-1 text-xs border dark:border-gray-600 dark:text-gray-300 rounded">Hủy</button>
                 <button onClick={isNew ? handleAdd : handleSave} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Lưu</button>
            </div>
        </div>
    );
    

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-2 dark:text-gray-200">{title}</h3>
            {helpText && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{helpText}</p>}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {items.map((item, index) => (
                     <div key={item.id} className="p-2 border dark:border-gray-700 rounded-lg" onDrop={e => handleDrop(e, index)} onDragOver={e => e.preventDefault()}>
                         {editingId === item.id ? renderEditForm(data, false, setData) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {enableDragDrop && <span className="cursor-move text-gray-400 dark:text-gray-500 mr-2" draggable onDragStart={e => handleDragStart(e, index)}><GripVerticalIcon /></span>}
                                    { 'color' in item && <span className="w-4 h-4 rounded-full mr-3" style={{backgroundColor: item.color as string}}></span> }
                                    <span className="font-medium dark:text-gray-300">{item.name}</span>
                                    { 'amount' in item && <span className="text-gray-500 dark:text-gray-400 ml-2"> - {formatCurrency(item.amount as number)}</span>}
                                </div>
                                <div className="space-x-2">
                                     <button aria-label="Chỉnh sửa" onClick={() => handleEdit(item)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit2Icon className="w-4 h-4"/></button>
                                     <button aria-label="Xóa" onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2Icon className="w-4 h-4"/></button>
                                </div>
                            </div>
                         )}
                    </div>
                ))}
            </div>
             <div className="mt-4">
                {isAdding ? renderEditForm(newData, true, setNewData) : (
                    <button onClick={() => { setIsAdding(true); setEditingId(null); setNewData(itemFactory()) }} className="w-full p-2 text-sm border-2 border-dashed rounded-lg text-gray-500 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                        + Thêm mới
                    </button>
                )}
            </div>
        </div>
    );
}

interface ReminderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reminderData: Omit<Reminder, 'id'>, existingId?: string) => void;
    reminder: Reminder | null;
    customerId: string | null;
    customers: Customer[];
    user: User;
}
export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({isOpen, onClose, onSave, reminder, customerId, customers, user}) => {
    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', priority: 'medium' as Reminder['priority'], customerId: '', completed: false });
    
    const inputClasses = "w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    useEffect(() => {
        if(isOpen) {
            if (reminder) {
                 const localDate = new Date(reminder.dueDate).toISOString().slice(0, 16);
                 setFormData({ ...reminder, dueDate: localDate });
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const localDate = tomorrow.toISOString().slice(0, 16);
                setFormData({ title: '', description: '', dueDate: localDate, priority: 'medium', customerId: customerId || '', completed: false });
            }
        }
    }, [isOpen, reminder, customerId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.customerId) { alert("Vui lòng nhập Tiêu đề và chọn Khách hàng."); return; }
        
        const reminderToSave: Omit<Reminder, 'id'> = {
            title: formData.title,
            description: formData.description,
            dueDate: new Date(formData.dueDate).getTime(),
            priority: formData.priority,
            customerId: formData.customerId,
            userId: user.id,
            completed: formData.completed,
        };
        
        onSave(reminderToSave, reminder?.id);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title={reminder ? 'Sửa nhắc hẹn' : 'Thêm nhắc hẹn mới'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClasses}>Tiêu đề *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className={inputClasses} required/>
                </div>
                 <div>
                    <label className={labelClasses}>Khách hàng *</label>
                    <select value={formData.customerId} onChange={e => setFormData(p => ({...p, customerId: e.target.value}))} className={inputClasses} required>
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Thời gian *</label>
                    <input type="datetime-local" value={formData.dueDate} onChange={e => setFormData(p => ({...p, dueDate: e.target.value}))} className={inputClasses} required/>
                </div>
                 <div>
                    <label className={labelClasses}>Mô tả</label>
                    <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className={inputClasses} rows={3}/>
                </div>
                <div>
                    <label className={labelClasses}>Ưu tiên</label>
                     <select value={formData.priority} onChange={e => setFormData(p => ({...p, priority: e.target.value as Reminder['priority']}))} className={inputClasses}>
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                    </select>
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Lưu</button>
                </div>
            </form>
        </Modal>
    );
};
// END: CRM COMPONENTS


// START: NOTIFICATION SYSTEM & AUTH
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<{id: number, message: string, type: 'success' | 'error'}[]>([]);
    const { addNotificationRef } = useContext(CrmContext)!;

    const addNotification = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);
    
    useEffect(() => {
        // FIX: The context now provides addNotificationRef directly.
        if (addNotificationRef) {
            (addNotificationRef as React.MutableRefObject<any>).current = addNotification;
        }
    }, [addNotification, addNotificationRef]);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
             {children}
            <NotificationToasts notifications={notifications} />
        </NotificationContext.Provider>
    );
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dataManager = useCrmDataManager();
    return (
        <CrmContext.Provider value={dataManager}>
            {children}
        </CrmContext.Provider>
    );
};