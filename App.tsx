import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { Chart, DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController, LineController, PointElement, LineElement, Filler } from 'chart.js';
import { Role, type User, type Customer, type Status, type CarModel, type CustomerSource, type Interaction, type Reminder, type CrmData, type MarketingSpend } from './types';
import { VIETNAM_CITIES, CUSTOMER_TIERS } from './constants';
import { GeminiService } from './services/geminiService';
// FIX: Corrected import path from non-existent 'hooks' file to 'firebase' and included dataService for AuthProvider.
import { AuthContext, NotificationContext, useCrm, dataService } from './services/firebase';


// Register Chart.js components
Chart.register(DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController, LineController, PointElement, LineElement, Filler);


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
// END: ICONS


// START: HELPER FUNCTIONS
const formatCurrency = (amount: number | string) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};
const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleDateString('vi-VN') : '---';
const formatDateTime = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '---';
// END: HELPER FUNCTIONS


// START: REUSABLE UI COMPONENTS
export const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-8 h-full w-full">
        <div className="flex flex-col items-center">
            <RefreshCwIcon className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600 mt-2">Đang tải dữ liệu...</span>
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
            <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} transform transition-all duration-300`}>
                <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><XIcon className="w-6 h-6" /></button>
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
            <p className="text-lg font-semibold text-gray-800 mb-2">{title}</p>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
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
                        <p className="mt-4 text-gray-600">AI đang phân tích và tạo kịch bản...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-800 border min-h-[150px]">{script}</div>
                        <div className="mt-4 flex justify-end items-center space-x-3">
                            <button onClick={copyToClipboard} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition">Sao chép</button>
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
    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
        <div className="text-gray-400 mx-auto mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
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
const SkeletonBox: React.FC<{className?: string}> = ({ className }) => <div className={`bg-gray-200 rounded ${className} skeleton-pulse`}></div>;

export const MainLayoutSkeleton: React.FC = () => (
    <div className="flex h-screen bg-gray-100">
        <aside className="w-64 flex-shrink-0 hidden lg:block bg-white p-4">
            <SkeletonBox className="h-8 w-3/4 mb-8" />
            <div className="space-y-3">
                <SkeletonBox className="h-10 w-full" />
                <SkeletonBox className="h-10 w-full opacity-90" />
                <SkeletonBox className="h-10 w-full opacity-80" />
                <SkeletonBox className="h-10 w-full opacity-70" />
            </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
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
                    <div key={i} className="kanban-column flex-shrink-0 w-80 bg-gray-50 rounded-xl p-3">
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
    <div className="bg-white rounded-xl shadow p-6">
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
                        <tr key={i} className="border-b">
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
    <div className="bg-white rounded-xl shadow p-6">
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
        { value: 'call', label: '📞 Cuộc gọi', color: 'bg-green-100 text-green-800' },
        { value: 'email', label: '✉️ Email', color: 'bg-blue-100 text-blue-800' },
        { value: 'meeting', label: '🤝 Gặp mặt', color: 'bg-purple-100 text-purple-800' },
        { value: 'test_drive', label: '🚗 Lái thử', color: 'bg-orange-100 text-orange-800' },
        { value: 'quotation', label: '💰 Báo giá', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'other', label: '📝 Khác', color: 'bg-gray-100 text-gray-800' }
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
        if (!currentUser) return;
        setIsGeneratingScript(true);
        try {
            const script = await GeminiService.generateScript(customer, currentUser.name);
            setNewInteraction(prev => ({ ...prev, notes: script }));
        } catch (error) {
            console.error("Failed to generate script", error);
            addNotification("Không thể tạo kịch bản. Vui lòng thử lại.", 'error');
        } finally {
            setIsGeneratingScript(false);
        }
    };
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">Lịch sử Tương tác ({interactions.length})</h4>
                <button onClick={() => setIsAdding(!isAdding)} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" /> Thêm
                </button>
            </div>

            {isAdding && (
                <div className="p-4 border rounded-lg bg-gray-50/70 animate-fade-in-right space-y-3">
                    <textarea 
                        placeholder={getInteractionPlaceholder(newInteraction.type)} 
                        value={newInteraction.notes} 
                        onChange={(e) => setNewInteraction(p => ({ ...p, notes: e.target.value }))} 
                        rows={4} 
                        className="w-full p-2 border rounded-lg" 
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Loại</label>
                            <select value={newInteraction.type} onChange={(e) => setNewInteraction(p => ({ ...p, type: e.target.value }))} className="p-2 border rounded-lg w-full mt-1">
                                {interactionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Kết quả</label>
                            <select value={newInteraction.outcome} onChange={(e) => setNewInteraction(p => ({ ...p, outcome: e.target.value as Interaction['outcome'] }))} className="p-2 border rounded-lg w-full mt-1">
                                <option value="positive">✅ Tích cực</option>
                                <option value="neutral">⚪ Trung lập</option>
                                <option value="negative">❌ Tiêu cực</option>
                            </select>
                        </div>
                    </div>

                    {['call', 'meeting', 'test_drive'].includes(newInteraction.type) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thời lượng (phút)</label>
                            <input 
                                type="number"
                                value={newInteraction.duration}
                                onChange={(e) => setNewInteraction(p => ({ ...p, duration: parseInt(e.target.value, 10) || 0 }))}
                                className="w-full p-2 border rounded-lg mt-1"
                                min="0"
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={handleGenerateScript}
                            disabled={isGeneratingScript}
                            className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                        >
                            {isGeneratingScript ? (
                                <><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                            ) : (
                                <><SparklesIcon className="w-4 h-4 mr-2" /> Gợi ý AI</>
                            )}
                        </button>
                        <div className="flex space-x-2">
                             <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                             <button onClick={handleAddInteraction} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center">
                                 <SaveIcon className="w-4 h-4 mr-2" /> Lưu
                             </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {interactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <p>Chưa có tương tác</p>
                    </div>
                ) : (
                    [...interactions].sort((a, b) => b.date - a.date).map(interaction => {
                        const typeConfig = interactionTypes.find(t => t.value === interaction.type);
                        const outcomeIcons = { positive: '✅', neutral: '⚪', negative: '❌' };
                        return (
                            <div key={interaction.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${typeConfig?.color}`}>{typeConfig?.label}</span>
                                        <span className="text-xs text-gray-500">{formatDateTime(interaction.date)}</span>
                                    </div>
                                    <button aria-label="Xóa tương tác" onClick={() => onDeleteInteraction(interaction.id)} className="text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-lg mt-0.5">{outcomeIcons[interaction.outcome]}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800">{interaction.notes}</p>
                                        <div className="flex items-center text-xs text-gray-400 mt-1">
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
                    <mark key={i} className="bg-yellow-200 p-0 rounded-sm">
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
        <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate pr-2 min-w-0"><Highlight text={customer.name} highlight={searchTerm} /></h3>
                     <div className="flex items-center space-x-2 flex-shrink-0">
                         {activeReminder && <div className="text-yellow-500" title={`Nhắc hẹn: ${formatDate(activeReminder.dueDate)}`}><BellIcon className="w-4 h-4"/></div>}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tierConfig?.color} border border-current`}>{tierConfig?.value}</span>
                    </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-4"><PhoneIcon className="w-4 h-4 mr-2" /><Highlight text={customer.phone} highlight={searchTerm} /></div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center"><CarIcon className="w-4 h-4 mr-2" /><span><Highlight text={customer.carModel} highlight={searchTerm} /></span></div>
                    <div className="flex items-center"><LayersIcon className="w-4 h-4 mr-2" /><span><Highlight text={customer.source} highlight={searchTerm} /></span></div>
                </div>
                <select value={customer.statusId} onChange={(e) => onStatusChange(customer.id, e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-gray-50">
                    {statuses.sort((a, b) => a.order - b.order).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                </select>
            </div>
            <div className="px-4 pb-4 flex justify-center">
                <button onClick={() => setShowDetails(!showDetails)} className="flex items-center px-4 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-100 text-gray-700 font-medium transition-colors shadow-sm">
                    <span>{showDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
                    {showDetails ? <ChevronUpIcon className="w-4 h-4 ml-2 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />}
                </button>
            </div>

            {showDetails && (
                 <div className="border-t p-4 bg-gray-50/70 animate-fade-in-right">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700 mb-4 pb-4 border-b">
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
            
            <div className="p-3 border-t bg-gray-50 rounded-b-xl flex justify-end items-center space-x-2">
                <button aria-label="Đặt lịch hẹn" onClick={() => onOpenReminderModal(customer.id)} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors" title="Đặt lịch hẹn"><BellIcon className="w-5 h-5"/></button>
                <button aria-label="Tạo kịch bản chăm sóc AI" onClick={() => onGenerateScript(customer)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors" title="Tạo kịch bản chăm sóc AI"><SparklesIcon className="w-5 h-5"/></button>
                <button aria-label="Chỉnh sửa khách hàng" onClick={() => onCustomerEdit(customer)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Chỉnh sửa"><Edit2Icon className="w-5 h-5"/></button>
                <button aria-label="Xóa khách hàng" onClick={() => onDelete([customer.id])} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
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

    return (
        <Modal isOpen={isOpen} title={customer ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên *</label>
                        <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">SĐT *</label>
                        <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full p-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                         {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Thành phố</label>
                         <select value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full p-2 border rounded-lg border-gray-300">
                             <option value="">Chọn TP</option>
                            {VIETNAM_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                         </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dòng xe</label>
                        <select value={formData.carModel} onChange={(e) => handleChange('carModel', e.target.value)} className="w-full p-2 border rounded-lg border-gray-300">
                             <option value="">Chọn xe</option>
                             {carModels.map(model => <option key={model.id} value={model.name}>{model.name}</option>)}
                         </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Nguồn</label>
                         <select value={formData.source} onChange={(e) => handleChange('source', e.target.value)} className="w-full p-2 border rounded-lg border-gray-300">
                             <option value="">Chọn nguồn</option>
                             {customerSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                         </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <select value={formData.statusId} onChange={(e) => handleChange('statusId', e.target.value)} className="w-full p-2 border rounded-lg border-gray-300">
                             {statuses.sort((a,b) => a.order - b.order).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                         </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Phân loại</label>
                         <select value={formData.tier} onChange={(e) => handleChange('tier', e.target.value as Customer['tier'])} className="w-full p-2 border rounded-lg border-gray-300">
                              {CUSTOMER_TIERS.map(tier => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
                         </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Giá trị (VNĐ)</label>
                    <input type="number" value={formData.salesValue} onChange={(e) => handleChange('salesValue', e.target.value)} className="w-full p-2 border rounded-lg border-gray-300" min="0" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                    <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} className="w-full p-2 border rounded-lg border-gray-300" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" /> {customer ? 'Cập nhật' : 'Lưu'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export const KanbanView: React.FC<Omit<React.ComponentProps<typeof CustomerCard>, 'customer' | 'onStatusChange'> & { customers: Customer[], onCustomerUpdate: (id: string, updates: Partial<Customer>) => void, searchTerm: string, selectedUserId: string, onSelectedUserChange: (userId: string) => void }> = ({ customers, statuses, reminders, onCustomerEdit, onCustomerUpdate, onDelete, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users, searchTerm, selectedUserId, onSelectedUserChange, currentUser, addNotification }) => {
    const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (!draggedCustomerId) return;

        const draggedCustomer = customers.find(c => c.id === draggedCustomerId);
        if (!draggedCustomer) return;

        if (!draggedCustomer.userId) {
            if (currentUser?.role !== Role.ADMIN) return;
            if (selectedUserId === 'all') {
                addNotification('Vui lòng chọn một nhân viên cụ thể từ bộ lọc để phân công.', 'error');
                setDraggedCustomerId(null);
                return;
            }
            onCustomerUpdate(draggedCustomerId, { statusId: targetStatusId, userId: selectedUserId });
            addNotification(`Đã phân công ${draggedCustomer.name} cho nhân viên.`, 'success');
        } else {
            onCustomerUpdate(draggedCustomerId, { statusId: targetStatusId });
        }
        setDraggedCustomerId(null);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };
    
    const handleDragLeave = (e: React.DragEvent) => e.currentTarget.classList.remove('drag-over');
    
    const unassignedCustomers = useMemo(() => currentUser?.role === Role.ADMIN ? customers.filter(c => !c.userId) : [], [customers, currentUser?.role]);
    const assignedCustomers = useMemo(() => {
        if (currentUser?.role === Role.ADMIN) {
             if (selectedUserId === 'all') return customers.filter(c => !!c.userId);
             return customers.filter(c => c.userId === selectedUserId);
        }
        return customers.filter(c => c.userId === currentUser?.id);
    }, [customers, currentUser, selectedUserId]);


    const customersByStatus = useMemo(() => {
        const grouped: Record<string, Customer[]> = {};
        statuses.forEach(status => {
            grouped[status.id] = assignedCustomers.filter(customer => customer.statusId === status.id);
        });
        return grouped;
    }, [assignedCustomers, statuses]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Pipeline Bán hàng</h2>
                {currentUser?.role === Role.ADMIN && (
                    <div>
                        <label htmlFor="user-filter-kanban" className="text-sm font-medium mr-2">NV Sales:</label>
                        <select
                            id="user-filter-kanban"
                            value={selectedUserId}
                            onChange={e => onSelectedUserChange(e.target.value)}
                            className="p-2 border rounded-lg bg-gray-50"
                        >
                            <option value="all">Tất cả</option>
                            {users.filter(u => u.role === Role.USER).map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="kanban-container overflow-x-auto pb-6">
                <div className="flex space-x-4 min-w-max">
                     {currentUser?.role === Role.ADMIN && (
                        <div className="kanban-column flex-shrink-0 w-80 bg-gray-200/50 rounded-xl p-3 border-2 border-dashed border-gray-400">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-semibold flex items-center text-gray-800">
                                    <UserCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                    Chưa phân công
                                </h3>
                                <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{unassignedCustomers.length}</span>
                            </div>
                             <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                                 {unassignedCustomers.length > 0 ? unassignedCustomers.map(customer => (
                                    <div key={customer.id} draggable onDragStart={() => setDraggedCustomerId(customer.id)}>
                                        <CustomerCard 
                                            customer={customer} statuses={statuses} reminders={reminders} onCustomerEdit={onCustomerEdit} onDelete={(ids) => onDelete(ids)} onStatusChange={ (id, newStatus) => onCustomerUpdate(id, {statusId: newStatus}) } onAddInteraction={onAddInteraction} onDeleteInteraction={onDeleteInteraction} onGenerateScript={onGenerateScript} onOpenReminderModal={onOpenReminderModal} users={users} searchTerm={searchTerm} currentUser={currentUser} addNotification={addNotification} />
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-sm text-gray-500 rounded-lg h-full flex items-center justify-center">Không có khách hàng mới.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {statuses.sort((a, b) => a.order - b.order).map(status => (
                        <div key={status.id} className="kanban-column flex-shrink-0 w-80 bg-gray-50 rounded-xl p-3" onDrop={(e) => handleDrop(e, status.id)} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                             <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-semibold flex items-center text-gray-800">
                                    <span className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: status.color }}></span>
                                    {status.name}
                                </h3>
                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{customersByStatus[status.id]?.length || 0}</span>
                            </div>
                            <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                                 {customersByStatus[status.id]?.length > 0 ? customersByStatus[status.id]?.map(customer => (
                                    <div key={customer.id} draggable onDragStart={() => setDraggedCustomerId(customer.id)}>
                                        <CustomerCard 
                                            customer={customer} statuses={statuses} reminders={reminders} onCustomerEdit={onCustomerEdit} onDelete={(ids) => onDelete(ids)} onStatusChange={ (id, newStatus) => onCustomerUpdate(id, {statusId: newStatus}) } onAddInteraction={onAddInteraction} onDeleteInteraction={onDeleteInteraction} onGenerateScript={onGenerateScript} onOpenReminderModal={onOpenReminderModal} users={users} searchTerm={searchTerm} currentUser={currentUser} addNotification={addNotification}/>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-sm text-gray-500 border-2 border-dashed rounded-lg">Kéo khách hàng vào đây</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
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
const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, statuses, users, currentUser, onBulkUpdate, onBulkDelete, onClearSelection }) => {
    
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
const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }) => {
    if (totalItems <= itemsPerPage && currentPage === 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <div className="flex items-center mb-2 sm:mb-0">
                <span className="mr-2">Hiển thị</span>
                <select 
                    value={itemsPerPage} 
                    onChange={e => onItemsPerPageChange(Number(e.target.value))}
                    className="p-1 border rounded-md"
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
                        className="px-3 py-1 border rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Trước
                    </button>
                    <button 
                        onClick={() => onPageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border-t border-b border-r rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSortKey, direction, onSort, className }) => {
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

interface ListViewProps {
    customers: Customer[];
    totalCustomers: number;
    statuses: Status[];
    onCustomerEdit: (customer: Customer) => void;
    onCustomerDelete: (ids: string[]) => void;
    onGenerateScript: (customer: Customer) => void;
    onAddCustomer: () => void;
    users: User[];
    currentUser: User;
    selectedUserId: string;
    onSelectedUserChange: (userId: string) => void;
    searchTerm: string;
    selectedCustomerIds: Set<string>;
    onToggleSelectCustomer: (id: string) => void;
    onToggleSelectAll: () => void;
    sortConfig: { key: keyof Customer, direction: 'ascending' | 'descending' };
    handleSort: (key: keyof Customer) => void;
    pagination: { currentPage: number, itemsPerPage: number };
    setPagination: React.Dispatch<React.SetStateAction<{currentPage: number, itemsPerPage: number}>>;
}
export const ListView: React.FC<ListViewProps> = ({ customers, totalCustomers, statuses, onCustomerEdit, onCustomerDelete, onGenerateScript, onAddCustomer, users, currentUser, selectedUserId, onSelectedUserChange, searchTerm, selectedCustomerIds, onToggleSelectCustomer, onToggleSelectAll, sortConfig, handleSort, pagination, setPagination }) => {
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Chưa phân công';
    
    const areAllSelected = useMemo(() => {
        return customers.length > 0 && customers.every(c => selectedCustomerIds.has(c.id));
    }, [customers, selectedCustomerIds]);

    return (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Danh sách Khách hàng ({totalCustomers})</h2>
                {currentUser.role === Role.ADMIN && (
                    <div>
                        <label htmlFor="user-filter" className="text-sm font-medium mr-2">NV Sales:</label>
                        <select id="user-filter" value={selectedUserId} onChange={e => onSelectedUserChange(e.target.value)} className="p-2 border rounded-lg bg-gray-50">
                            <option value="all">Tất cả</option>
                            {users.filter(u => u.role === Role.USER).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="p-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                    checked={areAllSelected}
                                    onChange={onToggleSelectAll}
                                />
                            </th>
                            <SortableHeader label="Tên" sortKey="name" currentSortKey={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} />
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">SĐT</th>
                            <th scope="col" className="px-6 py-3">Trạng thái</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Phân loại</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Xe quan tâm</th>
                            <SortableHeader label="Ngày tạo" sortKey="createdDate" currentSortKey={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} className="hidden lg:table-cell" />
                            {currentUser.role === Role.ADMIN && <SortableHeader label="NV Phụ trách" sortKey="userId" currentSortKey={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} className="hidden lg:table-cell" />}
                            <th scope="col" className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => {
                            const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
                            const status = statuses.find(s => s.id === customer.statusId);
                            return (
                                <tr key={customer.id} className={`bg-white border-b hover:bg-gray-50 transition-colors ${selectedCustomerIds.has(customer.id) ? 'bg-indigo-50' : ''}`}>
                                    <td className="w-4 p-4">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                            checked={selectedCustomerIds.has(customer.id)}
                                            onChange={() => onToggleSelectCustomer(customer.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900"><Highlight text={customer.name} highlight={searchTerm} /></td>
                                    <td className="px-6 py-4 hidden md:table-cell"><Highlight text={customer.phone} highlight={searchTerm} /></td>
                                    <td className="px-6 py-4">
                                        {status ? (
                                            <span
                                                className="px-2.5 py-1 text-xs font-semibold rounded-full inline-block whitespace-nowrap"
                                                style={{
                                                    backgroundColor: `${status.color}2A`,
                                                    color: status.color
                                                }}
                                            >
                                                {status.name}
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell"><span className={`font-semibold ${tierConfig?.color}`}>{tierConfig?.value}</span></td>
                                    <td className="px-6 py-4 hidden md:table-cell"><Highlight text={customer.carModel} highlight={searchTerm} /></td>
                                    <td className="px-6 py-4 hidden lg:table-cell">{formatDate(customer.createdDate)}</td>
                                    {currentUser.role === Role.ADMIN && <td className="px-6 py-4 hidden lg:table-cell">{getUserName(customer.userId as string)}</td>}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button aria-label="Tạo kịch bản AI" onClick={() => onGenerateScript(customer)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors" title="Tạo kịch bản"><SparklesIcon className="w-5 h-5"/></button>
                                        <button aria-label="Chỉnh sửa" onClick={() => onCustomerEdit(customer)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Chỉnh sửa"><Edit2Icon className="w-5 h-5"/></button>
                                        <button aria-label="Xóa" onClick={() => onCustomerDelete([customer.id])} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {totalCustomers === 0 && (
                    <div className="border-t">
                        <EmptyState 
                            icon={<UsersIcon className="w-12 h-12"/>}
                            title="Chưa có khách hàng nào"
                            message="Hãy bắt đầu bằng cách thêm khách hàng mới để quản lý."
                            action={<button onClick={onAddCustomer} className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto"><PlusIcon className="w-4 h-4 mr-2" /> Thêm khách hàng</button>}
                        />
                    </div>
                )}
            </div>
             <PaginationControls 
                currentPage={pagination.currentPage}
                totalPages={Math.ceil(totalCustomers / pagination.itemsPerPage)}
                itemsPerPage={pagination.itemsPerPage}
                totalItems={totalCustomers}
                onPageChange={(page) => setPagination(p => ({ ...p, currentPage: page }))}
                onItemsPerPageChange={(items) => setPagination({ currentPage: 1, itemsPerPage: items })}
            />
        </div>
    );
};

export const Dashboard: React.FC<{
    customers: Customer[],
    statuses: Status[],
    reminders: Reminder[],
    onEditReminder: (reminder: Reminder) => void,
    onToggleComplete: (id: string) => void,
    onDeleteReminder: (id: string) => void,
    onOpenCustomer: (customer: Customer) => void,
}> = ({ customers, statuses, reminders, onEditReminder, onToggleComplete, onDeleteReminder, onOpenCustomer }) => {
    
    const stats = useMemo(() => {
        const deliveredStatusIds = statuses.filter(s => s.type === 'delivered').map(s => s.id);
        const winStatusIds = statuses.filter(s => s.type === 'win').map(s => s.id);
        const lostStatusIds = statuses.filter(s => s.type === 'lostsale').map(s => s.id);

        const newCustomersThisMonth = customers.filter(c => new Date(c.createdDate).getMonth() === new Date().getMonth() && new Date(c.createdDate).getFullYear() === new Date().getFullYear()).length;
        const totalDelivered = customers.filter(c => deliveredStatusIds.includes(c.statusId));
        const totalRevenue = totalDelivered.reduce((sum, c) => sum + c.salesValue, 0);
        
        const pipelineCustomersCount = customers.filter(c => !deliveredStatusIds.includes(c.statusId) && !winStatusIds.includes(c.statusId) && !lostStatusIds.includes(c.statusId)).length;
        const closedCustomersCount = customers.length - pipelineCustomersCount;
        const wonCustomersCount = totalDelivered.length + customers.filter(c => winStatusIds.includes(c.statusId)).length;

        return {
            newCustomersThisMonth,
            totalRevenue,
            carsSold: totalDelivered.length,
            conversionRate: closedCustomersCount > 0 ? ((wonCustomersCount / closedCustomersCount) * 100).toFixed(1) + '%' : '0%',
        };
    }, [customers, statuses]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Doanh thu tháng" value={formatCurrency(stats.totalRevenue)} icon={<DollarSignIcon />} />
                 <StatCard title="Xe đã bán" value={stats.carsSold.toString()} icon={<TrendingUpIcon />} />
                 <StatCard title="KH mới trong tháng" value={stats.newCustomersThisMonth.toString()} icon={<UsersIcon />} />
                 <StatCard title="Tỷ lệ chuyển đổi" value={stats.conversionRate} icon={<TargetIcon />} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold text-lg mb-4">Hoạt động Bán hàng (30 ngày qua)</h3>
                     <div className="chart-container">
                        <SalesOverTimeChart customers={customers} statuses={statuses} />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold text-lg mb-4">Phân bổ Pipeline</h3>
                     <div className="chart-container">
                        <PipelineDistributionChart customers={customers} statuses={statuses} />
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-lg mb-4">Nhắc hẹn sắp tới</h3>
                <UpcomingReminders reminders={reminders} customers={customers} onEdit={onEditReminder} onToggleComplete={onToggleComplete} onDelete={onDeleteReminder} onOpenCustomer={onOpenCustomer} />
            </div>
        </div>
    );
};

const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode}> = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow p-6 flex items-center transition-transform duration-200 hover:scale-105">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const SalesOverTimeChart: React.FC<{customers: Customer[], statuses: Status[]}> = ({ customers, statuses }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        
        const deliveredStatusIds = new Set(statuses.filter(s => s.type === 'delivered').map(s => s.id));
        const salesData = customers
            .filter(c => deliveredStatusIds.has(c.statusId))
            .reduce((acc, customer) => {
                const date = new Date(customer.lastContactDate).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        
        const labels: string[] = [];
        const data: number[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            data.push(salesData[dateString] || 0);
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Số xe đã bán',
                    data,
                    fill: true,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                 scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
        
         return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [customers, statuses]);

    return <canvas ref={chartRef} />;
};


const PipelineDistributionChart: React.FC<{customers: Customer[], statuses: Status[]}> = ({ customers, statuses }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const pipelineStatuses = statuses.filter(s => s.type === 'pipeline').sort((a,b) => a.order - b.order);
        const data = pipelineStatuses.map(status => customers.filter(c => c.statusId === status.id).length);
        const labels = pipelineStatuses.map(status => status.name);
        const colors = pipelineStatuses.map(status => status.color);

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

         if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Số lượng KH',
                    data,
                    backgroundColor: colors,
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } } } }
        });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [customers, statuses]);

    return <canvas ref={chartRef} />;
};


const UpcomingReminders: React.FC<{
    reminders: Reminder[],
    customers: Customer[],
    onEdit: (reminder: Reminder) => void,
    onToggleComplete: (id: string) => void,
    onDelete: (id: string) => void,
    onOpenCustomer: (customer: Customer) => void,
}> = ({ reminders, customers, onEdit, onToggleComplete, onDelete, onOpenCustomer }) => {

    const upcoming = useMemo(() => {
        return reminders
            .filter(r => !r.completed)
            .sort((a, b) => a.dueDate - b.dueDate)
            .slice(0, 5);
    }, [reminders]);

    const getCustomer = (id: string) => customers.find(c => c.id === id);
    
    const isOverdue = (dueDate: number) => new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

    if (upcoming.length === 0) {
        return <EmptyState icon={<CheckCircleIcon className="w-12 h-12 text-green-500" />} title="Thật tuyệt vời!" message="Bạn đã hoàn thành tất cả nhắc hẹn." />;
    }

    return (
        <div className="space-y-3">
            {upcoming.map(reminder => {
                const customer = getCustomer(reminder.customerId);
                return (
                    <div key={reminder.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center">
                             <button aria-label="Đánh dấu hoàn thành" onClick={() => onToggleComplete(reminder.id)} className="mr-4 text-gray-300 hover:text-green-500">
                                 <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center"></div>
                             </button>
                             <div>
                                <p className={`font-semibold flex items-center ${isOverdue(reminder.dueDate) ? 'text-red-600' : 'text-gray-800'}`}>
                                    {reminder.title}
                                    {reminder.isAuto && <span title="Nhắc hẹn tự động" className="ml-2 text-indigo-500"><BotIcon className="w-4 h-4"/></span>}
                                </p>
                                 <p className="text-sm text-gray-500">
                                     {customer ? <button onClick={() => customer && onOpenCustomer(customer)} className="hover:underline">{customer.name}</button> : '...'} -
                                     <span className={`ml-1 font-medium ${isOverdue(reminder.dueDate) ? 'text-red-500' : 'text-gray-600'}`}>{formatDate(reminder.dueDate)}</span>
                                 </p>
                             </div>
                        </div>
                         <div className="flex items-center space-x-1">
                             <span className={`px-2 py-1 text-xs rounded-full ${reminder.priority === 'high' ? 'bg-red-100 text-red-800' : reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{reminder.priority}</span>
                             <button aria-label="Chỉnh sửa nhắc hẹn" onClick={() => onEdit(reminder)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full"><Edit2Icon className="w-4 h-4" /></button>
                             <button aria-label="Xóa nhắc hẹn" onClick={() => onDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export const ReportsView: React.FC<{crmData: CrmData, users: User[]}> = ({crmData, users}) => {
    
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header], (key, value) => value === null ? '' : value)
                ).join(',')
            )
        ];
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="space-y-6">
             <h1 className="text-2xl font-bold text-gray-800">Báo cáo & Phân tích</h1>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <EmployeeSalesReport crmData={crmData} users={users} onExport={exportToCSV} />
                 <CarModelPerformanceReport crmData={crmData} onExport={exportToCSV} />
                 <LeadSourceReport crmData={crmData} onExport={exportToCSV} />
                 <CacLtvReport crmData={crmData} onExport={exportToCSV} />
            </div>
        </div>
    )
};

const ReportCard: React.FC<{title: string, onExport: () => void, children: React.ReactNode}> = ({ title, onExport, children }) => (
    <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
             <button onClick={onExport} className="px-3 py-1.5 text-xs border rounded-lg flex items-center hover:bg-gray-100">
                <DownloadIcon className="w-3 h-3 mr-1.5" /> Xuất CSV
            </button>
        </div>
        {children}
    </div>
);

const EmployeeSalesReport: React.FC<{crmData: CrmData, users: User[], onExport: (data: any[], filename: string) => void}> = ({crmData, users, onExport}) => {
    const deliveredStatusIds = crmData.statuses.filter(s => s.type === 'delivered').map(s => s.id);
    const salesUsers = users.filter(u => u.role === Role.USER);
    
    const reportData = useMemo(() => salesUsers.map(user => {
        const userCustomers = crmData.customers.filter(c => c.userId === user.id);
        const carsSold = userCustomers.filter(c => deliveredStatusIds.includes(c.statusId));
        const totalRevenue = carsSold.reduce((sum, c) => sum + c.salesValue, 0);
        const totalLeads = userCustomers.length;
        const conversionRate = totalLeads > 0 ? (carsSold.length / totalLeads * 100) : 0;
        
        return {
            'Nhân viên': user.name,
            'Doanh thu': totalRevenue,
            'Số xe bán': carsSold.length,
            'Tổng Leads': totalLeads,
            'Tỷ lệ chốt (%)': conversionRate.toFixed(1)
        }
    }), [crmData.customers, salesUsers, deliveredStatusIds]);
    
    const chartData = {
        labels: reportData.map(d => d['Nhân viên']),
        datasets: [{
            label: 'Doanh thu',
            data: reportData.map(d => d['Doanh thu']),
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1
        }]
    };
    
    return (
        <ReportCard title="Hiệu suất bán hàng theo nhân viên" onExport={() => onExport(reportData, 'employee_sales_report')}>
            <div className="space-y-4">
                <div className="chart-container h-64">
                    <BarChart data={chartData} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} />
                </div>
                <div className="overflow-x-auto max-h-60 custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600">{h}</th>)}</tr></thead>
                        <tbody>{reportData.map((row, i) => <tr key={i} className="border-b">{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 1 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};


const CarModelPerformanceReport: React.FC<{crmData: CrmData, onExport: (data: any[], filename: string) => void}> = ({crmData, onExport}) => {
    const deliveredStatusIds = crmData.statuses.filter(s => s.type === 'delivered').map(s => s.id);
    
    const reportData = useMemo(() => {
        const dataByModel: Record<string, { leads: number, sold: number, revenue: number }> = {};
        crmData.carModels.forEach(model => {
            dataByModel[model.name] = { leads: 0, sold: 0, revenue: 0 };
        });

        crmData.customers.forEach(customer => {
            if (customer.carModel && dataByModel[customer.carModel]) {
                dataByModel[customer.carModel].leads++;
                if (deliveredStatusIds.includes(customer.statusId)) {
                    dataByModel[customer.carModel].sold++;
                    dataByModel[customer.carModel].revenue += customer.salesValue;
                }
            }
        });
        
        return Object.entries(dataByModel).map(([modelName, data]) => ({
            'Dòng xe': modelName,
            'Số xe bán': data.sold,
            'Doanh thu': data.revenue,
            'Tổng Leads': data.leads,
        })).sort((a,b) => b['Số xe bán'] - a['Số xe bán']);

    }, [crmData.customers, crmData.carModels, deliveredStatusIds]);
    
     const chartData = {
        labels: reportData.map(d => d['Dòng xe']),
        datasets: [{
            label: 'Số xe bán',
            data: reportData.map(d => d['Số xe bán']),
            backgroundColor: ['#4f46e5', '#f97316', '#22c55e', '#ef4444', '#3b82f6'],
        }]
    };
    
    return (
        <ReportCard title="Hiệu suất theo Dòng xe" onExport={() => onExport(reportData, 'carmodel_performance_report')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                 <div className="chart-container h-64">
                    <PieChart data={chartData} />
                </div>
                 <div className="overflow-x-auto max-h-60 custom-scrollbar">
                     <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600">{h}</th>)}</tr></thead>
                        <tbody>{reportData.map((row, i) => <tr key={i} className="border-b">{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 2 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    )
};

const LeadSourceReport: React.FC<{crmData: CrmData, onExport: (data: any[], filename: string) => void}> = ({crmData, onExport}) => {
    const deliveredStatusIds = crmData.statuses.filter(s => s.type === 'delivered').map(s => s.id);

    const reportData = useMemo(() => {
        const dataBySource: Record<string, { leads: number, revenue: number }> = {};
        crmData.customerSources.forEach(source => {
            dataBySource[source.name] = { leads: 0, revenue: 0 };
        });

        crmData.customers.forEach(customer => {
            if (customer.source && dataBySource[customer.source]) {
                dataBySource[customer.source].leads++;
                if (deliveredStatusIds.includes(customer.statusId)) {
                    dataBySource[customer.source].revenue += customer.salesValue;
                }
            }
        });
        
        return Object.entries(dataBySource).map(([sourceName, data]) => ({
            'Nguồn KH': sourceName,
            'Số lượng Leads': data.leads,
            'Doanh thu': data.revenue,
        })).sort((a,b) => b['Số lượng Leads'] - a['Số lượng Leads']);
    }, [crmData.customers, crmData.customerSources, deliveredStatusIds]);
    
    const chartData = {
        labels: reportData.map(d => d['Nguồn KH']),
        datasets: [{
            label: 'Doanh thu',
            data: reportData.map(d => d['Doanh thu']),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
        }]
    };
    
    return (
        <ReportCard title="Hiệu quả Nguồn khách hàng" onExport={() => onExport(reportData, 'lead_source_report')}>
            <div className="space-y-4">
                 <div className="chart-container h-64">
                    <BarChart data={chartData} options={{ plugins: { legend: { display: false } } }} />
                </div>
                 <div className="overflow-x-auto max-h-60 custom-scrollbar">
                     <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600">{h}</th>)}</tr></thead>
                        <tbody>{reportData.map((row, i) => <tr key={i} className="border-b">{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 2 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};

const CacLtvReport: React.FC<{ crmData: CrmData; onExport: (data: any[], filename: string) => void }> = ({ crmData, onExport }) => {
    const deliveredStatusIds = crmData.statuses.filter(s => s.type === 'delivered').map(s => s.id);

    const reportData = useMemo(() => {
        const spendMap = new Map(crmData.marketingSpends.map(s => [s.name, s.amount]));

        const dataBySource: Record<string, { customers: number; revenue: number }> = {};
        crmData.customerSources.forEach(source => {
            dataBySource[source.name] = { customers: 0, revenue: 0 };
        });

        crmData.customers.forEach(customer => {
            if (customer.source && dataBySource[customer.source]) {
                if (deliveredStatusIds.includes(customer.statusId)) {
                    dataBySource[customer.source].customers++;
                    dataBySource[customer.source].revenue += customer.salesValue;
                }
            }
        });

        return Object.entries(dataBySource).map(([sourceName, data]) => {
            const spend = spendMap.get(sourceName) || 0;
            const ltv = data.customers > 0 ? data.revenue / data.customers : 0;
            const cac = data.customers > 0 ? spend / data.customers : 0;
            const ratio = cac > 0 ? (ltv / cac) : 0;

            return {
                'Nguồn KH': sourceName,
                'Tổng KH': data.customers,
                'LTV (VNĐ)': ltv,
                'CAC (VNĐ)': cac,
                'Tỷ lệ LTV:CAC': ratio,
            };
        }).sort((a,b) => (b['Tỷ lệ LTV:CAC'] as number) - (a['Tỷ lệ LTV:CAC'] as number));
    }, [crmData, deliveredStatusIds]);
    
    const formattedDataForExport = reportData.map(row => ({...row, 'Tỷ lệ LTV:CAC': row['Tỷ lệ LTV:CAC'].toFixed(2) }));

    const chartData = {
        labels: reportData.map(d => d['Nguồn KH']),
        datasets: [{
            label: 'Tỷ lệ LTV:CAC',
            data: reportData.map(d => d['Tỷ lệ LTV:CAC']),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }]
    };

    return (
        <ReportCard title="Chi phí Thu hút KH (CAC) vs. Giá trị Vòng đời (LTV)" onExport={() => onExport(formattedDataForExport, 'cac_ltv_report')}>
            <div className="space-y-4">
                <div className="chart-container h-64">
                    <BarChart data={chartData} options={{ plugins: { legend: { display: false } } }} />
                </div>
                <div className="overflow-x-auto max-h-60 custom-scrollbar">
                    <table className="w-full text-sm">
                         <thead className="bg-gray-50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600">{h}</th>)}</tr></thead>
                        <tbody>{reportData.map((row, i) => <tr key={i} className="border-b">{Object.values(row).map((val, j) => <td key={j} className="p-2">{j > 1 && typeof val === 'number' ? (j === 4 ? val.toFixed(2) : formatCurrency(val)) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};


const BarChart: React.FC<{data: any, options?: any}> = ({data, options}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, { type: 'bar', data, options: { responsive: true, maintainAspectRatio: false, ...options } });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [data, options]);
    return <canvas ref={chartRef} />;
};

const PieChart: React.FC<{data: any, options?: any}> = ({data, options}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, { type: 'pie', data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, ...options } });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [data, options]);
    return <canvas ref={chartRef} />;
};


export const SettingsPanel: React.FC<{
    users: User[];
    crmData: CrmData;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setCrmData: React.Dispatch<React.SetStateAction<CrmData>>;
    addNotification: (message: string, type: 'success' | 'error') => void;
}> = ({ users, crmData, setUsers, setCrmData, addNotification }) => {
    
    const handleResetAllData = () => {
        if (window.confirm("HÀNH ĐỘNG NGUY HIỂM!\nBạn có chắc chắn muốn xóa TẤT CẢ dữ liệu khách hàng, nhắc hẹn, và mục tiêu không? Dữ liệu cài đặt sẽ được giữ lại.")) {
            setCrmData(prev => ({
                ...prev,
                customers: [],
                reminders: [],
                salesGoals: []
            }));
            addNotification('Đã xóa tất cả dữ liệu CRM!', 'success');
        }
    };
    
    const handleSettingsUpdate = <T extends Status | CarModel | CustomerSource | MarketingSpend>(key: keyof CrmData, updatedData: T[]) => {
        // @ts-ignore
        setCrmData(prev => ({...prev, [key]: updatedData }));
    }

    return (
         <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800">Cài đặt Hệ thống</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EditableSettingList
                    title="Trạng thái Pipeline"
                    items={crmData.statuses.sort((a,b) => a.order - b.order)}
                    displayFields={['name', 'color', 'type']}
                    itemFactory={() => ({ id: `status_${Date.now()}`, name: '', color: '#cccccc', order: crmData.statuses.length + 1, type: 'pipeline' })}
                    onUpdate={(updatedItems) => handleSettingsUpdate('statuses', updatedItems.map((item, index) => ({...item, order: index + 1 })))}
                    addNotification={addNotification}
                    enableDragDrop
                />
                
                 <EditableSettingList
                    title="Dòng xe"
                    items={crmData.carModels}
                    displayFields={['name']}
                    itemFactory={() => ({ id: `model_${Date.now()}`, name: '' })}
                    onUpdate={(updatedItems) => handleSettingsUpdate('carModels', updatedItems)}
                    addNotification={addNotification}
                />
                
                 <EditableSettingList
                    title="Nguồn khách hàng"
                    items={crmData.customerSources}
                    displayFields={['name']}
                    itemFactory={() => ({ id: `source_${Date.now()}`, name: '' })}
                    onUpdate={(updatedItems) => handleSettingsUpdate('customerSources', updatedItems)}
                    addNotification={addNotification}
                />

                <EditableSettingList
                    title="Chi phí Marketing"
                    items={crmData.marketingSpends}
                    displayFields={['name', 'amount']}
                    itemFactory={() => ({ id: `spend_${Date.now()}`, name: '', amount: 0 })}
                    onUpdate={(updatedItems) => handleSettingsUpdate('marketingSpends', updatedItems)}
                    addNotification={addNotification}
                    helpText="Chi phí theo từng nguồn KH, dùng cho báo cáo CAC."
                />
            </div>

            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-lg text-red-700 mb-2">Vùng nguy hiểm</h3>
                <p className="text-sm text-gray-600 mb-4">Các hành động này không thể hoàn tác. Hãy cẩn thận.</p>
                <div className="flex space-x-4">
                    <button onClick={handleResetAllData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Xóa Dữ liệu Khách hàng</button>
                </div>
            </div>
        </div>
    );
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

function EditableSettingList<T extends { id: string, name: string, order?: number, color?: string, type?: string, amount?: number }>({ title, items, displayFields, itemFactory, onUpdate, addNotification, enableDragDrop = false, helpText }: EditableSettingListProps<T>) {
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
        <div className="grid grid-cols-2 gap-2 p-2 bg-gray-100 rounded-md">
            {displayFields.map(field => (
                 <div key={field as string}>
                     <label className="text-xs capitalize">{field as string}</label>
                     <input 
                        type={field === 'color' ? 'color' : field === 'amount' ? 'number' : 'text'}
                        value={item[field] as string || ''}
                        onChange={e => stateSetter({ ...item, [field]: e.target.value })}
                        className="w-full p-1 border rounded"
                    />
                 </div>
            ))}
            { 'type' in itemFactory() &&
                 <div>
                     <label className="text-xs">Type</label>
                      <select value={item['type']} onChange={e => stateSetter({...item, type: e.target.value})} className="w-full p-1 border rounded">
                          <option value="pipeline">Pipeline</option><option value="win">Win</option><option value="delivered">Delivered</option><option value="lostsale">Lost Sale</option>
                      </select>
                 </div>
            }
             <div className="col-span-2 flex justify-end space-x-2">
                 <button onClick={() => isNew ? setIsAdding(false) : setEditingId(null)} className="px-2 py-1 text-xs border rounded">Hủy</button>
                 <button onClick={isNew ? handleAdd : handleSave} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Lưu</button>
            </div>
        </div>
    );
    

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            {helpText && <p className="text-sm text-gray-500 mb-4">{helpText}</p>}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {items.map((item, index) => (
                     <div key={item.id} className="p-2 border rounded-lg" onDrop={e => handleDrop(e, index)} onDragOver={e => e.preventDefault()}>
                         {editingId === item.id ? renderEditForm(data, false, setData) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {enableDragDrop && <span className="cursor-move text-gray-400 mr-2" draggable onDragStart={e => handleDragStart(e, index)}><GripVerticalIcon /></span>}
                                    { 'color' in item && <span className="w-4 h-4 rounded-full mr-3" style={{backgroundColor: item.color as string}}></span> }
                                    <span className="font-medium">{item.name}</span>
                                    { 'amount' in item && <span className="text-gray-500 ml-2"> - {formatCurrency(item.amount as number)}</span>}
                                </div>
                                <div className="space-x-2">
                                     <button aria-label="Chỉnh sửa" onClick={() => handleEdit(item)} className="p-1 text-gray-500 hover:text-indigo-600"><Edit2Icon className="w-4 h-4"/></button>
                                     <button aria-label="Xóa" onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2Icon className="w-4 h-4"/></button>
                                </div>
                            </div>
                         )}
                    </div>
                ))}
            </div>
             <div className="mt-4">
                {isAdding ? renderEditForm(newData, true, setNewData) : (
                    <button onClick={() => { setIsAdding(true); setEditingId(null); setNewData(itemFactory()) }} className="w-full p-2 text-sm border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400">
                        + Thêm mới
                    </button>
                )}
            </div>
        </div>
    );
}

export const RemindersView: React.FC<{
    reminders: Reminder[],
    customers: Customer[],
    onOpenReminderModal: (customerId: string | null, reminder?: Reminder) => void,
    onToggleComplete: (id: string) => void,
    onDelete: (id: string) => void,
}> = ({ reminders, customers, onOpenReminderModal, onToggleComplete, onDelete }) => {
    
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    
    const filteredReminders = useMemo(() => {
        let sorted = [...reminders].sort((a,b) => a.dueDate - b.dueDate);
        if (filter === 'pending') return sorted.filter(r => !r.completed);
        if (filter === 'completed') return sorted.filter(r => r.completed);
        return sorted;
    }, [reminders, filter]);
    
    const getCustomer = (id: string) => customers.find(c => c.id === id);

    return (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Quản lý Nhắc hẹn</h2>
                <div className="flex items-center space-x-2">
                     <div className="bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${filter === 'pending' ? 'bg-white shadow' : 'text-gray-600'}`}>Chưa xong</button>
                        <button onClick={() => setFilter('completed')} className={`px-3 py-1 text-sm rounded-md ${filter === 'completed' ? 'bg-white shadow' : 'text-gray-600'}`}>Đã xong</button>
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white shadow' : 'text-gray-600'}`}>Tất cả</button>
                    </div>
                    <button onClick={() => onOpenReminderModal(null)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center">
                        <PlusIcon className="w-4 h-4 mr-2" /> Thêm
                    </button>
                </div>
            </div>
            
            <div className="space-y-3">
                 {filteredReminders.length > 0 ? filteredReminders.map(reminder => {
                    const customer = getCustomer(reminder.customerId);
                    const isOverdue = !reminder.completed && reminder.dueDate < Date.now();
                     return (
                         <div key={reminder.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between transition ${reminder.completed ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
                            <div className="flex items-start">
                                <button aria-label="Đánh dấu hoàn thành" onClick={() => onToggleComplete(reminder.id)} className={`mr-4 mt-1 flex-shrink-0 ${reminder.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                                    {reminder.completed ? <CheckCircleIcon className="w-6 h-6"/> : <div className="w-6 h-6 rounded-full border-2 border-current"></div>}
                                 </button>
                                 <div>
                                     <p className={`font-semibold flex items-center ${isOverdue ? 'text-red-600' : 'text-gray-800'} ${reminder.completed ? 'line-through' : ''}`}>
                                        {reminder.title}
                                        {reminder.isAuto && <span title="Nhắc hẹn tự động" className="ml-2 text-indigo-500"><BotIcon className="w-4 h-4"/></span>}
                                    </p>
                                     <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                                      <p className="text-sm text-gray-500 mt-2">
                                          KH: <strong className="text-indigo-600">{customer?.name || '...'}</strong> | 
                                          Hạn: <span className={`font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>{formatDateTime(reminder.dueDate)}</span>
                                     </p>
                                 </div>
                             </div>
                             <div className="flex items-center space-x-1 flex-shrink-0 ml-auto sm:ml-4 mt-3 sm:mt-0">
                                <span className={`px-2 py-1 text-xs rounded-full ${reminder.priority === 'high' ? 'bg-red-100 text-red-800' : reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{reminder.priority}</span>
                                <button aria-label="Chỉnh sửa" onClick={() => onOpenReminderModal(null, reminder)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full"><Edit2Icon className="w-4 h-4" /></button>
                                <button aria-label="Xóa" onClick={() => onDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                }) : <EmptyState icon={<BellIcon className="w-12 h-12" />} title="Không có nhắc hẹn nào" message="Mọi thứ đều được kiểm soát. Hãy thêm nhắc hẹn mới để không bỏ lỡ cơ hội." action={<button onClick={() => onOpenReminderModal(null)} className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto"><PlusIcon className="w-4 h-4 mr-2" /> Thêm nhắc hẹn</button>} /> }
            </div>
        </div>
    );
};

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
                    <label className="block text-sm font-medium">Tiêu đề *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="w-full p-2 border rounded-lg" required/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Khách hàng *</label>
                    <select value={formData.customerId} onChange={e => setFormData(p => ({...p, customerId: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-50" required>
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Thời gian *</label>
                    <input type="datetime-local" value={formData.dueDate} onChange={e => setFormData(p => ({...p, dueDate: e.target.value}))} className="w-full p-2 border rounded-lg" required/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Mô tả</label>
                    <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="w-full p-2 border rounded-lg" rows={3}/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Ưu tiên</label>
                     <select value={formData.priority} onChange={e => setFormData(p => ({...p, priority: e.target.value as Reminder['priority']}))} className="w-full p-2 border rounded-lg">
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                    </select>
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Lưu</button>
                </div>
            </form>
        </Modal>
    );
};
// END: CRM COMPONENTS


// START: NOTIFICATION SYSTEM
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within a NotificationProvider");
    return context;
};

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<{id: number, message: string, type: 'success' | 'error'}[]>([]);

    const addNotification = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <NotificationToasts notifications={notifications} />
        </NotificationContext.Provider>
    );
};
// END: NOTIFICATION SYSTEM


// START: AUTH CONTEXT
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// FIX: Refactored AuthProvider to remove faulty useCrm() call and handle authentication directly.
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);
    
    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        const { users: allUsers } = dataService.getData();
        const user = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;

        if (user) {
            const userToStore = { ...user };
            delete userToStore.password;
            sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
            setCurrentUser(userToStore);
            setLoading(false);
            return true;
        }
        setLoading(false);
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('currentUser');
        setCurrentUser(null);
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </AuthContext.Provider>
    );
};
// END: AUTH CONTEXT


const App: React.FC = () => (
    <AuthProvider>
        <CrmApp />
    </AuthProvider>
);

const CrmApp: React.FC = () => {
    const { currentUser } = useAuth();
    if (!currentUser) return <LoginView />;
    return <MainLayout />;
};

const LoginView: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login(username, password);
        if (!success) {
            setError('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-center mb-6">
                    <BriefcaseIcon className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">CRM Sales MG</h2>
                <p className="text-center text-gray-500 mb-6">Đăng nhập để tiếp tục</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">Tên đăng nhập</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="admin / user"
                            autoComplete="username"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400">
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const MainLayout: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { addNotification } = useNotification();
    
    // All data logic is now managed by the useCrm hook
    const crm = useCrm(currentUser, addNotification);

    const [activeView, setActiveView] = useState('dashboard');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, ids: [] as string[] });
    const [scriptModal, setScriptModal] = useState({ isOpen: false, script: '', isLoading: false });
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [activeReminderCustomerId, setActiveReminderCustomerId] = useState<string | null>(null);

    // Reset selection and pagination on filter/view change
    useEffect(() => {
        crm.clearSelection();
        crm.resetPagination();
    }, [crm.searchTerm, activeView, crm.selectedUserId]);

    const handleGenerateScript = async (customer: Customer) => {
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
    const openEditCustomer = (customer: Customer) => { setEditingCustomer(customer); setShowCustomerForm(true); };
    const closeCustomerForm = () => { setShowCustomerForm(false); setEditingCustomer(null); };

    const openReminderModal = (customerId: string | null, reminder?: Reminder) => {
        setActiveReminderCustomerId(customerId);
        setEditingReminder(reminder || null);
        setShowReminderForm(true);
    };
    const closeReminderModal = () => {
        setShowReminderForm(false);
        setEditingReminder(null);
        setActiveReminderCustomerId(null);
    };

    const navItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboardIcon },
        { id: 'reminders', label: 'Nhắc hẹn', icon: BellIcon },
        { id: 'kanban', label: 'Pipeline', icon: KanbanSquareIcon },
        { id: 'list', label: 'Danh sách', icon: ListIcon },
        ...(currentUser?.role === 'admin' ? [
            { id: 'reports', label: 'Báo cáo', icon: FileTextIcon },
            { id: 'settings', label: 'Cài đặt', icon: SettingsIcon }
        ] : [])
    ];
    
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="h-16 border-b flex items-center px-6 flex-shrink-0">
               <BriefcaseIcon className="w-8 h-8 text-indigo-600"/>
               <h1 className="text-xl font-bold ml-3">CRM Sales MG</h1>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileNavOpen(false); }} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition ${activeView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <item.icon className="w-5 h-5 mr-3"/>
                        {item.label}
                    </button>
                ))}
            </nav>
             <div className="p-4 border-t flex-shrink-0">
                 <div className="flex items-center mb-4">
                    <UserCircleIcon className="w-8 h-8 text-gray-400"/>
                    <div className="ml-3">
                        <p className="font-semibold text-sm">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
                    </div>
                 </div>
                <button onClick={logout} className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
                    <LogOutIcon className="w-5 h-5 mr-3"/>
                    Đăng xuất
                </button>
            </div>
        </div>
    );
    
    if (crm.isLoading) {
        return <MainLayoutSkeleton />;
    }

    const renderView = () => {
        const commonProps = {
            addNotification,
            currentUser: currentUser!,
        };

        switch (activeView) {
            case 'dashboard':
                return <Dashboard {...commonProps} customers={crm.dashboardCustomers} statuses={crm.crmData.statuses} reminders={crm.filteredReminders} onEditReminder={(rem) => openReminderModal(rem.customerId, rem)} onToggleComplete={crm.handleToggleReminderComplete} onDeleteReminder={crm.handleDeleteReminder} onOpenCustomer={openEditCustomer} />;
            case 'reminders':
                return <RemindersView {...commonProps} reminders={crm.filteredReminders} customers={crm.dashboardCustomers} onOpenReminderModal={openReminderModal} onToggleComplete={crm.handleToggleReminderComplete} onDelete={crm.handleDeleteReminder} />;
            case 'kanban':
                return <KanbanView {...commonProps} customers={crm.filteredCustomers} statuses={crm.crmData.statuses} reminders={crm.crmData.reminders} onCustomerEdit={openEditCustomer} onCustomerUpdate={crm.handleCustomerUpdate} onDelete={(ids) => setDeleteConfirm({isOpen: true, ids})} onAddInteraction={crm.handleAddInteraction} onDeleteInteraction={crm.handleDeleteInteraction} onGenerateScript={handleGenerateScript} onOpenReminderModal={(id) => openReminderModal(id)} users={crm.users} searchTerm={crm.searchTerm} selectedUserId={crm.selectedUserId} onSelectedUserChange={crm.setSelectedUserId} />;
            case 'list':
                return <ListView {...commonProps} customers={crm.paginatedCustomers} totalCustomers={crm.totalFilteredCustomers} statuses={crm.crmData.statuses} onCustomerEdit={openEditCustomer} onCustomerDelete={(ids) => setDeleteConfirm({isOpen: true, ids})} onGenerateScript={handleGenerateScript} onAddCustomer={openAddCustomer} users={crm.users} selectedUserId={crm.selectedUserId} onSelectedUserChange={crm.setSelectedUserId} searchTerm={crm.searchTerm} selectedCustomerIds={crm.selectedCustomerIds} onToggleSelectCustomer={crm.handleToggleSelectCustomer} onToggleSelectAll={crm.handleToggleSelectAll} sortConfig={crm.sortConfig} handleSort={crm.handleSort} pagination={crm.pagination} setPagination={crm.setPagination} />;
            case 'reports':
                return currentUser?.role === 'admin' ? <ReportsView {...commonProps} crmData={crm.crmData} users={crm.users} /> : null;
            case 'settings':
                return currentUser?.role === 'admin' ? <SettingsPanel {...commonProps} users={crm.users} crmData={crm.crmData} setUsers={crm.setUsers} setCrmData={crm.setCrmData} /> : null;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden lg:block">
                <SidebarContent />
            </aside>
            
            {/* Mobile Sidebar */}
            {isMobileNavOpen && (
                <div className="lg:hidden">
                    <div className="sidebar-mobile-overlay animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
                    <div className={`sidebar-mobile ${isMobileNavOpen ? 'open' : ''}`}>
                        <SidebarContent />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileNavOpen(true)} className="lg:hidden mr-4 p-2 text-gray-600">
                            <MenuIcon />
                        </button>
                         <div className="relative w-64 sm:w-96">
                            <input type="text" placeholder="Tìm kiếm khách hàng..." value={crm.searchTerm} onChange={e => crm.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
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
                   {crm.isLoading ? <ViewSkeleton activeView={activeView} /> : renderView()}
                </main>
            </div>
            
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
    );
};

export default App;