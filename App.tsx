import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import type { User, Customer, Status, CarModel, CustomerSource, Interaction, Reminder, CrmData } from './types';
import { VIETNAM_CITIES, CUSTOMER_TIERS } from './constants';
import { GeminiService } from './services/geminiService';
import { Chart, DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController } from 'chart.js';

// Re-export Role enum here to be self-contained and avoid circular dependencies with types.ts
export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController);


// START: MOCK DATA AND SERVICES
// This section simulates a backend for authentication and data storage.
// It uses localStorage for persistence across page reloads.

const MOCK_USERS: User[] = [
    { id: 'admin01', username: 'admin', password: 'admin', role: Role.ADMIN, name: 'Admin Manager' },
    { id: 'user01', username: 'user', password: 'user', role: Role.USER, name: 'Nguyễn Văn A' },
    { id: 'user02', username: 'user2', password: 'user2', role: Role.USER, name: 'Phạm Thị C' },
];

const generateMockData = (userId: string): CrmData => ({
    statuses: [
        { id: 'status1', name: '1. Khách hàng Mới', color: 'bg-indigo-400', order: 1, type: 'pipeline' },
        { id: 'status2', name: '2. Đã Chăm sóc', color: 'bg-yellow-500', order: 2, type: 'pipeline' },
        { id: 'status3', name: '3. Tiềm năng Cao', color: 'bg-red-600', order: 3, type: 'pipeline' },
        { id: 'status4', name: '4. Đã ký HĐ', color: 'bg-green-600', order: 4, type: 'win' },
        { id: 'status6', name: '5. Đã giao xe', color: 'bg-blue-600', order: 5, type: 'delivered' },
        { id: 'status5', name: '6. Lostsale', color: 'bg-black', order: 6, type: 'lostsale' },
    ],
    carModels: [
        { id: 'model1', name: 'MG ZS' }, { id: 'model2', name: 'MG HS' }, { id: 'model3', name: 'MG RX5' }, { id: 'model4', name: 'MG GT' }
    ],
    customerSources: [
        { id: 'source1', name: 'Facebook' }, { id: 'source2', name: 'Website' }, { id: 'source3', name: 'Showroom' }, { id: 'source4', name: 'Giới thiệu' }, { id: 'source5', name: 'Zalo' }
    ],
    customers: [
        { id: 'cust_1', name: 'Trần Thị B', phone: '0987654321', email: 'b.tran@example.com', carModel: 'MG ZS', source: 'Facebook', statusId: 'status1', city: 'Hà Nội', salesValue: 550000000, tier: 'COLD', createdDate: Date.now() - 86400000 * 5, lastContactDate: Date.now() - 86400000 * 2, interactions: [], userId: userId },
        { id: 'cust_2', name: 'Lê Văn C', phone: '0912345678', email: 'c.le@example.com', carModel: 'MG HS', source: 'Showroom', statusId: 'status3', city: 'TP Hồ Chí Minh', salesValue: 720000000, tier: 'HOT', createdDate: Date.now() - 86400000 * 10, lastContactDate: Date.now() - 86400000 * 1, interactions: [], userId: userId },
    ],
    reminders: [
        { id: 'rem_1', customerId: 'cust_1', userId: userId, title: 'Gọi lại xác nhận lái thử', description: 'Khách hàng hẹn gọi lại sau 2 ngày', dueDate: Date.now() + 86400000, completed: false, priority: 'high' }
    ],
    salesGoals: [],
});

const StorageService = {
    getAllData: async (): Promise<{ users: User[], dataByUser: Record<string, CrmData> } | null> => {
        const stored = localStorage.getItem('crmMultiUser');
        return stored ? JSON.parse(stored) : null;
    },
    saveAllData: async (data: { users: User[], dataByUser: Record<string, CrmData> }): Promise<void> => {
        localStorage.setItem('crmMultiUser', JSON.stringify(data));
    },
    resetData: async (): Promise<void> => {
        if (confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ DỮ LIỆU? Thao tác này không thể hoàn tác.')) {
            localStorage.removeItem('crmMultiUser');
            alert('Đã xóa dữ liệu. Vui lòng tải lại trang.');
            window.location.reload();
        }
    }
};

// END: MOCK DATA AND SERVICES


// START: HELPER FUNCTIONS & AUTH CONTEXT

const formatCurrency = (amount: number | string) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};
const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleDateString('vi-VN') : '---';
const formatDateTime = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '---';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('crmCurrentUser');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (username: string, password: string): boolean => {
        const stored = localStorage.getItem('crmMultiUser');
        // Fallback to MOCK_USERS if local storage is empty
        const allData = stored ? JSON.parse(stored) : { users: MOCK_USERS };
        const usersList: User[] = allData.users;
        
        const user = usersList.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        
        if (user) {
            // Create a user object without the password to store in state and localStorage
            const { password: _, ...userToStore } = user;
            setCurrentUser(userToStore);
            localStorage.setItem('crmCurrentUser', JSON.stringify(userToStore));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('crmCurrentUser');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// END: HELPER FUNCTIONS & AUTH CONTEXT


// START: ICONS - Replaced emoji with SVG for better UI
const Icon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
const BriefcaseIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></Icon>;
const LayoutDashboardIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></Icon>;
const KanbanSquareIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M6 5h12"/><path d="M6 12h12"/><path d="M6 19h12"/></Icon>;
const ListIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></Icon>;
const SettingsIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0 .73 2.73l-.22.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Icon>;
const LogOutIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></Icon>;
const PlusIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></Icon>;
const SearchIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>;
const XIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>;
const PhoneIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
const MailIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Icon>;
const CarIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M14 16.94V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h12v2.94M12 4l4 4H8Z"/><path d="M12 4v4H4"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></Icon>;
const LayersIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
const MapPinIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>;
const DollarSignIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;
const ClockIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
const Edit2Icon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Icon>;
const Trash2Icon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>;
const SparklesIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></Icon>;
const AlertTriangleIcon = ({ className = "w-12 h-12" }) => <Icon className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></Icon>;
const SaveIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Icon>;
const UsersIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const TrendingUpIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Icon>;
const TargetIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>;
const DatabaseIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></Icon>;
const ChevronUpIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="m18 15-6-6-6 6"/></Icon>;
const ChevronDownIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="m6 9 6 6 6-6"/></Icon>;
const RefreshCwIcon = ({ className = "w-6 h-6" }) => <Icon className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></Icon>;
const UserCircleIcon = ({ className = "w-8 h-8" }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="4"/><path d="M12 16c-2.5 0-4.7.9-6.3 2.4"/></Icon>;
const FileTextIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></Icon>;
const DownloadIcon = ({ className = "w-4 h-4" }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></Icon>;
const BellIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>;
const CheckCircleIcon = ({ className = "w-5 h-5" }) => <Icon className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>;

// END: ICONS


// START: REUSABLE UI COMPONENTS

const LoadingSpinner: React.FC = () => (
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
const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, maxWidth = 'max-w-lg' }) => {
    if (!isOpen) return null;
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-start pt-8 sm:pt-16 p-4" onClick={handleBackdropClick}>
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
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => (
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
}
const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, isLoading, script, onClose }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        if (!script) return;
        navigator.clipboard.writeText(script).then(() => {
            setCopySuccess('Đã sao chép!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Sao chép thất bại!');
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
                            {copySuccess && <span className="text-sm text-green-600">{copySuccess}</span>}
                            <button onClick={copyToClipboard} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition">Sao chép</button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

// END: REUSABLE UI COMPONENTS

// START: CRM COMPONENTS

interface InteractionHistoryProps {
    interactions: Interaction[];
    onAddInteraction: (interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (interactionId: string) => void;
    users: User[];
}
const InteractionHistory: React.FC<InteractionHistoryProps> = ({ interactions, onAddInteraction, onDeleteInteraction, users }) => {
    const { currentUser } = useAuth();
    const [newInteraction, setNewInteraction] = useState({ type: 'call', notes: '', duration: 0, outcome: 'neutral' });
    const [isAdding, setIsAdding] = useState(false);

    const interactionTypes = [
        { value: 'call', label: '📞 Cuộc gọi', color: 'bg-green-100 text-green-800' },
        { value: 'email', label: '✉️ Email', color: 'bg-blue-100 text-blue-800' },
        { value: 'meeting', label: '🤝 Gặp mặt', color: 'bg-purple-100 text-purple-800' },
        { value: 'test_drive', label: '🚗 Lái thử', color: 'bg-orange-100 text-orange-800' },
        { value: 'quotation', label: '💰 Báo giá', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'other', label: '📝 Khác', color: 'bg-gray-100 text-gray-800' }
    ];

    const handleAddInteraction = () => {
        if (!newInteraction.notes.trim()) { alert('Vui lòng nhập nội dung tương tác'); return; }
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
                <div className="p-4 border rounded-lg bg-gray-50/70 animate-fade-in-right">
                    <textarea placeholder="Mô tả..." value={newInteraction.notes} onChange={(e) => setNewInteraction(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full p-2 border rounded-lg mb-2" />
                    <div className="grid grid-cols-2 gap-2">
                        <select value={newInteraction.type} onChange={(e) => setNewInteraction(p => ({ ...p, type: e.target.value }))} className="p-2 border rounded-lg">
                            {interactionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                        <select value={newInteraction.outcome} onChange={(e) => setNewInteraction(p => ({ ...p, outcome: e.target.value }))} className="p-2 border rounded-lg">
                            <option value="positive">✅ Tích cực</option>
                            <option value="neutral">⚪ Trung lập</option>
                            <option value="negative">❌ Tiêu cực</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                         <button onClick={() => setIsAdding(false)} className="px-3 py-1 border rounded-lg text-sm">Hủy</button>
                         <button onClick={handleAddInteraction} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm">Lưu</button>
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
                    interactions.sort((a, b) => b.date - a.date).map(interaction => {
                        const typeConfig = interactionTypes.find(t => t.value === interaction.type);
                        const outcomeIcons = { positive: '✅', neutral: '⚪', negative: '❌' };
                        return (
                            <div key={interaction.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${typeConfig?.color}`}>{typeConfig?.label}</span>
                                        <span className="text-xs text-gray-500">{formatDateTime(interaction.date)}</span>
                                    </div>
                                    <button onClick={() => onDeleteInteraction(interaction.id)} className="text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-lg mt-0.5">{outcomeIcons[interaction.outcome]}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800">{interaction.notes}</p>
                                        <p className="text-xs text-gray-400 mt-1">bởi: {getUserName(interaction.userId)}</p>
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


interface CustomerCardProps {
    customer: Customer;
    statuses: Status[];
    reminders: Reminder[];
    onCustomerEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    onStatusChange: (customerId: string, newStatusId: string) => void;
    onAddInteraction: (customerId: string, interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (customerId: string, interactionId: string) => void;
    onGenerateScript: (customer: Customer) => void;
    onOpenReminderModal: (customerId: string) => void;
    users: User[];
}
const CustomerCard: React.FC<CustomerCardProps> = ({ customer, statuses, reminders, onCustomerEdit, onDelete, onStatusChange, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users }) => {
    const [showDetails, setShowDetails] = useState(false);
    const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
    const lastInteraction = useMemo(() => customer.interactions?.length > 0 ? [...customer.interactions].sort((a, b) => b.date - a.date)[0] : null, [customer.interactions]);
    const activeReminder = useMemo(() => reminders.find(r => r.customerId === customer.id && !r.completed), [reminders, customer.id]);

    return (
        <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate pr-2 min-w-0">{customer.name}</h3>
                     <div className="flex items-center space-x-2 flex-shrink-0">
                         {activeReminder && <div className="text-yellow-500" title={`Nhắc hẹn: ${formatDate(activeReminder.dueDate)}`}><BellIcon className="w-4 h-4"/></div>}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tierConfig?.color} border border-current`}>{tierConfig?.value}</span>
                    </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-4"><PhoneIcon className="w-4 h-4 mr-2" />{customer.phone}</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center"><CarIcon className="w-4 h-4 mr-2" /><span>{customer.carModel || '---'}</span></div>
                    <div className="flex items-center"><LayersIcon className="w-4 h-4 mr-2" /><span>{customer.source || '---'}</span></div>
                </div>
                <select value={customer.statusId} onChange={(e) => onStatusChange(customer.id, e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-gray-50">
                    {statuses.sort((a, b) => a.order - b.order).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                </select>
            </div>
            <div className="px-4 pb-4">
                 <button onClick={() => setShowDetails(!showDetails)} className="w-full flex justify-between items-center p-2 text-sm rounded-lg hover:bg-gray-100">
                    <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-2" />Lịch sử ({customer.interactions?.length || 0})</span>
                    {showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {lastInteraction && !showDetails && <p className="mt-1 p-2 text-xs text-gray-500 truncate bg-gray-50 rounded">Cuối: {lastInteraction.notes}</p>}
            </div>

            {showDetails && (
                 <div className="border-t p-4 bg-gray-50/70">
                    <InteractionHistory
                        interactions={customer.interactions || []}
                        onAddInteraction={(interaction) => onAddInteraction(customer.id, interaction)}
                        onDeleteInteraction={(interactionId) => onDeleteInteraction(customer.id, interactionId)}
                        users={users}
                    />
                </div>
            )}
            
            <div className="p-3 border-t bg-gray-50 rounded-b-xl flex justify-end items-center space-x-2">
                <button onClick={() => onOpenReminderModal(customer.id)} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full" title="Đặt lịch hẹn"><BellIcon className="w-5 h-5"/></button>
                <button onClick={() => onGenerateScript(customer)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full" title="Tạo kịch bản chăm sóc AI"><SparklesIcon className="w-5 h-5"/></button>
                <button onClick={() => onCustomerEdit(customer)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" title="Chỉnh sửa"><Edit2Icon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(customer.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
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

const CustomerForm: React.FC<CustomerFormProps> = ({ isOpen, onClose, onSave, customer, statuses, carModels, customerSources }) => {
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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!login(username, password)) {
            setError('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
        }
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
                    <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">
                        Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

const MainLayout: React.FC = () => {
    const { currentUser: user, logout } = useAuth();
    if (!user) return null;

    const [activeView, setActiveView] = useState('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [dataByUser, setDataByUser] = useState<Record<string, CrmData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals state
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customerId: '' });
    const [scriptModal, setScriptModal] = useState({ isOpen: false, script: '', isLoading: false });
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [activeReminderCustomerId, setActiveReminderCustomerId] = useState<string | null>(null);


    // Computed data
    const currentUserData = useMemo(() => dataByUser[user.id] || generateMockData(user.id), [dataByUser, user.id]);
    const allCustomers = useMemo(() => user.role === 'admin' ? Object.values(dataByUser).flatMap(d => d.customers) : currentUserData.customers, [user.role, dataByUser, currentUserData]);
    const allReminders = useMemo(() => user.role === 'admin' ? Object.values(dataByUser).flatMap(d => d.reminders) : currentUserData.reminders, [user.role, dataByUser, currentUserData]);
    
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return allCustomers;
        const term = searchTerm.toLowerCase();
        return allCustomers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
    }, [allCustomers, searchTerm]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        let storedData = await StorageService.getAllData();
        if (!storedData) {
            const initialDataByUser: Record<string, CrmData> = {};
            MOCK_USERS.forEach(u => {
                initialDataByUser[u.id] = generateMockData(u.id);
            });
            storedData = { users: MOCK_USERS, dataByUser: initialDataByUser };
            await StorageService.saveAllData(storedData);
        }
        setDataByUser(storedData.dataByUser);
        setUsers(storedData.users);
        setIsLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const saveData = useCallback(async (newData: { users: User[], dataByUser: Record<string, CrmData> }) => {
        if (!isLoading) {
            await StorageService.saveAllData(newData);
        }
    }, [isLoading]);

    // HANDLERS
    const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'userId' | 'createdDate' | 'lastContactDate' | 'interactions'>, existingCustomerId?: string) => {
        const newDataByUser = { ...dataByUser };
        const newUserData = { ...(newDataByUser[user.id] || generateMockData(user.id)) };
        
        if (existingCustomerId) { // Update
            newUserData.customers = newUserData.customers.map(c => 
                c.id === existingCustomerId 
                ? { ...c, ...customerData, lastContactDate: Date.now() } 
                : c
            );
        } else { // Create
            const newCustomer: Customer = {
                ...customerData,
                id: 'cust_' + Date.now(),
                userId: user.id,
                createdDate: Date.now(),
                lastContactDate: Date.now(),
                interactions: [],
            };
            newUserData.customers = [...newUserData.customers, newCustomer];
        }
        
        newDataByUser[user.id] = newUserData;
        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };

    const handleDeleteCustomer = (customerId: string) => {
        const customer = allCustomers.find(c => c.id === customerId);
        if (!customer) return;

        const newDataByUser = { ...dataByUser };
        const ownerData = { ...newDataByUser[customer.userId] };
        ownerData.customers = ownerData.customers.filter(c => c.id !== customerId);
        // Also delete associated reminders
        ownerData.reminders = ownerData.reminders.filter(r => r.customerId !== customerId);
        newDataByUser[customer.userId] = ownerData;

        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
        setDeleteConfirm({ isOpen: false, customerId: '' });
    };

    const handleCustomerUpdate = (customerId: string, updates: Partial<Customer>) => {
        const customer = allCustomers.find(c => c.id === customerId);
        if (!customer) return;

        const newDataByUser = { ...dataByUser };
        const ownerData = { ...newDataByUser[customer.userId] };
        ownerData.customers = ownerData.customers.map(c => 
            c.id === customerId ? { ...c, ...updates, lastContactDate: Date.now() } : c
        );
        newDataByUser[customer.userId] = ownerData;
        
        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };

    const handleAddInteraction = (customerId: string, interaction: Omit<Interaction, 'id'>) => {
        handleCustomerUpdate(customerId, { 
            interactions: [...(allCustomers.find(c=>c.id === customerId)?.interactions || []), { ...interaction, id: 'int_' + Date.now() }]
        });
    };

    const handleDeleteInteraction = (customerId: string, interactionId: string) => {
        const customer = allCustomers.find(c => c.id === customerId);
        if (!customer) return;
        handleCustomerUpdate(customerId, {
            interactions: (customer.interactions || []).filter(i => i.id !== interactionId)
        });
    };
    
    const handleGenerateScript = async (customer: Customer) => {
        setScriptModal({ isOpen: true, script: '', isLoading: true });
        const script = await GeminiService.generateScript(customer, user.name);
        setScriptModal({ isOpen: true, script, isLoading: false });
    };

    const handleSaveReminder = (reminderData: Omit<Reminder, 'id' | 'userId'>, existingReminderId?: string) => {
        const ownerId = reminderData.customerId ? allCustomers.find(c => c.id === reminderData.customerId)?.userId : user.id;
        if (!ownerId) return;

        const newDataByUser = { ...dataByUser };
        const ownerData = { ...newDataByUser[ownerId] };
        
        if (existingReminderId) { // Update
            ownerData.reminders = ownerData.reminders.map(r => r.id === existingReminderId ? { ...r, ...reminderData } : r);
        } else { // Create
            const newReminder: Reminder = { ...reminderData, id: `rem_${Date.now()}`, userId: ownerId };
            ownerData.reminders = [...ownerData.reminders, newReminder];
        }

        newDataByUser[ownerId] = ownerData;
        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };
    
    const handleDeleteReminder = (reminderId: string) => {
        const reminder = allReminders.find(r => r.id === reminderId);
        if (!reminder) return;

        const newDataByUser = { ...dataByUser };
        const ownerData = { ...newDataByUser[reminder.userId] };
        ownerData.reminders = ownerData.reminders.filter(r => r.id !== reminderId);
        newDataByUser[reminder.userId] = ownerData;
        
        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };

    const handleToggleReminderComplete = (reminderId: string) => {
        const reminder = allReminders.find(r => r.id === reminderId);
        if (!reminder) return;
        
        const newDataByUser = { ...dataByUser };
        const ownerData = { ...newDataByUser[reminder.userId] };
        ownerData.reminders = ownerData.reminders.map(r => r.id === reminderId ? { ...r, completed: !r.completed } : r);
        newDataByUser[reminder.userId] = ownerData;

        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };

    const handleSettingsUpdate = (type: 'carModels' | 'customerSources', data: any[]) => {
        if (user.role !== 'admin') return;
        
        const newDataByUser = { ...dataByUser };
        // Update settings for all users to maintain consistency
        Object.keys(newDataByUser).forEach(userId => {
            newDataByUser[userId] = { ...newDataByUser[userId], [type]: data };
        });

        setDataByUser(newDataByUser);
        saveData({ users, dataByUser: newDataByUser });
    };
    
    const handleUsersUpdate = (updatedUsers: User[]) => {
        if(user.role !== 'admin') return;
        setUsers(updatedUsers);
        
        const newDataByUser = { ...dataByUser };
        updatedUsers.forEach(u => {
            if(!newDataByUser[u.id]) {
                newDataByUser[u.id] = generateMockData(u.id);
            }
        });
        
        // Remove data for deleted users
        const updatedUserIds = new Set(updatedUsers.map(u => u.id));
        Object.keys(newDataByUser).forEach(userId => {
            if (!updatedUserIds.has(userId)) {
                delete newDataByUser[userId];
            }
        });

        setDataByUser(newDataByUser);
        saveData({ users: updatedUsers, dataByUser: newDataByUser });
    };

    // Modal openers/closers
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
        ...(user.role === 'admin' ? [
            { id: 'reports', label: 'Báo cáo', icon: FileTextIcon },
            { id: 'settings', label: 'Cài đặt', icon: SettingsIcon }
        ] : [])
    ];
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    const currentSettingsData = currentUserData;

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
                <div className="h-16 border-b flex items-center px-6">
                   <BriefcaseIcon className="w-8 h-8 text-indigo-600"/>
                   <h1 className="text-xl font-bold ml-3">CRM Sales MG</h1>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition ${activeView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <item.icon className="mr-3"/>
                            {item.label}
                        </button>
                    ))}
                </nav>
                 <div className="p-4 border-t">
                     <div className="flex items-center mb-4">
                        <UserCircleIcon className="w-10 h-10 text-gray-400"/>
                        <div className="ml-3">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                     </div>
                    <button onClick={logout} className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
                        <LogOutIcon className="mr-3"/> Đăng xuất
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
                    <div className="relative w-96">
                        <input type="text" placeholder="Tìm kiếm khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><SearchIcon/></div>
                    </div>
                    <div>
                         <button onClick={openAddCustomer} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center">
                           <PlusIcon className="w-4 h-4 mr-2" /> Thêm KH
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                   {activeView === 'dashboard' && <Dashboard customers={allCustomers} statuses={currentSettingsData.statuses} reminders={allReminders} onEditReminder={(rem) => openReminderModal(rem.customerId, rem)} onToggleComplete={handleToggleReminderComplete} onDeleteReminder={handleDeleteReminder} onOpenCustomer={openEditCustomer} />}
                   {activeView === 'reminders' && <RemindersView reminders={allReminders} customers={allCustomers} onOpenReminderModal={openReminderModal} onToggleComplete={handleToggleReminderComplete} onDelete={handleDeleteReminder} />}
                   {activeView === 'kanban' && <KanbanView customers={filteredCustomers} statuses={currentSettingsData.statuses} reminders={allReminders} onCustomerEdit={openEditCustomer} onCustomerUpdate={handleCustomerUpdate} onDelete={(id) => setDeleteConfirm({isOpen: true, customerId: id})} onAddInteraction={handleAddInteraction} onDeleteInteraction={handleDeleteInteraction} onGenerateScript={handleGenerateScript} onOpenReminderModal={(id) => openReminderModal(id)} users={users} />}
                   {activeView === 'list' && <ListView customers={filteredCustomers} statuses={currentSettingsData.statuses} onCustomerEdit={openEditCustomer} onCustomerDelete={(id) => setDeleteConfirm({isOpen: true, customerId: id})} onGenerateScript={handleGenerateScript} users={users} currentUser={user} />}
                   {activeView === 'reports' && user.role === 'admin' && <ReportsView customers={allCustomers} users={users} statuses={currentSettingsData.statuses} carModels={currentSettingsData.carModels} customerSources={currentSettingsData.customerSources} />}
                   {activeView === 'settings' && user.role === 'admin' && <SettingsPanel users={users} carModels={currentSettingsData.carModels} customerSources={currentSettingsData.customerSources} onUsersUpdate={handleUsersUpdate} onSettingsUpdate={handleSettingsUpdate} onDataReset={StorageService.resetData} />}
                </main>
            </div>
            
            <CustomerForm isOpen={showCustomerForm} onClose={closeCustomerForm} onSave={handleSaveCustomer} customer={editingCustomer} statuses={currentSettingsData.statuses} carModels={currentSettingsData.carModels} customerSources={currentSettingsData.customerSources} />
            <ConfirmationModal isOpen={deleteConfirm.isOpen} title="Xác nhận xóa" message="Bạn có chắc chắn muốn xóa khách hàng này không? Mọi nhắc hẹn liên quan cũng sẽ bị xóa." onConfirm={() => handleDeleteCustomer(deleteConfirm.customerId)} onCancel={() => setDeleteConfirm({ isOpen: false, customerId: '' })} />
            <ScriptModal isOpen={scriptModal.isOpen} isLoading={scriptModal.isLoading} script={scriptModal.script} onClose={() => setScriptModal({isOpen: false, script: '', isLoading: false})} />
            <ReminderFormModal isOpen={showReminderForm} onClose={closeReminderModal} onSave={handleSaveReminder} reminder={editingReminder} customerId={activeReminderCustomerId} customers={allCustomers} />
        </div>
    );
};


// Views and other components that were previously part of the main component

const KanbanView: React.FC<Omit<CustomerCardProps, 'customer' | 'onStatusChange'> & { customers: Customer[], onCustomerUpdate: (id: string, updates: Partial<Customer>) => void }> = ({ customers, statuses, reminders, onCustomerEdit, onCustomerUpdate, onDelete, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users }) => {
    const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
        e.preventDefault();
        if (draggedCustomerId) {
            onCustomerUpdate(draggedCustomerId, { statusId: targetStatusId });
        }
        setDraggedCustomerId(null);
        e.currentTarget.classList.remove('drag-over');
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('drag-over');
    }

    const customersByStatus = useMemo(() => {
        const grouped: Record<string, Customer[]> = {};
        statuses.forEach(status => {
            grouped[status.id] = customers.filter(customer => customer.statusId === status.id);
        });
        return grouped;
    }, [customers, statuses]);

    return (
        <div className="kanban-container overflow-x-auto pb-6">
            <div className="flex space-x-4 min-w-max">
                {statuses.sort((a, b) => a.order - b.order).map(status => (
                    <div key={status.id} className="kanban-column flex-shrink-0 w-80 bg-gray-50 rounded-xl p-3" onDrop={(e) => handleDrop(e, status.id)} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                         <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-semibold flex items-center text-gray-800">
                                <span className={`w-3 h-3 rounded-full ${status.color} mr-2`}></span>
                                {status.name}
                            </h3>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{customersByStatus[status.id]?.length || 0}</span>
                        </div>
                        <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1">
                            {customersByStatus[status.id]?.map(customer => (
                                <div key={customer.id} draggable onDragStart={() => setDraggedCustomerId(customer.id)}>
                                    <CustomerCard 
                                        customer={customer} 
                                        statuses={statuses}
                                        reminders={reminders}
                                        onCustomerEdit={onCustomerEdit} 
                                        onDelete={onDelete} 
                                        onStatusChange={(customerId, newStatusId) => onCustomerUpdate(customerId, {statusId: newStatusId})}
                                        onAddInteraction={onAddInteraction}
                                        onDeleteInteraction={onDeleteInteraction}
                                        onGenerateScript={onGenerateScript}
                                        onOpenReminderModal={onOpenReminderModal}
                                        users={users}
                                    />
                                </div>
                            ))}
                            {(!customersByStatus[status.id] || customersByStatus[status.id].length === 0) && (
                                 <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                     <p className="text-sm">Kéo thả khách hàng vào đây</p>
                                 </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ListView: React.FC<{customers: Customer[], statuses: Status[], onCustomerEdit: (c: Customer) => void, onCustomerDelete: (id: string) => void, onGenerateScript: (c: Customer) => void, users: User[], currentUser: User}> = ({customers, statuses, onCustomerEdit, onCustomerDelete, onGenerateScript, users, currentUser}) => {
    const [sortField, setSortField] = useState<keyof Customer | 'userId'>('lastContactDate');
    const [sortDirection, setSortDirection] = useState('desc');

    const allPossibleColumns = useMemo(() => [
        { key: 'name', label: 'Khách hàng' },
        { key: 'phone', label: 'Liên hệ' },
        { key: 'carModel', label: 'Dòng xe' },
        { key: 'source', label: 'Nguồn' },
        { key: 'statusId', label: 'Trạng thái' },
        { key: 'tier', label: 'Phân loại' },
        { key: 'salesValue', label: 'Giá trị' },
        ...(currentUser.role === 'admin' ? [{ key: 'userId', label: 'Nhân viên' }] : []),
        { key: 'lastContactDate', label: 'L.Hệ cuối' },
        { key: 'createdDate', label: 'Ngày tạo' },
    ], [currentUser.role]);

    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(['name', 'phone', 'statusId', 'salesValue', 'lastContactDate', ...(currentUser.role === 'admin' ? ['userId'] : [])])
    );
    
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const columnSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
                setShowColumnSelector(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortedCustomers = useMemo(() => {
        return [...customers].sort((a, b) => {
            const aVal = a[sortField as keyof Customer];
            const bVal = b[sortField as keyof Customer];
            if(aVal === bVal) return 0;
            
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return (aVal - bVal) * direction;
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal) * direction;
            }
            return (aVal > bVal ? 1 : -1) * direction;
        });
    }, [customers, sortField, sortDirection]);

    const handleSort = (field: keyof Customer | 'userId') => {
        if (field === sortField) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };
    
    const handleColumnToggle = (columnKey: string) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnKey)) {
                if (newSet.size > 1) { 
                    newSet.delete(columnKey);
                }
            } else {
                newSet.add(columnKey);
            }
            return newSet;
        });
    };

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
    
    const renderCellContent = (customer: Customer, columnKey: string) => {
        switch (columnKey) {
            case 'name':
                return (
                    <>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.carModel || 'Chưa rõ xe'}</div>
                    </>
                );
            case 'phone':
                return (
                    <>
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[150px]">{customer.email}</div>
                    </>
                );
            case 'statusId':
                const status = statuses.find(s => s.id === customer.statusId);
                return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status?.color} text-white`}>{status?.name || '---'}</span>;
            case 'salesValue':
                return <span className="text-sm text-green-600 font-semibold">{formatCurrency(customer.salesValue)}</span>;
            case 'userId':
                 return <span className="text-sm text-gray-500">{getUserName(customer.userId)}</span>;
            case 'lastContactDate':
                return <span className="text-sm text-gray-500">{formatDate(customer.lastContactDate)}</span>;
            case 'createdDate':
                return <span className="text-sm text-gray-500">{formatDate(customer.createdDate)}</span>;
            case 'carModel':
                return <span className="text-sm text-gray-500">{customer.carModel || '---'}</span>;
            case 'source':
                return <span className="text-sm text-gray-500">{customer.source || '---'}</span>;
            case 'tier':
                const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
                return <span className={`text-sm font-semibold ${tierConfig?.color}`}>{tierConfig?.value}</span>;
            default:
                return null;
        }
    };
    
    const columnsToRender = allPossibleColumns.filter(col => visibleColumns.has(col.key));

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
             <div className="p-4 border-b flex justify-end">
                <div className="relative" ref={columnSelectorRef}>
                    <button onClick={() => setShowColumnSelector(prev => !prev)} className="px-3 py-1.5 border rounded-lg text-sm flex items-center text-gray-600 hover:bg-gray-100">
                        <SettingsIcon className="w-4 h-4 mr-2"/> Tùy chỉnh cột
                    </button>
                    {showColumnSelector && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-10 p-2">
                            <p className="text-xs text-gray-500 px-2 pb-2 border-b">Chọn cột để hiển thị</p>
                            <div className="mt-2 space-y-1">
                                {allPossibleColumns.map(col => (
                                    <label key={col.key} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={visibleColumns.has(col.key)}
                                            onChange={() => handleColumnToggle(col.key)}
                                        />
                                        <span className="text-sm text-gray-700">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columnsToRender.map(col => (
                                <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort(col.key as keyof Customer | 'userId')}>
                                    <div className="flex items-center">
                                        {col.label}
                                        {sortField === col.key && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedCustomers.length > 0 && sortedCustomers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                {columnsToRender.map(col => (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                        {renderCellContent(customer, col.key)}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-3">
                                        <button onClick={() => onGenerateScript(customer)} className="text-indigo-600 hover:text-indigo-900" title="Tạo kịch bản AI"><SparklesIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onCustomerEdit(customer)} className="text-gray-500 hover:text-gray-800" title="Sửa"><Edit2Icon className="w-5 h-5"/></button>
                                        <button onClick={() => onCustomerDelete(customer.id)} className="text-red-600 hover:text-red-900" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                            )
                        )}
                    </tbody>
                </table>
                {sortedCustomers.length === 0 && (
                     <div className="text-center p-8 text-gray-500">Không tìm thấy khách hàng nào.</div>
                )}
            </div>
        </div>
    )
}

const Dashboard: React.FC<{customers: Customer[], statuses: Status[], reminders: Reminder[], onEditReminder: (rem: Reminder) => void, onToggleComplete: (id: string) => void, onDeleteReminder: (id: string) => void, onOpenCustomer: (customer: Customer) => void }> = ({customers, statuses, reminders, ...reminderHandlers}) => {
    const metrics = useMemo(() => {
        const deliveredCustomers = customers.filter(c => statuses.find(s => s.id === c.statusId)?.type === 'delivered');
        const totalRevenue = deliveredCustomers.reduce((sum, c) => sum + c.salesValue, 0);
        const potentialCustomers = customers.filter(c => !['delivered', 'lostsale'].includes(statuses.find(s => s.id === c.statusId)?.type || ''));
        const totalDeals = customers.filter(c => !['lostsale'].includes(statuses.find(s => s.id === c.statusId)?.type || '')).length;
        const conversionRate = totalDeals > 0 ? (deliveredCustomers.length / totalDeals) * 100 : 0;
        
        return {
            totalCustomers: customers.length,
            totalRevenue,
            conversionRate: Math.round(conversionRate),
            deliveredCount: deliveredCustomers.length,
            potentialCount: potentialCustomers.length,
            tierDistribution: CUSTOMER_TIERS.map(tier => ({ label: tier.label, count: customers.filter(c => c.tier === tier.value).length, color: tier.color })),
            statusDistribution: statuses.map(status => ({ name: status.name, count: customers.filter(c => c.statusId === status.id).length, color: status.color})),
        }
    }, [customers, statuses]);

    const tierChartRef = useRef<HTMLCanvasElement>(null);
    const statusChartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const charts: Chart[] = [];
        if (tierChartRef.current) {
            const chart = new Chart(tierChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: metrics.tierDistribution.map(t => t.label.split(' - ')[0]),
                    datasets: [{ data: metrics.tierDistribution.map(t => t.count), backgroundColor: ['#DC2626', '#D97706', '#4F46E5', '#6B7280'] }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });
            charts.push(chart);
        }
        if (statusChartRef.current) {
             const chart = new Chart(statusChartRef.current, {
                type: 'bar',
                data: {
                    labels: metrics.statusDistribution.map(s => s.name.substring(3)),
                    datasets: [{ label: 'Số lượng KH', data: metrics.statusDistribution.map(s => s.count), backgroundColor: '#4f46e5', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
            charts.push(chart);
        }
        return () => charts.forEach(c => c.destroy());
    }, [metrics]);

    const MetricCard: React.FC<{title:string, value: string | number, subtitle: string, icon: React.ReactNode, color: string}> = ({title, value, subtitle, icon, color}) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>{icon}</div>
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <MetricCard title="Doanh số" value={formatCurrency(metrics.totalRevenue)} subtitle={`${metrics.deliveredCount} xe đã giao`} icon={<DollarSignIcon />} color="green" />
                 <MetricCard title="Tỷ lệ Chốt" value={`${metrics.conversionRate}%`} subtitle={`${metrics.deliveredCount}/${metrics.deliveredCount+metrics.potentialCount} deals`} icon={<TargetIcon />} color="blue" />
                 <MetricCard title="Tổng Khách hàng" value={metrics.totalCustomers} subtitle="trong hệ thống" icon={<UsersIcon />} color="indigo" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm border">
                    <UpcomingRemindersWidget reminders={reminders} customers={customers} {...reminderHandlers} />
                </div>
                 <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
                     <h3 className="text-lg font-semibold mb-4">Khách hàng theo Phân loại</h3>
                     <div className="chart-container"><canvas ref={tierChartRef}></canvas></div>
                </div>
            </div>
             <div className="bg-white rounded-xl p-6 shadow-sm border">
                 <h3 className="text-lg font-semibold mb-4">Khách hàng theo Trạng thái</h3>
                 <div className="chart-container"><canvas ref={statusChartRef}></canvas></div>
            </div>
        </div>
    )
}

const ReportsView: React.FC<{customers: Customer[], users: User[], statuses: Status[], carModels: CarModel[], customerSources: CustomerSource[]}> = ({ customers, users, statuses, carModels, customerSources }) => {
    const [period, setPeriod] = useState('all');

    const filteredCustomers = useMemo(() => {
        if (period === 'all') return customers;
        const days = parseInt(period, 10);
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return customers.filter(c => c.createdDate >= cutoff);
    }, [customers, period]);

    const salesByUser = useMemo(() => {
        return users.map(user => {
            const userCustomers = filteredCustomers.filter(c => c.userId === user.id);
            const delivered = userCustomers.filter(c => statuses.find(s => s.id === c.statusId)?.type === 'delivered');
            const revenue = delivered.reduce((sum, c) => sum + c.salesValue, 0);
            return {
                'Nhân viên': user.name,
                'Số KH quản lý': userCustomers.length,
                'Số xe đã giao': delivered.length,
                'Doanh số': formatCurrency(revenue),
                'rawRevenue': revenue
            };
        }).sort((a,b) => b.rawRevenue - a.rawRevenue);
    }, [filteredCustomers, users, statuses]);

    const acquisitionBySource = useMemo(() => {
        const total = filteredCustomers.length;
        if (total === 0) return [];
        return customerSources.map(source => {
            const count = filteredCustomers.filter(c => c.source === source.name).length;
            return {
                'Nguồn': source.name,
                'Số lượng KH': count,
                'Tỷ lệ (%)': ((count / total) * 100).toFixed(1)
            };
        }).sort((a,b) => b['Số lượng KH'] - a['Số lượng KH']);
    }, [filteredCustomers, customerSources]);

    const salesByCarModel = useMemo(() => {
        const deliveredCustomers = filteredCustomers.filter(c => statuses.find(s => s.id === c.statusId)?.type === 'delivered');
        return carModels.map(model => {
            const modelSales = deliveredCustomers.filter(c => c.carModel === model.name);
            const revenue = modelSales.reduce((sum, c) => sum + c.salesValue, 0);
            return {
                'Dòng xe': model.name,
                'Số xe đã giao': modelSales.length,
                'Doanh số': formatCurrency(revenue),
                'rawRevenue': revenue
            };
        }).sort((a,b) => b.rawRevenue - a.rawRevenue);
    }, [filteredCustomers, carModels, statuses]);

    const exportToCsv = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("Không có dữ liệu để xuất.");
            return;
        }
        
        // Remove raw data columns before exporting
        const dataToExport = data.map(row => {
            const { rawRevenue, ...rest } = row;
            return rest;
        });

        const headers = Object.keys(dataToExport[0]);
        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => 
                headers.map(fieldName => {
                    let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
                    cell = cell.replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(',')
            )
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ReportSection: React.FC<{title: string, data: any[], onExport: () => void}> = ({ title, data, onExport }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button onClick={onExport} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center">
                    <DownloadIcon className="w-4 h-4 mr-2"/> Xuất CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                {data.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>{Object.keys(data[0]).filter(k => k !== 'rawRevenue').map(key => <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>)}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, index) => <tr key={index} className="hover:bg-gray-50">{Object.keys(row).filter(k => k !== 'rawRevenue').map(key => <td key={key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row[key]}</td>)}</tr>)}
                    </tbody>
                </table>
                ) : <p className="text-center text-gray-500 py-8">Không có dữ liệu</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Báo cáo Hiệu suất</h2>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="p-2 border rounded-lg bg-white">
                    <option value="all">Toàn thời gian</option>
                    <option value="7">7 ngày qua</option>
                    <option value="30">30 ngày qua</option>
                    <option value="90">90 ngày qua</option>
                </select>
            </div>
            <ReportSection title="Hiệu suất theo Nhân viên" data={salesByUser} onExport={() => exportToCsv(salesByUser, 'hieu_suat_nhan_vien.csv')} />
            <ReportSection title="Phân tích Nguồn khách hàng" data={acquisitionBySource} onExport={() => exportToCsv(acquisitionBySource, 'nguon_khach_hang.csv')} />
            <ReportSection title="Doanh số theo Dòng xe" data={salesByCarModel} onExport={() => exportToCsv(salesByCarModel, 'doanh_so_dong_xe.csv')} />
        </div>
    );
};

const SettingsPanel: React.FC<{users: User[], carModels: CarModel[], customerSources: CustomerSource[], onUsersUpdate: (u: User[])=>void, onSettingsUpdate: (type: 'carModels' | 'customerSources', data: any[]) => void, onDataReset: ()=>void}> = ({users, carModels, customerSources, onUsersUpdate, onSettingsUpdate, onDataReset}) => {
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newCarModel, setNewCarModel] = useState('');
    const [newSource, setNewSource] = useState('');
    
    const handleAdd = (type: 'carModels' | 'customerSources') => {
        const name = type === 'carModels' ? newCarModel : newSource;
        if(!name.trim()) return;
        const current = type === 'carModels' ? carModels : customerSources;
        const newItem = { id: `${type.slice(0, -1)}_${Date.now()}`, name };
        onSettingsUpdate(type, [...current, newItem]);
        type === 'carModels' ? setNewCarModel('') : setNewSource('');
    };

    const handleDelete = (type: 'carModels' | 'customerSources', id: string) => {
        const current = type === 'carModels' ? carModels : customerSources;
        if(current.length <=1) { alert("Phải có ít nhất 1 mục."); return; }
        onSettingsUpdate(type, current.filter(item => item.id !== id));
    };

    const openUserModal = (user: User | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (user: Omit<User, 'id' | 'role'>) => {
        if (editingUser) { // Update
            onUsersUpdate(users.map(u => u.id === editingUser.id ? { ...u, ...user } : u));
        } else { // Create
            const newUser: User = { ...user, id: `user_${Date.now()}`, role: Role.USER };
            onUsersUpdate([...users, newUser]);
        }
    };
    
    const handleDeleteUser = (id: string) => {
        if(users.filter(u => u.role === 'user').length <=1) {
            alert("Phải có ít nhất một user."); return;
        }
        if(confirm("Bạn có chắc muốn xóa user này? Dữ liệu của họ sẽ bị xóa vĩnh viễn.")) {
            onUsersUpdate(users.filter(u => u.id !== id));
        }
    };

    return (
    <>
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Quản lý Tài khoản</h2>
                    <button onClick={() => openUserModal(null)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center text-sm">
                        <PlusIcon className="w-4 h-4 mr-2"/> Thêm User
                    </button>
                </div>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                            <div>
                                <p className="font-semibold">{user.name} <span className="text-sm font-normal text-gray-500">({user.username})</span></p>
                                <p className="text-xs capitalize p-1 bg-gray-200 rounded inline-block">{user.role}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => openUserModal(user)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" title="Sửa"><Edit2Icon className="w-5 h-5"/></button>
                                {user.role !== 'admin' && <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Dòng xe</h3>
                    <div className="flex space-x-2 mb-4">
                        <input value={newCarModel} onChange={e => setNewCarModel(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Tên dòng xe..."/>
                        <button onClick={() => handleAdd('carModels')} className="px-3 bg-green-500 text-white rounded-lg">Thêm</button>
                    </div>
                     <div className="space-y-2">
                         {carModels.map(m => <div key={m.id} className="flex justify-between items-center p-2 border-b"><p>{m.name}</p><button onClick={()=>handleDelete('carModels', m.id)} className="text-red-500"><XIcon className="w-4 h-4"/></button></div>)}
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Nguồn khách hàng</h3>
                     <div className="flex space-x-2 mb-4">
                        <input value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Tên nguồn..."/>
                        <button onClick={() => handleAdd('customerSources')} className="px-3 bg-green-500 text-white rounded-lg">Thêm</button>
                    </div>
                     <div className="space-y-2">
                         {customerSources.map(s => <div key={s.id} className="flex justify-between items-center p-2 border-b"><p>{s.name}</p><button onClick={()=>handleDelete('customerSources', s.id)} className="text-red-500"><XIcon className="w-4 h-4"/></button></div>)}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                 <h3 className="text-lg font-semibold text-red-700 mb-2">Vùng nguy hiểm</h3>
                 <p className="text-sm text-gray-600 mb-4">Hành động này sẽ xóa toàn bộ dữ liệu CRM (khách hàng, tương tác, v.v.) của tất cả người dùng. Không thể hoàn tác.</p>
                 <button onClick={onDataReset} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center">
                    <AlertTriangleIcon className="w-4 h-4 mr-2"/> Xóa toàn bộ dữ liệu
                </button>
            </div>
        </div>
        <UserFormModal 
            isOpen={isUserModalOpen} 
            onClose={() => setIsUserModalOpen(false)}
            onSave={handleSaveUser}
            user={editingUser}
            allUsers={users}
        />
    </>
    );
};

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id' | 'role'>) => void;
    user: User | null;
    allUsers: User[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, allUsers }) => {
    const [formData, setFormData] = useState({ name: '', username: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({ name: user.name, username: user.username, password: '', confirmPassword: '' });
            } else {
                setFormData({ name: '', username: '', password: '', confirmPassword: '' });
            }
            setErrors({});
        }
    }, [user, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Tên không được để trống";
        if (!formData.username.trim()) {
            newErrors.username = "Username không được để trống";
        } else if (allUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== user?.id)) {
            newErrors.username = "Username đã tồn tại";
        }

        // Password is required for new users.
        // For existing users, password fields are only validated if a new password is entered.
        if (!user || formData.password || formData.confirmPassword) {
            if (!formData.password) {
                newErrors.password = "Mật khẩu không được để trống";
            } else if (formData.password.length < 4) {
                newErrors.password = "Mật khẩu phải có ít nhất 4 ký tự.";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        // Prepare the data to be saved.
        const userToSave: Omit<User, 'id' | 'role'> = {
            name: formData.name,
            username: formData.username,
            // If a new password is provided, use it.
            // Otherwise, for an existing user, keep their current password.
            // For a new user, the password from the form is used (validation ensures it's not empty).
            password: formData.password ? formData.password : user?.password,
        };
        
        onSave(userToSave);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title={user ? "Chỉnh sửa User" : "Thêm User mới"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tên hiển thị *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username (dùng để đăng nhập) *</label>
                    <input type="text" value={formData.username} onChange={e => setFormData(p => ({...p, username: e.target.value}))} className={`w-full p-2 border rounded-lg ${errors.username ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu {user ? '(Để trống nếu không đổi)' : '*'}</label>
                    <input type="password" value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))} className={`w-full p-2 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Xác nhận Mật khẩu {user ? '' : '*'}</label>
                    <input type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({...p, confirmPassword: e.target.value}))} className={`w-full p-2 border rounded-lg ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" /> Lưu
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ReminderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reminder: Omit<Reminder, 'id' | 'userId'>, id?: string) => void;
    reminder: Reminder | null;
    customerId: string | null;
    customers: Customer[];
}
const ReminderFormModal: React.FC<ReminderFormModalProps> = ({ isOpen, onClose, onSave, reminder, customerId, customers }) => {
    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', priority: 'medium' as Reminder['priority'], customerId: '' });
    useEffect(() => {
        if (isOpen) {
            if (reminder) {
                setFormData({
                    title: reminder.title,
                    description: reminder.description,
                    dueDate: new Date(reminder.dueDate).toISOString().split('T')[0],
                    priority: reminder.priority,
                    customerId: reminder.customerId,
                });
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFormData({
                    title: '',
                    description: '',
                    dueDate: tomorrow.toISOString().split('T')[0],
                    priority: 'medium',
                    customerId: customerId || '',
                });
            }
        }
    }, [isOpen, reminder, customerId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.dueDate) {
            alert("Vui lòng nhập tiêu đề và ngày hẹn.");
            return;
        }
        onSave({
            ...formData,
            dueDate: new Date(formData.dueDate).getTime(),
            completed: reminder?.completed || false,
        }, reminder?.id);
        onClose();
    };
    return (
        <Modal isOpen={isOpen} title={reminder ? "Sửa Nhắc hẹn" : "Thêm Nhắc hẹn"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full p-2 border rounded-lg border-gray-300" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                    <select value={formData.customerId} onChange={e => setFormData(p => ({ ...p, customerId: e.target.value }))} className="w-full p-2 border rounded-lg border-gray-300" disabled={!!customerId}>
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày hẹn *</label>
                        <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} className="w-full p-2 border rounded-lg border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ưu tiên</label>
                        <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value as Reminder['priority'] }))} className="w-full p-2 border rounded-lg border-gray-300">
                            <option value="high">Cao</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Thấp</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                    <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full p-2 border rounded-lg border-gray-300" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" /> Lưu
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const RemindersView: React.FC<{ reminders: Reminder[], customers: Customer[], onOpenReminderModal: (customerId: string | null, reminder?: Reminder) => void, onToggleComplete: (id: string) => void, onDelete: (id: string) => void }> = ({ reminders, customers, onOpenReminderModal, onToggleComplete, onDelete }) => {
    
    const { upcoming, overdue, today, thisWeek } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfTomorrow = startOfToday + 86400000;
        const endOfWeek = startOfTomorrow + (6 - now.getDay()) * 86400000;
        
        const activeReminders = reminders.filter(r => !r.completed).sort((a,b) => a.dueDate - b.dueDate);

        return {
            overdue: activeReminders.filter(r => r.dueDate < startOfToday),
            today: activeReminders.filter(r => r.dueDate >= startOfToday && r.dueDate < startOfTomorrow),
            thisWeek: activeReminders.filter(r => r.dueDate >= startOfTomorrow && r.dueDate < endOfWeek),
            upcoming: activeReminders.filter(r => r.dueDate >= endOfWeek),
        };
    }, [reminders]);

    const ReminderSection: React.FC<{title: string, reminders: Reminder[], colorClass: string}> = ({title, reminders, colorClass}) => {
        if (reminders.length === 0) return null;
        return (
            <div>
                <h3 className={`text-lg font-semibold mb-3 ${colorClass}`}>{title} ({reminders.length})</h3>
                <div className="space-y-3">
                    {reminders.map(rem => <ReminderItem key={rem.id} reminder={rem} customer={customers.find(c => c.id === rem.customerId)} onEdit={() => onOpenReminderModal(rem.customerId, rem)} onToggleComplete={() => onToggleComplete(rem.id)} onDelete={() => onDelete(rem.id)} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhắc hẹn</h2>
                <button onClick={() => onOpenReminderModal(null)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center">
                    <PlusIcon className="w-4 h-4 mr-2"/> Thêm Nhắc hẹn
                </button>
            </div>

            {reminders.filter(r => !r.completed).length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                    <h3 className="mt-4 text-xl font-semibold">Tuyệt vời!</h3>
                    <p className="text-gray-500 mt-1">Bạn không có nhắc hẹn nào cần hoàn thành.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <ReminderSection title="Quá hạn" reminders={overdue} colorClass="text-red-600" />
                    <ReminderSection title="Hôm nay" reminders={today} colorClass="text-blue-600" />
                    <ReminderSection title="Tuần này" reminders={thisWeek} colorClass="text-yellow-600" />
                    <ReminderSection title="Sắp tới" reminders={upcoming} colorClass="text-gray-600" />
                </div>
            )}
        </div>
    );
};

const ReminderItem: React.FC<{ 
    reminder: Reminder, 
    customer?: Customer, 
    onEdit: ()=>void, 
    onToggleComplete: ()=>void, 
    onDelete: ()=>void,
    onCustomerClick?: (customer: Customer) => void 
}> = ({ reminder, customer, onEdit, onToggleComplete, onDelete, onCustomerClick }) => {
    const priorityClasses: Record<Reminder['priority'], string> = {
        high: 'border-red-500',
        medium: 'border-yellow-500',
        low: 'border-gray-300'
    };
    
    const handleCustomerClick = () => {
        if (customer && onCustomerClick) {
            onCustomerClick(customer);
        }
    };

    return (
        <div className={`p-4 bg-white rounded-lg border-l-4 ${priorityClasses[reminder.priority]} shadow-sm flex items-center justify-between transition-all hover:shadow-md`}>
            <div className="flex items-center flex-1 min-w-0">
                <button onClick={onToggleComplete} className="mr-4 text-gray-400 hover:text-green-500 flex-shrink-0"><CheckCircleIcon className="w-6 h-6"/></button>
                <div className="flex-1 min-w-0">
                    <p
                        className="font-semibold text-gray-800 truncate"
                        title={reminder.title}
                    >
                        {reminder.title}
                    </p>
                    {customer && (
                        <p
                            className="text-sm text-indigo-600 truncate cursor-pointer hover:underline"
                            onClick={handleCustomerClick}
                        >
                            {customer.name}
                        </p>
                    )}
                    <p className="text-sm text-gray-500">{formatDate(reminder.dueDate)}</p>
                </div>
            </div>
             <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button onClick={onEdit} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" title="Sửa"><Edit2Icon className="w-4 h-4"/></button>
                <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Xóa"><Trash2Icon className="w-4 h-4"/></button>
            </div>
        </div>
    );
};

const UpcomingRemindersWidget: React.FC<{reminders: Reminder[], customers: Customer[], onEditReminder: (rem: Reminder) => void, onToggleComplete: (id: string) => void, onDeleteReminder: (id: string) => void, onOpenCustomer: (customer: Customer) => void}> = ({reminders, customers, onEditReminder, onToggleComplete, onDeleteReminder, onOpenCustomer}) => {
    const upcoming = useMemo(() => {
        return reminders.filter(r => !r.completed).sort((a,b) => a.dueDate - b.dueDate).slice(0, 5);
    }, [reminders]);

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Nhắc hẹn Sắp tới</h3>
            {upcoming.length === 0 ? <p className="text-gray-500 py-8 text-center">Không có nhắc hẹn nào.</p> : (
                <div className="space-y-3">
                    {upcoming.map(rem => {
                        const customer = customers.find(c => c.id === rem.customerId);
                        return <ReminderItem 
                            key={rem.id} 
                            reminder={rem} 
                            customer={customer} 
                            onEdit={() => onEditReminder(rem)} 
                            onToggleComplete={() => onToggleComplete(rem.id)} 
                            onDelete={() => onDeleteReminder(rem.id)}
                            onCustomerClick={onOpenCustomer}
                        />
                    })}
                </div>
            )}
        </div>
    )
}

export default App;
