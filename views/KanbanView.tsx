import React, { useState, useMemo } from 'react';
import { Role, type User, type Customer, type Status, type Reminder } from '../types';
import { CustomerCard, UserCircleIcon } from '../components/UIComponents';

const KanbanView: React.FC<{
    customers: Customer[],
    statuses: Status[],
    reminders: Reminder[],
    onCustomerEdit: (customer: Customer) => void,
    onCustomerUpdate: (id: string, updates: Partial<Customer>) => void,
    onDelete: (customerIds: string[]) => void,
    onAddInteraction: (customerId: string, interaction: Omit<any, 'id'>) => void,
    onDeleteInteraction: (customerId: string, interactionId: string) => void,
    onGenerateScript: (customer: Customer) => void,
    onOpenReminderModal: (customerId: string) => void,
    users: User[],
    searchTerm: string,
    selectedUserId: string,
    onSelectedUserChange: (userId: string) => void,
    currentUser: User | null,
    addNotification: (message: string, type: 'success' | 'error') => void,
}> = ({ customers, statuses, reminders, onCustomerEdit, onCustomerUpdate, onDelete, onAddInteraction, onDeleteInteraction, onGenerateScript, onOpenReminderModal, users, searchTerm, selectedUserId, onSelectedUserChange, currentUser, addNotification }) => {
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Pipeline Bán hàng</h2>
                {currentUser?.role === Role.ADMIN && (
                    <div>
                        <label htmlFor="user-filter-kanban" className="text-sm font-medium mr-2 dark:text-gray-300">NV Sales:</label>
                        <select
                            id="user-filter-kanban"
                            value={selectedUserId}
                            onChange={e => onSelectedUserChange(e.target.value)}
                            className="p-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
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
                        <div className="kanban-column flex-shrink-0 w-80 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-dashed border-gray-400 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-semibold flex items-center text-gray-800 dark:text-gray-200">
                                    <UserCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                    Chưa phân công
                                </h3>
                                <span className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">{unassignedCustomers.length}</span>
                            </div>
                             <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                                 {unassignedCustomers.length > 0 ? unassignedCustomers.map(customer => (
                                    <div key={customer.id} draggable onDragStart={() => setDraggedCustomerId(customer.id)}>
                                        <CustomerCard 
                                            customer={customer} statuses={statuses} reminders={reminders} onCustomerEdit={onCustomerEdit} onDelete={(ids) => onDelete(ids)} onStatusChange={ (id, newStatus) => onCustomerUpdate(id, {statusId: newStatus}) } onAddInteraction={onAddInteraction} onDeleteInteraction={onDeleteInteraction} onGenerateScript={onGenerateScript} onOpenReminderModal={onOpenReminderModal} users={users} searchTerm={searchTerm} currentUser={currentUser} addNotification={addNotification} />
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 rounded-lg h-full flex items-center justify-center">Không có khách hàng mới.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {statuses.sort((a, b) => a.order - b.order).map(status => (
                        <div key={status.id} className="kanban-column flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-900/70 rounded-xl p-3" onDrop={(e) => handleDrop(e, status.id)} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                             <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-semibold flex items-center text-gray-800 dark:text-gray-200">
                                    <span className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: status.color }}></span>
                                    {status.name}
                                </h3>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">{customersByStatus[status.id]?.length || 0}</span>
                            </div>
                            <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                                 {customersByStatus[status.id]?.length > 0 ? customersByStatus[status.id]?.map(customer => (
                                    <div key={customer.id} draggable onDragStart={() => setDraggedCustomerId(customer.id)}>
                                        <CustomerCard 
                                            customer={customer} statuses={statuses} reminders={reminders} onCustomerEdit={onCustomerEdit} onDelete={(ids) => onDelete(ids)} onStatusChange={ (id, newStatus) => onCustomerUpdate(id, {statusId: newStatus}) } onAddInteraction={onAddInteraction} onDeleteInteraction={onDeleteInteraction} onGenerateScript={onGenerateScript} onOpenReminderModal={onOpenReminderModal} users={users} searchTerm={searchTerm} currentUser={currentUser} addNotification={addNotification}/>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-700 rounded-lg">Kéo khách hàng vào đây</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KanbanView;
