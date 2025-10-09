import React, { useState, useMemo } from 'react';
import type { Customer, Reminder } from '../types';
import {
    EmptyState,
    PlusIcon,
    CheckCircleIcon,
    Edit2Icon,
    Trash2Icon,
    BellIcon,
    BotIcon
} from '../components/UIComponents';

const RemindersView: React.FC<{
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
    const formatDateTime = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '---';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Quản lý Nhắc hẹn</h2>
                <div className="flex items-center space-x-2">
                     <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${filter === 'pending' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}>Chưa xong</button>
                        <button onClick={() => setFilter('completed')} className={`px-3 py-1 text-sm rounded-md ${filter === 'completed' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}>Đã xong</button>
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}>Tất cả</button>
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
                         <div key={reminder.id} className={`p-4 border dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between transition ${reminder.completed ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70' : 'bg-white dark:bg-gray-800'}`}>
                            <div className="flex items-start">
                                <button aria-label="Đánh dấu hoàn thành" onClick={() => onToggleComplete(reminder.id)} className={`mr-4 mt-1 flex-shrink-0 ${reminder.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-green-500'}`}>
                                    {reminder.completed ? <CheckCircleIcon className="w-6 h-6"/> : <div className="w-6 h-6 rounded-full border-2 border-current"></div>}
                                 </button>
                                 <div>
                                     <p className={`font-semibold flex items-center ${isOverdue ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'} ${reminder.completed ? 'line-through' : ''}`}>
                                        {reminder.title}
                                        {reminder.isAuto && <span title="Nhắc hẹn tự động" className="ml-2 text-indigo-500 dark:text-indigo-400"><BotIcon className="w-4 h-4"/></span>}
                                    </p>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reminder.description}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                          KH: <strong className="text-indigo-600 dark:text-indigo-400">{customer?.name || '...'}</strong> | 
                                          Hạn: <span className={`font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{formatDateTime(reminder.dueDate)}</span>
                                     </p>
                                 </div>
                             </div>
                             <div className="flex items-center space-x-1 flex-shrink-0 ml-auto sm:ml-4 mt-3 sm:mt-0">
                                <span className={`px-2 py-1 text-xs rounded-full ${reminder.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>{reminder.priority}</span>
                                <button aria-label="Chỉnh sửa" onClick={() => onOpenReminderModal(null, reminder)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full"><Edit2Icon className="w-4 h-4" /></button>
                                <button aria-label="Xóa" onClick={() => onDelete(reminder.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                }) : <EmptyState icon={<BellIcon className="w-12 h-12" />} title="Không có nhắc hẹn nào" message="Mọi thứ đều được kiểm soát. Hãy thêm nhắc hẹn mới để không bỏ lỡ cơ hội." action={<button onClick={() => onOpenReminderModal(null)} className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto"><PlusIcon className="w-4 h-4 mr-2" /> Thêm nhắc hẹn</button>} /> }
            </div>
        </div>
    );
};

export default RemindersView;
