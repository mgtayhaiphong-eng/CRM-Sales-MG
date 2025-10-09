import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import firebase from 'firebase/compat/app'; // FIX: Import firebase v8 compatibility
import 'firebase/compat/firestore'; // Needed for FieldValue
import { db, auth } from '../firebaseConfig'; // Import from new config file

import { Role, type User, type Customer, type Status, type CarModel, type CustomerSource, type Interaction, type Reminder, type CrmData, type MarketingSpend } from '../types';
import { CUSTOMER_TIERS } from '../constants';

// START: CONTEXT DEFINITIONS
interface NotificationContextType {
    addNotification: (message: string, type: 'success' | 'error') => void;
}
export const NotificationContext = createContext<NotificationContextType | null>(null);

type CrmContextType = ReturnType<typeof useCrmDataManager>;
export const CrmContext = createContext<CrmContextType | null>(null);

export const useCrm = () => {
    const context = useContext(CrmContext);
    if (!context) {
        throw new Error("useCrm must be used within a CrmProvider");
    }
    return context;
};
// END: CONTEXT DEFINITIONS


// START: CUSTOM HOOK for CRM Data Logic with FIREBASE
export const useCrmDataManager = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [crmData, setCrmData] = useState<CrmData>({ customers: [], statuses: [], carModels: [], customerSources: [], reminders: [], salesGoals: [], marketingSpends: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'ascending' | 'descending' }>({ key: 'createdDate', direction: 'descending' });
    const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });
    const [theme, setTheme] = useState('light');

    // This is a ref to hold the addNotification function provided by the context
    const addNotificationRef = useRef<(message: string, type: 'success' | 'error') => void>(() => {});

    // FIX: Create a stable function to call the notification function from the ref.
    // This function can be passed to components and used in handlers.
    const addNotification = useCallback((message: string, type: 'success' | 'error') => {
        addNotificationRef.current(message, type);
    }, []);

    useEffect(() => {
        // Initialize theme from localStorage or system preference
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);

        // Firebase Auth state listener
        // FIX: Use v8 auth syntax
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user role from Firestore
                // FIX: Use v8 firestore syntax
                const userDocRef = db.collection("users").doc(firebaseUser.uid);
                const userDocSnap = await userDocRef.get();
                if (userDocSnap.exists) {
                    setCurrentUser({ id: firebaseUser.uid, ...userDocSnap.data() } as User);
                } else {
                    console.error("User data not found in Firestore!");
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Effect to listen for all data from Firestore in real-time
    useEffect(() => {
        if (!currentUser) {
            // Clear data when user logs out
            setCrmData({ customers: [], statuses: [], carModels: [], customerSources: [], reminders: [], salesGoals: [], marketingSpends: [] });
            return;
        }

        const collections: (keyof CrmData)[] = ['customers', 'statuses', 'carModels', 'customerSources', 'reminders', 'marketingSpends'];
        // FIX: Use v8 firestore syntax
        const unsubscribes = collections.map(colName => {
            return db.collection(colName).onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // @ts-ignore
                setCrmData(prev => ({ ...prev, [colName]: data }));
            });
        });
        
        // Listen to users collection
         // FIX: Use v8 firestore syntax
         const unsubUsers = db.collection("users").onSnapshot((snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
            unsubUsers();
        };

    }, [currentUser]);


    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // FIX: Use v8 auth syntax
            await auth.signInWithEmailAndPassword(email, password);
            return true;
        } catch (error) {
            console.error("Firebase login error:", error);
            return false;
        }
    };
    
    const logout = async () => { 
        try {
            // FIX: Use v8 auth syntax
            await auth.signOut();
        } catch (error) {
            console.error("Firebase logout error:", error);
        }
    };
    
    // Data Filtering and Processing (largely unchanged)
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


    // FIREBASE HANDLERS
    const handleSaveCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'userId' | 'createdDate' | 'lastContactDate' | 'interactions'>, existingCustomerId?: string) => {
        try {
            if (existingCustomerId) {
                // FIX: Use v8 firestore syntax
                const customerRef = db.collection("customers").doc(existingCustomerId);
                await customerRef.update({ ...customerData, lastContactDate: Date.now() });
                addNotification('Cập nhật khách hàng thành công!', 'success');
            } else {
                const newCustomer: Partial<Customer> = { ...customerData, createdDate: Date.now(), lastContactDate: Date.now(), interactions: [] };
                if (currentUser?.role === Role.USER) newCustomer.userId = currentUser.id;
                // FIX: Use v8 firestore syntax
                await db.collection("customers").add(newCustomer);
                addNotification('Thêm khách hàng mới thành công!', 'success');
            }
        } catch (e) {
            console.error("Error saving customer: ", e);
            addNotification('Lưu khách hàng thất bại!', 'error');
        }
    }, [currentUser, addNotification]);

    const handleDelete = useCallback(async (ids: string[]) => {
        try {
            // FIX: Use v8 firestore syntax
            const batch = db.batch();
            ids.forEach(id => {
                const customerRef = db.collection("customers").doc(id);
                batch.delete(customerRef);
                // Also delete related reminders if needed (requires querying)
            });
            await batch.commit();
            addNotification(`Đã xóa ${ids.length} khách hàng.`, 'success');
            setSelectedCustomerIds(new Set());
        } catch (e) {
            console.error("Error deleting customers: ", e);
            addNotification('Xóa khách hàng thất bại!', 'error');
        }
    }, [addNotification]);
    
    const handleCustomerUpdate = useCallback(async (customerId: string, updates: Partial<Customer>) => {
        try {
            // FIX: Use v8 firestore syntax
            const customerRef = db.collection("customers").doc(customerId);
            await customerRef.update({ ...updates, lastContactDate: Date.now() });
        } catch(e) {
            console.error("Error updating customer: ", e);
            addNotification('Cập nhật thất bại!', 'error');
        }
    }, [addNotification]);

    const handleAddInteraction = useCallback(async (customerId: string, interaction: Omit<Interaction, 'id'>) => {
        try {
            const newInteraction = { ...interaction, id: 'int_' + Date.now() };
            // FIX: Use v8 firestore syntax with FieldValue
            const customerRef = db.collection("customers").doc(customerId);
            await customerRef.update({
                interactions: firebase.firestore.FieldValue.arrayUnion(newInteraction)
            });
            addNotification('Đã thêm tương tác mới.', 'success');
        } catch (e) {
             console.error("Error adding interaction: ", e);
            addNotification('Thêm tương tác thất bại!', 'error');
        }
    }, [addNotification]);

    const handleDeleteInteraction = useCallback(async (customerId: string, interactionId: string) => {
        try {
            // FIX: Use v8 firestore syntax with FieldValue
            const customerRef = db.collection("customers").doc(customerId);
            const customerDoc = await customerRef.get();
            if(customerDoc.exists){
                const customerData = customerDoc.data() as Customer;
                const interactionToDelete = customerData.interactions.find(i => i.id === interactionId);
                if(interactionToDelete) {
                    await customerRef.update({
                        interactions: firebase.firestore.FieldValue.arrayRemove(interactionToDelete)
                    });
                     addNotification('Đã xóa tương tác.', 'success');
                }
            }
        } catch (e) {
             console.error("Error deleting interaction: ", e);
            addNotification('Xóa tương tác thất bại!', 'error');
        }
    }, [addNotification]);

    const handleSaveReminder = useCallback(async (reminderData: Omit<Reminder, 'id'>, existingReminderId?: string) => {
        try {
            if (existingReminderId) {
                // FIX: Use v8 firestore syntax
                const reminderRef = db.collection("reminders").doc(existingReminderId);
                await reminderRef.update(reminderData);
                addNotification('Cập nhật nhắc hẹn thành công.', 'success');
            } else {
                // FIX: Use v8 firestore syntax
                await db.collection("reminders").add(reminderData);
                addNotification('Đã thêm nhắc hẹn mới.', 'success');
            }
        } catch(e) {
             console.error("Error saving reminder: ", e);
            addNotification('Lưu nhắc hẹn thất bại!', 'error');
        }
    }, [addNotification]);
    
    const handleDeleteReminder = useCallback(async (reminderId: string) => {
        try {
            // FIX: Use v8 firestore syntax
            await db.collection("reminders").doc(reminderId).delete();
            addNotification('Đã xóa nhắc hẹn.', 'success');
        } catch (e) {
             console.error("Error deleting reminder: ", e);
            addNotification('Xóa nhắc hẹn thất bại!', 'error');
        }
    }, [addNotification]);

    const handleToggleReminderComplete = useCallback(async (reminderId: string) => {
        try {
            // FIX: Use v8 firestore syntax
            const reminderRef = db.collection("reminders").doc(reminderId);
            const reminderDoc = await reminderRef.get();
            if(reminderDoc.exists){
                const currentStatus = reminderDoc.data()?.completed;
                await reminderRef.update({ completed: !currentStatus });
                addNotification(!currentStatus ? 'Đã hoàn thành nhắc hẹn!' : 'Đã đánh dấu chưa hoàn thành.', 'success');
            }
        } catch (e) {
             console.error("Error toggling reminder: ", e);
        }
    }, [addNotification]);
    
    const handleToggleSelectCustomer = useCallback((id: string) => {
        setSelectedCustomerIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleToggleSelectAll = useCallback(() => {
        const paginatedIds = paginatedCustomers.map(c => c.id);
        const areAllOnPageSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedCustomerIds.has(id));

        setSelectedCustomerIds(prev => {
            const newSet = new Set(prev);
            if (areAllOnPageSelected) {
                paginatedIds.forEach(id => newSet.delete(id));
            } else {
                paginatedIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    }, [paginatedCustomers, selectedCustomerIds]);

    const handleBulkUpdate = useCallback(async (updates: Partial<Customer>) => {
        try {
            // FIX: Use v8 firestore syntax
            const batch = db.batch();
            selectedCustomerIds.forEach(id => {
                const customerRef = db.collection("customers").doc(id);
                batch.update(customerRef, { ...updates, lastContactDate: Date.now() });
            });
            await batch.commit();
            addNotification(`Đã cập nhật ${selectedCustomerIds.size} khách hàng.`, 'success');
            setSelectedCustomerIds(new Set());
        } catch(e) {
            console.error("Error with bulk update:", e);
             addNotification('Cập nhật hàng loạt thất bại!', 'error');
        }
    }, [selectedCustomerIds, addNotification]);

    const handleSort = useCallback((key: keyof Customer) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    }, []);

    const resetPagination = useCallback(() => setPagination(p => ({ ...p, currentPage: 1 })), []);
    const clearSelection = useCallback(() => setSelectedCustomerIds(new Set()), []);

    return {
        // Auth
        currentUser, login, logout, 
        // Data
        users, setUsers, crmData, setCrmData, isLoading,
        // UI State
        searchTerm, setSearchTerm, selectedUserId, setSelectedUserId, selectedCustomerIds,
        sortConfig, handleSort,
        pagination, setPagination, resetPagination,
        // Filtered Data
        dashboardCustomers, filteredReminders, filteredCustomers, paginatedCustomers, totalFilteredCustomers,
        // Handlers
        handleSaveCustomer, handleDelete, handleCustomerUpdate,
        handleAddInteraction, handleDeleteInteraction,
        handleSaveReminder, handleDeleteReminder, handleToggleReminderComplete,
        handleToggleSelectCustomer, handleToggleSelectAll, handleBulkUpdate, clearSelection,
        // Theme
        theme, toggleTheme,
        // Notification
        addNotification,
        addNotificationRef, // Return ref for provider
    };
};
// END: CUSTOM HOOK