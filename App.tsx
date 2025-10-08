import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { Role, type User, type Customer, type Status, type CarModel, type CustomerSource, type Interaction, type Reminder, type CrmData } from './types';
import { VIETNAM_CITIES, CUSTOMER_TIERS } from './constants';
import { GeminiService } from './services/geminiService';
import { Chart, DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController, LineController, PointElement, LineElement } from 'chart.js';

// Firebase Imports
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, writeBatch, query, where, documentId } from 'firebase/firestore';


// Register Chart.js components
Chart.register(DoughnutController, ArcElement, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PieController, LineController, PointElement, LineElement);


// START: MOCK DATA FOR SEEDING
const MOCK_USERS_SEED: Omit<User, 'id'>[] = [
    { username: 'admin', password: 'admin', role: Role.ADMIN, name: 'Admin Manager' },
    { username: 'user', password: 'user', role: Role.USER, name: 'Nguyễn Văn A' },
    { username: 'user2', password: 'user2', role: Role.USER, name: 'Phạm Thị C' },
];

const MOCK_INITIAL_DATA: Omit<CrmData, 'customers' | 'reminders' | 'salesGoals'> = {
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
};
// END: MOCK DATA FOR SEEDING


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
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    // This case might happen if user doc creation failed or was deleted.
                    // For robustness, you could try to recreate it or sign the user out.
                    console.error("User document not found in Firestore for UID:", firebaseUser.uid);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // Firebase Auth uses email for login. We'll map username to a dummy email.
            await signInWithEmailAndPassword(auth, `${username.toLowerCase()}@crm.app`, password);
            return true;
        } catch (error) {
            console.error("Firebase login error:", error);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    // FIX: Corrected typo in the closing tag of AuthContext.Provider.
    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// END: HELPER FUNCTIONS & AUTH CONTEXT


// START: ICONS
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
    customer: Customer;
    onAddInteraction: (interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (interactionId: string) => void;
    users: User[];
}
const InteractionHistory: React.FC<InteractionHistoryProps> = ({ customer, onAddInteraction, onDeleteInteraction, users }) => {
    const { currentUser } = useAuth();
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

    const handleGenerateScript = async () => {
        if (!currentUser) return;
        setIsGeneratingScript(true);
        try {
            const script = await GeminiService.generateScript(customer, currentUser.name);
            setNewInteraction(prev => ({ ...prev, notes: script }));
        } catch (error) {
            console.error("Failed to generate script", error);
            alert("Không thể tạo kịch bản. Vui lòng thử lại.");
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
                    <textarea placeholder="Mô tả nội dung tương tác..." value={newInteraction.notes} onChange={(e) => setNewInteraction(p => ({ ...p, notes: e.target.value }))} rows={5} className="w-full p-2 border rounded-lg" />
                    <div className="flex justify-between items-center gap-2">
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
                        <div className="flex-grow grid grid-cols-2 gap-2">
                            <select value={newInteraction.type} onChange={(e) => setNewInteraction(p => ({ ...p, type: e.target.value }))} className="p-2 border rounded-lg w-full">
                                {interactionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                            <select value={newInteraction.outcome} onChange={(e) => setNewInteraction(p => ({ ...p, outcome: e.target.value }))} className="p-2 border rounded-lg w-full">
                                <option value="positive">✅ Tích cực</option>
                                <option value="neutral">⚪ Trung lập</option>
                                <option value="negative">❌ Tiêu cực</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
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

const Highlight: React.FC<{ text: string | undefined; highlight: string }> = ({ text, highlight }) => {
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
                regex.test(part) ? (
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
    onDelete: (customerId: string) => void;
    onStatusChange: (customerId: string, newStatusId: string) => void;
    onAddInteraction: (customerId: string, interaction: Omit<Interaction, 'id'>) => void;
    onDeleteInteraction: (customerId: string, interactionId: string) => void;
    onGenerateScript: (customer: Customer) => void;
    onOpenReminderModal: (customerId: string) => void;
    users: User[];
    searchTerm?: string;
}
const CustomerCard: React.FC<CustomerCardProps> = ({ customer, statuses, reminders, onCustomerEdit, onDelete, onStatusChange, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users, searchTerm = '' }) => {
    const [showDetails, setShowDetails] = useState(false);
    const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
    const lastInteraction = useMemo(() => customer.interactions?.length > 0 ? [...customer.interactions].sort((a, b) => b.date - a.date)[0] : null, [customer.interactions]);
    const activeReminder = useMemo(() => reminders.find(r => r.customerId === customer.id && !r.completed), [reminders, customer.id]);

    return (
        <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
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
                        customer={customer}
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (!success) {
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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');

    // Firestore real-time data
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [settings, setSettings] = useState<Omit<CrmData, 'customers' | 'reminders' | 'salesGoals'>>({ statuses: [], carModels: [], customerSources: [] });
    const [isLoading, setIsLoading] = useState(true);
    
    // Modals state
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customerId: '' });
    const [scriptModal, setScriptModal] = useState({ isOpen: false, script: '', isLoading: false });
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [activeReminderCustomerId, setActiveReminderCustomerId] = useState<string | null>(null);

    // Set up real-time listeners for Firestore data
    useEffect(() => {
        setIsLoading(true);
        const unsubscribes: (() => void)[] = [];

        // Users listener
        unsubscribes.push(onSnapshot(collection(db, "users"), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        }));
        
        // Settings listeners
        unsubscribes.push(onSnapshot(collection(db, "settings", "config", "statuses"), (snapshot) => {
            setSettings(s => ({...s, statuses: snapshot.docs.map(doc => doc.data() as Status)}));
        }));
        unsubscribes.push(onSnapshot(collection(db, "settings", "config", "carModels"), (snapshot) => {
            setSettings(s => ({...s, carModels: snapshot.docs.map(doc => doc.data() as CarModel)}));
        }));
        unsubscribes.push(onSnapshot(collection(db, "settings", "config", "customerSources"), (snapshot) => {
            setSettings(s => ({...s, customerSources: snapshot.docs.map(doc => doc.data() as CustomerSource)}));
        }));

        // Data listeners (customers, reminders) based on user role
        const customerQuery = user.role === Role.ADMIN ? collection(db, "customers") : query(collection(db, "customers"), where("userId", "==", user.id));
        unsubscribes.push(onSnapshot(customerQuery, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        }));
        
        const reminderQuery = user.role === Role.ADMIN ? collection(db, "reminders") : query(collection(db, "reminders"), where("userId", "==", user.id));
        unsubscribes.push(onSnapshot(reminderQuery, (snapshot) => {
            setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
        }));

        setIsLoading(false);
        return () => unsubscribes.forEach(unsub => unsub());
    }, [user.id, user.role]);
    
    // Centralized filtering logic
    const filteredCustomers = useMemo(() => {
        let customersToFilter = customers;
        
        // Filter by selected user (for admin)
        if (user.role === 'admin' && selectedUserId !== 'all') {
            customersToFilter = customersToFilter.filter(customer => customer.userId === selectedUserId);
        }
        
        // Filter by search term
        if (!searchTerm.trim()) return customersToFilter;
        const term = searchTerm.toLowerCase();
        return customersToFilter.filter(c => 
            c.name.toLowerCase().includes(term) || 
            c.phone.includes(term) ||
            (c.carModel && c.carModel.toLowerCase().includes(term)) ||
            (c.source && c.source.toLowerCase().includes(term)) ||
            (c.city && c.city.toLowerCase().includes(term))
        );
    }, [customers, searchTerm, user.role, selectedUserId]);

    // HANDLERS (now interact with Firestore)
    const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'userId' | 'createdDate' | 'lastContactDate' | 'interactions'>, existingCustomerId?: string) => {
        if (existingCustomerId) { // Update
            const customerRef = doc(db, 'customers', existingCustomerId);
            await updateDoc(customerRef, { ...customerData, lastContactDate: Date.now() });
        } else { // Create
            const newCustomer: Omit<Customer, 'id'> = {
                ...customerData,
                userId: user.id,
                createdDate: Date.now(),
                lastContactDate: Date.now(),
                interactions: [],
            };
            await addDoc(collection(db, 'customers'), newCustomer);
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        const customerRef = doc(db, 'customers', customerId);
        // Also delete associated reminders
        const remindersQuery = query(collection(db, "reminders"), where("customerId", "==", customerId));
        const remindersSnapshot = await getDocs(remindersQuery);
        
        const batch = writeBatch(db);
        remindersSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(customerRef);
        await batch.commit();
        
        setDeleteConfirm({ isOpen: false, customerId: '' });
    };

    const handleCustomerUpdate = async (customerId: string, updates: Partial<Customer>) => {
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, { ...updates, lastContactDate: Date.now() });
    };

    const handleAddInteraction = (customerId: string, interaction: Omit<Interaction, 'id'>) => {
        const customer = customers.find(c => c.id === customerId);
        if(!customer) return;
        const updatedInteractions = [...(customer.interactions || []), { ...interaction, id: 'int_' + Date.now() }];
        handleCustomerUpdate(customerId, { interactions: updatedInteractions });
    };

    const handleDeleteInteraction = (customerId: string, interactionId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;
        const updatedInteractions = (customer.interactions || []).filter(i => i.id !== interactionId);
        handleCustomerUpdate(customerId, { interactions: updatedInteractions });
    };
    
    const handleGenerateScript = async (customer: Customer) => {
        setScriptModal({ isOpen: true, script: '', isLoading: true });
        const script = await GeminiService.generateScript(customer, user.name);
        setScriptModal({ isOpen: true, script, isLoading: false });
    };

    const handleSaveReminder = async (reminderData: Omit<Reminder, 'id'>, existingReminderId?: string) => {
        if (existingReminderId) {
            await updateDoc(doc(db, "reminders", existingReminderId), reminderData);
        } else {
            await addDoc(collection(db, "reminders"), reminderData);
        }
    };
    
    const handleDeleteReminder = async (reminderId: string) => {
        await deleteDoc(doc(db, "reminders", reminderId));
    };

    const handleToggleReminderComplete = async (reminderId: string) => {
        const reminder = reminders.find(r => r.id === reminderId);
        if (!reminder) return;
        await updateDoc(doc(db, "reminders", reminderId), { completed: !reminder.completed });
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
                        <input type="text" placeholder="Tìm kiếm KH, SĐT, xe, nguồn, TP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><SearchIcon/></div>
                    </div>
                    <div>
                         <button onClick={openAddCustomer} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center">
                           <PlusIcon className="w-4 h-4 mr-2" /> Thêm KH
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                   {activeView === 'dashboard' && <Dashboard customers={customers} statuses={settings.statuses} reminders={reminders} onEditReminder={(rem) => openReminderModal(rem.customerId, rem)} onToggleComplete={handleToggleReminderComplete} onDeleteReminder={handleDeleteReminder} onOpenCustomer={openEditCustomer} />}
                   {activeView === 'reminders' && <RemindersView reminders={reminders} customers={customers} onOpenReminderModal={openReminderModal} onToggleComplete={handleToggleReminderComplete} onDelete={handleDeleteReminder} />}
                   {activeView === 'kanban' && <KanbanView customers={filteredCustomers} statuses={settings.statuses} reminders={reminders} onCustomerEdit={openEditCustomer} onCustomerUpdate={handleCustomerUpdate} onDelete={(id) => setDeleteConfirm({isOpen: true, customerId: id})} onAddInteraction={handleAddInteraction} onDeleteInteraction={handleDeleteInteraction} onGenerateScript={handleGenerateScript} onOpenReminderModal={(id) => openReminderModal(id)} users={users} searchTerm={searchTerm} />}
                   {activeView === 'list' && <ListView customers={filteredCustomers} statuses={settings.statuses} onCustomerEdit={openEditCustomer} onCustomerDelete={(id) => setDeleteConfirm({isOpen: true, customerId: id})} onGenerateScript={handleGenerateScript} users={users} currentUser={user} selectedUserId={selectedUserId} onSelectedUserChange={setSelectedUserId} searchTerm={searchTerm} />}
                   {activeView === 'reports' && user.role === 'admin' && <ReportsView customers={customers} users={users} statuses={settings.statuses} carModels={settings.carModels} customerSources={settings.customerSources} />}
                   {activeView === 'settings' && user.role === 'admin' && <SettingsPanel users={users} settings={settings} />}
                </main>
            </div>
            
            <CustomerForm isOpen={showCustomerForm} onClose={closeCustomerForm} onSave={handleSaveCustomer} customer={editingCustomer} statuses={settings.statuses} carModels={settings.carModels} customerSources={settings.customerSources} />
            <ConfirmationModal isOpen={deleteConfirm.isOpen} title="Xác nhận xóa" message="Bạn có chắc chắn muốn xóa khách hàng này không? Mọi nhắc hẹn liên quan cũng sẽ bị xóa." onConfirm={() => handleDeleteCustomer(deleteConfirm.customerId)} onCancel={() => setDeleteConfirm({ isOpen: false, customerId: '' })} />
            <ScriptModal isOpen={scriptModal.isOpen} isLoading={scriptModal.isLoading} script={scriptModal.script} onClose={() => setScriptModal({isOpen: false, script: '', isLoading: false})} />
            <ReminderFormModal isOpen={showReminderForm} onClose={closeReminderModal} onSave={handleSaveReminder} reminder={editingReminder} customerId={activeReminderCustomerId} customers={customers} user={user} />
        </div>
    );
};


const KanbanView: React.FC<Omit<CustomerCardProps, 'customer' | 'onStatusChange'> & { customers: Customer[], onCustomerUpdate: (id: string, updates: Partial<Customer>) => void, searchTerm: string }> = ({ customers, statuses, reminders, onCustomerEdit, onCustomerUpdate, onDelete, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users, searchTerm }) => {
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
                                        searchTerm={searchTerm}
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

interface ListViewProps {
    customers: Customer[];
    statuses: Status[];
    onCustomerEdit: (c: Customer) => void;
    onCustomerDelete: (id: string) => void;
    onGenerateScript: (c: Customer) => void;
    users: User[];
    currentUser: User;
    selectedUserId: string;
    onSelectedUserChange: (userId: string) => void;
    searchTerm: string;
}
const ListView: React.FC<ListViewProps> = ({customers, statuses, onCustomerEdit, onCustomerDelete, onGenerateScript, users, currentUser, selectedUserId, onSelectedUserChange, searchTerm}) => {
    const [sortField, setSortField] = useState<keyof Customer | 'userId'>('lastContactDate');
    const [sortDirection, setSortDirection] = useState('desc');
    
    const allPossibleColumns = useMemo(() => [
        { key: 'name', label: 'Khách hàng' },
        { key: 'phone', label: 'Liên hệ' },
        { key: 'carModel', label: 'Dòng xe' },
        { key: 'source', label: 'Nguồn' },
        { key: 'city', label: 'Thành Phố' },
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

            if (aVal === bVal) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }
            
            if (aVal > bVal) return 1;
            if (bVal > aVal) return -1;
            return 0;
        });
    }, [customers, sortField]);

    const processedCustomers = useMemo(() => {
        if (sortDirection === 'desc') {
            return [...sortedCustomers].reverse();
        }
        return sortedCustomers;
    }, [sortedCustomers, sortDirection]);

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
    
    const getCellDataForExport = (customer: Customer, columnKey: string): string => {
        switch (columnKey) {
            case 'name': return customer.name;
            case 'phone': return customer.phone;
            case 'email': return customer.email || '';
            case 'statusId': return statuses.find(s => s.id === customer.statusId)?.name.replace(/^\d+\.\s/, '') || '---';
            case 'salesValue': return String(customer.salesValue);
            case 'userId': return getUserName(customer.userId);
            case 'lastContactDate': return customer.lastContactDate ? formatDate(customer.lastContactDate) : '';
            case 'createdDate': return customer.createdDate ? formatDate(customer.createdDate) : '';
            case 'carModel': return customer.carModel || '';
            case 'source': return customer.source || '';
            case 'city': return customer.city || '';
            case 'tier': return customer.tier;
            default: return '';
        }
    };

    const handleExportCsv = () => {
        if (processedCustomers.length === 0) {
            alert("Không có dữ liệu để xuất.");
            return;
        }
    
        const columnsToExport = allPossibleColumns.filter(col => visibleColumns.has(col.key));
    
        const escapeCsvCell = (cell: string | number) => {
            const strCell = String(cell);
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };
    
        const headers = columnsToExport.map(c => c.label).join(',');
    
        const rows = processedCustomers.map(customer => {
            return columnsToExport.map(col => {
                const cellData = getCellDataForExport(customer, col.key);
                return escapeCsvCell(cellData);
            }).join(',');
        });
    
        const csvContent = [headers, ...rows].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'danh_sach_khach_hang.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const renderCellContent = (customer: Customer, columnKey: string) => {
        switch (columnKey) {
            case 'name':
                return (
                    <>
                        <div className="font-medium text-gray-900"><Highlight text={customer.name} highlight={searchTerm} /></div>
                        <div className="text-sm text-gray-500"><Highlight text={customer.carModel} highlight={searchTerm} /></div>
                    </>
                );
            case 'phone':
                return (
                    <>
                        <div className="text-sm text-gray-900"><Highlight text={customer.phone} highlight={searchTerm} /></div>
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
                return <span className="text-sm text-gray-500"><Highlight text={customer.carModel} highlight={searchTerm} /></span>;
            case 'source':
                return <span className="text-sm text-gray-500"><Highlight text={customer.source} highlight={searchTerm} /></span>;
             case 'city':
                return <span className="text-sm text-gray-500"><Highlight text={customer.city} highlight={searchTerm} /></span>;
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
             <div className="p-4 border-b flex justify-between items-center space-x-4">
                <div className="flex-1">
                    {currentUser.role === 'admin' && (
                        <div className="max-w-xs">
                             <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700">
                                Nhân viên
                            </label>
                            <select
                                id="user-filter"
                                value={selectedUserId}
                                onChange={(e) => onSelectedUserChange(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Tất cả nhân viên</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExportCsv} className="px-3 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm flex items-center hover:bg-green-200 transition">
                        <DownloadIcon className="w-4 h-4 mr-2"/> Xuất Excel
                    </button>
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
                        {processedCustomers.length > 0 && processedCustomers.map(customer => (
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
                {processedCustomers.length === 0 && (
                     <div className="text-center p-8 text-gray-500">Không tìm thấy khách hàng nào.</div>
                )}
            </div>
        </div>
    )
}

const SalesOverTimeChart: React.FC<{ data: { month: string, revenue: number }[] }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let chart: Chart | null = null;
        if (chartRef.current && data.length > 0) {
            const chartData = {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Doanh số',
                    data: data.map(d => d.revenue),
                    fill: true,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: '#4f46e5',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            };
            chart = new Chart(chartRef.current, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => `Doanh số: ${formatCurrency(context.parsed.y)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => {
                                    if (typeof value === 'number') {
                                        if (value >= 1e9) return `${value / 1e9}B`;
                                        if (value >= 1e6) return `${value / 1e6}M`;
                                    }
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
        }
        return () => {
            chart?.destroy();
        };
    }, [data]);

    return (
         <div className="bg-white p-6 rounded-xl shadow-sm border">
             <h3 className="text-lg font-semibold mb-4">Doanh số theo Thời gian</h3>
             <div className="chart-container h-[300px]">
                {data.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Không có dữ liệu doanh số.</div>
                )}
             </div>
        </div>
    );
};


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

    const salesOverTime = useMemo(() => {
        const deliveredStatusId = statuses.find(s => s.type === 'delivered')?.id;
        if (!deliveredStatusId) return [];

        const salesByMonth: { [key: string]: number } = customers
            .filter(c => c.statusId === deliveredStatusId)
            .reduce((acc, curr) => {
                const date = new Date(curr.lastContactDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[monthKey] = (acc[monthKey] || 0) + curr.salesValue;
                return acc;
            }, {} as { [key: string]: number });

        return Object.entries(salesByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, revenue]) => {
                const [year, month] = monthKey.split('-');
                return {
                    month: `T${month}/${year}`,
                    revenue,
                };
            });
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
            <SalesOverTimeChart data={salesOverTime} />
        </div>
    )
}

const CarModelSalesReport: React.FC<{ data: any[], onExport: () => void }> = ({ data, onExport }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let chart: Chart | null = null;
        if (chartRef.current && data.length > 0) {
            const chartData = {
                labels: data.map(d => d['Dòng xe']),
                datasets: [
                    {
                        label: 'Doanh số',
                        data: data.map(d => d.rawRevenue),
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderColor: '#4338ca',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'yRevenue',
                        order: 2,
                    },
                    {
                        label: 'Số xe đã giao',
                        data: data.map(d => d['Số xe đã giao']),
                        backgroundColor: 'rgba(22, 163, 74, 0.8)',
                        borderColor: '#15803d',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'yCount',
                        order: 1,
                    }
                ]
            };
            chart = new Chart(chartRef.current, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        if (context.dataset.label === 'Doanh số') {
                                            label += formatCurrency(context.parsed.y);
                                        } else {
                                            label += context.parsed.y;
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: false,
                        },
                        yRevenue: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: true,
                            },
                            ticks: {
                                callback: function(value) {
                                    if (typeof value === 'number') {
                                        if (value >= 1e9) return (value / 1e9) + 'B';
                                        if (value >= 1e6) return (value / 1e6) + 'M';
                                    }
                                    return value;
                                },
                                color: '#4f46e5',
                            },
                            title: {
                                display: true,
                                text: 'Doanh số (VNĐ)',
                                color: '#4f46e5',
                            }
                        },
                        yCount: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                stepSize: 1,
                                color: '#16a34a',
                            },
                            title: {
                                display: true,
                                text: 'Số xe đã giao',
                                color: '#16a34a',
                            }
                        }
                    }
                }
            });
        }
        return () => {
            chart?.destroy();
        };
    }, [data]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Hiệu suất theo Dòng xe</h3>
                <button onClick={onExport} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center">
                    <DownloadIcon className="w-4 h-4 mr-2"/> Xuất CSV
                </button>
            </div>
            
            {data.length > 0 ? (
                <>
                    <div className="mb-6 chart-container h-[350px]">
                        <canvas ref={chartRef}></canvas>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>{Object.keys(data[0]).filter(k => k !== 'rawRevenue').map(key => <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>)}</tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row, index) => <tr key={index} className="hover:bg-gray-50">{Object.keys(row).filter(k => k !== 'rawRevenue').map(key => <td key={key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row[key]}</td>)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                </>