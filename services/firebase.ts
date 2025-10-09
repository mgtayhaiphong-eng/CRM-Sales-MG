import { useState, useEffect, useCallback, useMemo, createContext } from 'react';
import { Role, type User, type Customer, type Status, type CarModel, type CustomerSource, type Interaction, type Reminder, type CrmData, type MarketingSpend } from '../types';
import { CUSTOMER_TIERS } from '../constants';

// START: MOCK DATA & LOCAL STORAGE SERVICE
const MOCK_USERS_SEED: Omit<User, 'id'| 'password'>[] = [
    { username: 'admin', role: Role.ADMIN, name: 'Admin Manager' },
    { username: 'user', role: Role.USER, name: 'Nguyễn Văn A' },
    { username: 'user2', role: Role.USER, name: 'Phạm Thị C' },
];

const MOCK_INITIAL_DATA: CrmData = {
    statuses: [
        { id: 'status1', name: '1. Khách hàng Mới', color: '#6366f1', order: 1, type: 'pipeline' },
        { id: 'status2', name: '2. Đã Chăm sóc', color: '#f59e0b', order: 2, type: 'pipeline' },
        { id: 'status3', name: '3. Tiềm năng Cao', color: '#ef4444', order: 3, type: 'pipeline' },
        { id: 'status4', name: '4. Đã ký HĐ', color: '#22c55e', order: 4, type: 'win' },
        { id: 'status6', name: '5. Đã giao xe', color: '#3b82f6', order: 5, type: 'delivered' },
        { id: 'status5', name: '6. Lostsale', color: '#1f2937', order: 6, type: 'lostsale' },
    ],
    carModels: [
        { id: 'model1', name: 'MG ZS' }, { id: 'model2', name: 'MG HS' }, { id: 'model3', name: 'MG RX5' }, { id: 'model4', name: 'MG GT' }, {id: 'model5', name: 'MG5'}
    ],
    customerSources: [
        { id: 'source1', name: 'Facebook' }, { id: 'source2', name: 'Website' }, { id: 'source3', name: 'Showroom' }, { id: 'source4', name: 'Giới thiệu' }, { id: 'source5', name: 'Zalo' }
    ],
    marketingSpends: [
        { id: 'spend1', name: 'Facebook', amount: 15000000 },
        { id: 'spend2', name: 'Website', amount: 25000000 },
        { id: 'spend3', name: 'Showroom', amount: 5000000 },
        { id: 'spend4', name: 'Giới thiệu', amount: 0 },
        { id: 'spend5', name: 'Zalo', amount: 8000000 },
    ],
    customers: [
        { id: 'cust_1', name: 'Trần Văn Hùng', phone: '0905123456', email: 'hung.tran@email.com', carModel: 'MG ZS', source: 'Facebook', statusId: 'status6', city: 'Hà Nội', notes: 'Đã giao xe, khách hàng hài lòng.', salesValue: 550000000, tier: 'WARM', createdDate: 1717213400000, lastContactDate: 1719460000000, interactions: [ { id: 'int_1_1', type: 'test_drive', date: 1719287400000, notes: 'Khách hàng lái thử, rất hài lòng.', duration: 60, outcome: 'positive', userId: 'user_2' } ], userId: 'user_2' },
        { id: 'cust_2', name: 'Lê Thị Mai', phone: '0987654321', email: 'mai.le@email.com', carModel: 'MG HS', source: 'Website', statusId: 'status3', city: 'TP Hồ Chí Minh', notes: 'Đang phân vân giữa MG HS và đối thủ. Cần follow-up chặt.', salesValue: 780000000, tier: 'HOT', createdDate: 1717313400000, lastContactDate: 1719560000000, interactions: [ { id: 'int_2_1', type: 'quotation', date: 1719560000000, notes: 'Gửi báo giá bản cao nhất.', duration: 15, outcome: 'neutral', userId: 'user_2' } ], userId: 'user_2' },
        { id: 'cust_3', name: 'Phạm Văn Đức', phone: '0912345678', carModel: 'MG RX5', source: 'Showroom', statusId: 'status2', city: 'Đà Nẵng', notes: 'Khách vãng lai, đã lấy thông tin.', salesValue: 850000000, tier: 'COLD', createdDate: 1717413400000, lastContactDate: 1718990000000, interactions: [ { id: 'int_3_1', type: 'call', date: 1718990000000, notes: 'Gọi lại hỏi thăm, khách đang bận.', duration: 2, outcome: 'neutral', userId: 'user_3' } ], userId: 'user_3' },
        { id: 'cust_4', name: 'Nguyễn Thị Thu', phone: '0333444555', carModel: 'MG GT', source: 'Giới thiệu', statusId: 'status6', city: 'Hải Phòng', salesValue: 650000000, tier: 'WARM', createdDate: 1716213400000, lastContactDate: 1718855400000, interactions: [], userId: 'user_3' },
        { id: 'cust_5', name: 'Hoàng Văn Nam', phone: '0888999111', carModel: 'MG5', source: 'Zalo', statusId: 'status5', city: 'Cần Thơ', notes: 'Khách đã mua xe hãng khác.', salesValue: 580000000, tier: 'LOST', createdDate: 1716313400000, lastContactDate: 1719123400000, interactions: [ { id: 'int_5_1', type: 'meeting', date: 1719023400000, notes: 'Gặp trao đổi nhưng khách chê giá.', duration: 45, outcome: 'negative', userId: 'user_2' } ], userId: 'user_2' },
        { id: 'cust_6', name: 'Vũ Thị Lan Anh', phone: '0978111222', carModel: 'MG ZS', source: 'Facebook', statusId: 'status4', city: 'Bình Dương', salesValue: 560000000, tier: 'HOT', createdDate: 1717813400000, lastContactDate: 1719630000000, interactions: [ { id: 'int_6_1', type: 'call', date: 1719630000000, notes: 'Xác nhận lại thông tin hợp đồng.', duration: 10, outcome: 'positive', userId: 'user_3' } ], userId: 'user_3' },
        { id: 'cust_7', name: 'Đặng Minh Quang', phone: '0945555888', email: 'quang.dang@email.com', carModel: 'MG HS', source: 'Website', statusId: 'status1', city: 'Hà Nội', salesValue: 790000000, tier: 'COLD', createdDate: 1719546200000, lastContactDate: 1719546200000, interactions: [] },
        { id: 'cust_8', name: 'Bùi Thị Kim Oanh', phone: '0356789123', carModel: 'MG HS', source: 'Showroom', statusId: 'status3', city: 'Bắc Ninh', notes: 'Vợ chồng xem xe, vợ rất thích. Chồng đang cân nhắc tài chính.', salesValue: 800000000, tier: 'HOT', createdDate: 1718013400000, lastContactDate: 1719461000000, interactions: [], userId: 'user_3' },
        { id: 'cust_9', name: 'Đỗ Tiến Dũng', phone: '0988123789', carModel: 'MG RX5', source: 'Giới thiệu', statusId: 'status2', city: 'TP Hồ Chí Minh', salesValue: 860000000, tier: 'WARM', createdDate: 1718113400000, lastContactDate: 1719287400000, interactions: [ { id: 'int_9_1', type: 'email', date: 1719287400000, notes: 'Gửi thông số kỹ thuật chi tiết.', duration: 5, outcome: 'neutral', userId: 'user_2' } ], userId: 'user_2' },
        { id: 'cust_10', name: 'Hồ Thị Bích', phone: '0965432198', carModel: 'MG5', source: 'Zalo', statusId: 'status5', city: 'Vũng Tàu', notes: 'Không liên lạc được.', salesValue: 585000000, tier: 'LOST', createdDate: 1717513400000, lastContactDate: 1718855400000, interactions: [], userId: 'user_3' },
        { id: 'cust_11', name: 'Lý Văn Tài', phone: '0398765432', carModel: 'MG ZS', source: 'Facebook', statusId: 'status1', city: 'Đồng Nai', salesValue: 555000000, tier: 'COLD', createdDate: 1719631000000, lastContactDate: 1719631000000, interactions: [] },
        { id: 'cust_12', name: 'Mai Anh Tuấn', phone: '0911223344', email: 'tuan.mai@email.com', carModel: 'MG GT', source: 'Website', statusId: 'status2', city: 'Hà Nội', salesValue: 660000000, tier: 'WARM', createdDate: 1718513400000, lastContactDate: 1719562000000, interactions: [ { id: 'int_12_1', type: 'call', date: 1719562000000, notes: 'Tư vấn về gói phụ kiện.', duration: 15, outcome: 'positive', userId: 'user_3' } ], userId: 'user_3' },
        { id: 'cust_13', name: 'Dương Thị Yến', phone: '0344556677', carModel: 'MG HS', source: 'Showroom', statusId: 'status6', city: 'Bình Phước', salesValue: 795000000, tier: 'WARM', createdDate: 1715513400000, lastContactDate: 1717460000000, interactions: [], userId: 'user_2' },
        { id: 'cust_14', name: 'Châu Văn Toàn', phone: '0909888777', carModel: 'MG RX5', source: 'Giới thiệu', statusId: 'status3', city: 'TP Hồ Chí Minh', salesValue: 870000000, tier: 'HOT', createdDate: 1718813400000, lastContactDate: 1719633000000, interactions: [ { id: 'int_14_1', type: 'meeting', date: 1719633000000, notes: 'Gặp tại quán cafe, khách đã gần chốt.', duration: 60, outcome: 'positive', userId: 'user_3' } ], userId: 'user_3' },
        { id: 'cust_15', name: 'Tạ Thị Hiền', phone: '0981981981', carModel: 'MG5', source: 'Website', statusId: 'status2', city: 'Hà Nội', salesValue: 590000000, tier: 'WARM', createdDate: 1719013400000, lastContactDate: 1719465000000, interactions: [], userId: 'user_2' }
    ],
    reminders: [
        { id: 'rem_1', customerId: 'cust_2', userId: 'user_2', title: 'Gọi lại chốt deal MG HS', description: 'Follow-up về báo giá và chương trình khuyến mãi tháng 6.', dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000, completed: false, priority: 'high' },
        { id: 'rem_2', customerId: 'cust_8', userId: 'user_3', title: 'Mời khách lái thử lại', description: 'Vợ thích nhưng chồng còn lăn tăn, mời cả 2 vợ chồng đến lái thử cuối tuần.', dueDate: Date.now() + 4 * 24 * 60 * 60 * 1000, completed: false, priority: 'high' },
        { id: 'rem_3', customerId: 'cust_9', userId: 'user_2', title: 'Gửi thông tin trả góp', description: 'Khách hỏi về phương án vay ngân hàng, chuẩn bị file gửi khách.', dueDate: Date.now() + 1 * 24 * 60 * 60 * 1000, completed: false, priority: 'medium' },
        { id: 'rem_4', customerId: 'cust_3', userId: 'user_3', title: 'Chăm sóc lại khách vãng lai', description: 'Gọi lại hỏi thăm, xem nhu cầu của khách tới đâu.', dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, completed: false, priority: 'low' },
        { id: 'rem_5', customerId: 'cust_1', userId: 'user_2', title: 'Hỏi thăm sau giao xe', description: 'Gọi hỏi thăm tình hình sử dụng xe, nhắc lịch bảo dưỡng lần đầu.', dueDate: Date.now() - 5 * 24 * 60 * 60 * 1000, completed: true, priority: 'medium' }
    ],
    salesGoals: [],
};

const LOCAL_STORAGE_KEY = 'crm_app_data';

// FIX: Export dataService to be used in AuthProvider
export const dataService = {
    getData: (): { users: User[], crmData: CrmData } => {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (parsedData.crmData && parsedData.crmData.customers && parsedData.crmData.customers.length > 0) {
                     return parsedData;
                }
            } catch (e) {
                console.error("Could not parse data from localStorage, resetting.", e);
            }
        }
        return dataService.seedData();
    },
    saveData: (users: User[], crmData: CrmData) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ users, crmData }));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    },
    seedData: (): { users: User[], crmData: CrmData } => {
        const users: User[] = MOCK_USERS_SEED.map((user, index) => ({
            ...user,
            id: `user_${index + 1}`,
            password: user.username 
        }));
        
        const user2Id = users.find(u => u.username === 'user')?.id || 'user_2';
        const user3Id = users.find(u => u.username === 'user2')?.id || 'user_3';

        const seededCrmData = { ...MOCK_INITIAL_DATA };
        
        // Assign users to customers, leaving some unassigned
        seededCrmData.customers.forEach(customer => {
            if (customer.id === 'cust_7' || customer.id === 'cust_11') {
                delete customer.userId; // Ensure these are unassigned
            } else if (!customer.userId) { // Assign only if not manually set in mock
                 customer.userId = customer.id.endsWith('2') || customer.id.endsWith('5') || customer.id.endsWith('9') || customer.id.endsWith('13') || customer.id.endsWith('15') ? user2Id : user3Id;
            }
        });

         seededCrmData.reminders.forEach(reminder => {
             reminder.userId = reminder.id.endsWith('1') || reminder.id.endsWith('3') || reminder.id.endsWith('5') ? user2Id : user3Id;
        });

        const initialData = { users, crmData: seededCrmData };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
        return initialData;
    },
    deleteAllCrmData: (): { users: User[], crmData: CrmData } => {
        const { users } = dataService.getData();
        const emptyCrmData: CrmData = {
            customers: [], reminders: [], salesGoals: [],
            statuses: MOCK_INITIAL_DATA.statuses, 
            carModels: MOCK_INITIAL_DATA.carModels, 
            customerSources: MOCK_INITIAL_DATA.customerSources,
            marketingSpends: MOCK_INITIAL_DATA.marketingSpends,
        };
        const newData = { users, crmData: emptyCrmData };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
        return newData;
    }
};
// END: MOCK DATA & LOCAL STORAGE SERVICE


// START: CONTEXT DEFINITIONS
interface NotificationContextType {
    addNotification: (message: string, type: 'success' | 'error') => void;
}
export const NotificationContext = createContext<NotificationContextType | null>(null);

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}
export const AuthContext = createContext<AuthContextType | null>(null);
// END: CONTEXT DEFINITIONS


// START: CUSTOM HOOK for CRM Data Logic
export const useCrm = (currentUser: User | null, addNotification: (message: string, type: 'success' | 'error') => void) => {
    const [users, setUsers] = useState<User[]>([]);
    const [crmData, setCrmData] = useState<CrmData>({ customers: [], statuses: [], carModels: [], customerSources: [], reminders: [], salesGoals: [], marketingSpends: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'ascending' | 'descending' }>({ key: 'createdDate', direction: 'descending' });
    const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });

    useEffect(() => {
        const { users: loadedUsers, crmData: loadedCrmData } = dataService.getData();
        setUsers(loadedUsers);
        setCrmData(loadedCrmData);
        setIsLoading(false);
    }, []);

    // Automated Reminders Hook
    useEffect(() => {
        if (isLoading) return;

        const lastCheck = localStorage.getItem('lastAutoReminderCheck');
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;

        if (lastCheck && (now - parseInt(lastCheck, 10)) < twelveHours) return;

        const pipelineStatusIds = new Set(crmData.statuses.filter(s => s.type === 'pipeline').map(s => s.id));
        const newReminders: Reminder[] = [];

        crmData.customers.forEach(customer => {
            if (!customer.userId || !pipelineStatusIds.has(customer.statusId)) return;
            const tierConfig = CUSTOMER_TIERS.find(t => t.value === customer.tier);
            if (!tierConfig || tierConfig.reminderDays === 0) return;
            const followUpDeadline = customer.lastContactDate + (tierConfig.reminderDays * 24 * 60 * 60 * 1000);
            const needsFollowUp = now > followUpDeadline;
            const hasExistingAutoReminder = crmData.reminders.some(r => r.customerId === customer.id && r.isAuto && !r.completed);

            if (needsFollowUp && !hasExistingAutoReminder) {
                const priorityMap: Record<string, Reminder['priority']> = { HOT: 'high', WARM: 'medium', COLD: 'low' };
                const newReminder: Reminder = {
                    id: `rem_auto_${Date.now()}_${customer.id}`, customerId: customer.id, userId: customer.userId,
                    title: `Tự động: Chăm sóc lại KH ${customer.name}`,
                    description: `Khách hàng ${customer.tier} đã quá ${tierConfig.reminderDays} ngày chưa được liên hệ. Cần gọi lại hỏi thăm.`,
                    dueDate: now, completed: false, priority: priorityMap[customer.tier] || 'low', isAuto: true,
                };
                newReminders.push(newReminder);
            }
        });

        if (newReminders.length > 0) {
            setCrmData(prev => ({ ...prev, reminders: [...prev.reminders, ...newReminders] }));
            addNotification(`Đã tự động tạo ${newReminders.length} nhắc hẹn chăm sóc.`, 'success');
        }
        localStorage.setItem('lastAutoReminderCheck', now.toString());
    }, [crmData.customers, crmData.statuses, crmData.reminders, isLoading, addNotification]);

    useEffect(() => {
        if (!isLoading) {
            dataService.saveData(users, crmData);
        }
    }, [users, crmData, isLoading]);

    const login = async (username: string, password: string): Promise<User | null> => {
        const { users: allUsers } = dataService.getData();
        return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;
    };
    
    const logout = () => { /* Logic handled by AuthProvider, but placeholder here */ };

    // Data Filtering and Processing
    const dashboardCustomers = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.USER) return crmData.customers.filter(c => c.userId === currentUser.id);
        if (currentUser.role === Role.ADMIN && selectedUserId !== 'all') return crmData.customers.filter(c => c.userId === selectedUserId);
        return crmData.customers;
    }, [crmData.customers, currentUser, selectedUserId]);

    const filteredReminders = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.USER) return crmData.reminders.filter(r => r.userId === currentUser.id);
        if (currentUser.role === Role.ADMIN && selectedUserId !== 'all') return crmData.reminders.filter(r => r.userId === selectedUserId);
        return crmData.reminders;
    }, [crmData.reminders, currentUser, selectedUserId]);

    const filteredCustomers = useMemo(() => {
        let customersToFilter = crmData.customers;
        if (!currentUser) return [];
        if (currentUser.role === Role.USER) customersToFilter = customersToFilter.filter(customer => customer.userId === currentUser.id);
        else if (currentUser.role === Role.ADMIN && selectedUserId !== 'all') customersToFilter = customersToFilter.filter(customer => customer.userId === selectedUserId || !customer.userId);
        
        if (!searchTerm.trim()) return customersToFilter;
        const term = searchTerm.toLowerCase();
        return customersToFilter.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.carModel && c.carModel.toLowerCase().includes(term)) || (c.source && c.source.toLowerCase().includes(term)) || (c.city && c.city.toLowerCase().includes(term)));
    }, [crmData.customers, searchTerm, currentUser, selectedUserId]);
    
    const { paginatedCustomers, totalFilteredCustomers } = useMemo(() => {
        const sorted = [...filteredCustomers].sort((a, b) => {
            const key = sortConfig.key;
            const direction = sortConfig.direction === 'ascending' ? 1 : -1;
            const valueA = a[key], valueB = b[key];
            if (valueA === undefined || valueA === null) return 1 * direction;
            if (valueB === undefined || valueB === null) return -1 * direction;
            if (key === 'name') return (valueA as string).localeCompare(valueB as string) * direction;
            if (key === 'userId') {
                const nameA = users.find(u => u.id === valueA)?.name || '', nameB = users.find(u => u.id === valueB)?.name || '';
                return nameA.localeCompare(nameB) * direction;
            }
            if (typeof valueA === 'number' && typeof valueB === 'number') return (valueA - valueB) * direction;
            return 0;
        });
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        return { paginatedCustomers: sorted.slice(startIndex, startIndex + pagination.itemsPerPage), totalFilteredCustomers: sorted.length };
    }, [filteredCustomers, sortConfig, pagination, users]);

    // Handlers
    const handleSaveCustomer = useCallback((customerData: Omit<Customer, 'id' | 'userId' | 'createdDate' | 'lastContactDate' | 'interactions'>, existingCustomerId?: string) => {
        if (existingCustomerId) {
            setCrmData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === existingCustomerId ? { ...c, ...customerData, lastContactDate: Date.now() } : c) }));
            addNotification('Cập nhật khách hàng thành công!', 'success');
        } else {
            const newCustomer: Partial<Customer> = { ...customerData, id: 'cust_' + Date.now(), createdDate: Date.now(), lastContactDate: Date.now(), interactions: [] };
            if (currentUser?.role === Role.USER) newCustomer.userId = currentUser.id;
            setCrmData(prev => ({ ...prev, customers: [...prev.customers, newCustomer as Customer] }));
            addNotification('Thêm khách hàng mới thành công!', 'success');
        }
    }, [currentUser, addNotification]);

    const handleDelete = useCallback((ids: string[]) => {
        const idsSet = new Set(ids);
        setCrmData(prev => ({ ...prev, customers: prev.customers.filter(c => !idsSet.has(c.id)), reminders: prev.reminders.filter(r => !idsSet.has(r.customerId)) }));
        addNotification(`Đã xóa ${ids.length} khách hàng.`, 'success');
        setSelectedCustomerIds(new Set());
    }, [addNotification]);
    
    const handleCustomerUpdate = useCallback((customerId: string, updates: Partial<Customer>) => {
        setCrmData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customerId ? { ...c, ...updates, lastContactDate: Date.now() } : c) }));
    }, []);

    const handleAddInteraction = useCallback((customerId: string, interaction: Omit<Interaction, 'id'>) => {
        const newInteraction = { ...interaction, id: 'int_' + Date.now() };
        setCrmData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customerId ? { ...c, interactions: [...(c.interactions || []), newInteraction] } : c) }));
        addNotification('Đã thêm tương tác mới.', 'success');
    }, [addNotification]);

    const handleDeleteInteraction = useCallback((customerId: string, interactionId: string) => {
         setCrmData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customerId ? { ...c, interactions: c.interactions.filter(i => i.id !== interactionId) } : c) }));
         addNotification('Đã xóa tương tác.', 'success');
    }, [addNotification]);

    const handleSaveReminder = useCallback((reminderData: Omit<Reminder, 'id'>, existingReminderId?: string) => {
        if (existingReminderId) {
            setCrmData(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === existingReminderId ? { ...r, ...reminderData } : r) }));
            addNotification('Cập nhật nhắc hẹn thành công.', 'success');
        } else {
            const newReminder = { ...reminderData, id: 'rem_' + Date.now() };
            setCrmData(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
            addNotification('Đã thêm nhắc hẹn mới.', 'success');
        }
    }, [addNotification]);
    
    const handleDeleteReminder = useCallback((reminderId: string) => {
        setCrmData(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== reminderId) }));
        addNotification('Đã xóa nhắc hẹn.', 'success');
    }, [addNotification]);

    const handleToggleReminderComplete = useCallback((reminderId: string) => {
        let isCompleted = false;
        setCrmData(prev => ({ ...prev, reminders: prev.reminders.map(r => { if (r.id === reminderId) { isCompleted = !r.completed; return { ...r, completed: isCompleted }; } return r; }) }));
        addNotification(isCompleted ? 'Đã hoàn thành nhắc hẹn!' : 'Đã đánh dấu chưa hoàn thành.', 'success');
    }, [addNotification]);

    const handleToggleSelectCustomer = useCallback((customerId: string) => {
        setSelectedCustomerIds(prev => { const newSet = new Set(prev); if (newSet.has(customerId)) newSet.delete(customerId); else newSet.add(customerId); return newSet; });
    }, []);

    const handleToggleSelectAll = useCallback(() => {
        const currentIdsOnPage = new Set(paginatedCustomers.map(c => c.id));
        if (paginatedCustomers.every(c => selectedCustomerIds.has(c.id))) {
             setSelectedCustomerIds(prev => { const newSet = new Set(prev); currentIdsOnPage.forEach(id => newSet.delete(id)); return newSet; });
        } else {
            setSelectedCustomerIds(prev => new Set([...prev, ...currentIdsOnPage]));
        }
    }, [paginatedCustomers, selectedCustomerIds]);

    const handleBulkUpdate = useCallback((updates: Partial<Customer>) => {
        setCrmData(prev => ({ ...prev, customers: prev.customers.map(c => selectedCustomerIds.has(c.id) ? { ...c, ...updates, lastContactDate: Date.now() } : c) }));
        addNotification(`Đã cập nhật ${selectedCustomerIds.size} khách hàng.`, 'success');
        setSelectedCustomerIds(new Set());
    }, [selectedCustomerIds, addNotification]);

    const handleSort = useCallback((key: keyof Customer) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    }, []);

    const resetPagination = useCallback(() => setPagination(p => ({ ...p, currentPage: 1 })), []);
    const clearSelection = useCallback(() => setSelectedCustomerIds(new Set()), []);

    return {
        users, setUsers, crmData, setCrmData, isLoading,
        login, logout,
        searchTerm, setSearchTerm, selectedUserId, setSelectedUserId, selectedCustomerIds,
        sortConfig, handleSort,
        pagination, setPagination, resetPagination,
        dashboardCustomers, filteredReminders, filteredCustomers, paginatedCustomers, totalFilteredCustomers,
        handleSaveCustomer, handleDelete, handleCustomerUpdate,
        handleAddInteraction, handleDeleteInteraction,
        handleSaveReminder, handleDeleteReminder, handleToggleReminderComplete,
        handleToggleSelectCustomer, handleToggleSelectAll, handleBulkUpdate, clearSelection,
    };
};
// END: CUSTOM HOOK