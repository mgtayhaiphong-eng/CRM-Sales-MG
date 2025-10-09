import React, { useMemo, useRef, useEffect } from 'react';
import { Chart } from 'chart.js';
import type { Customer, Status, Reminder } from '../types';
import { 
    StatCard, 
    EmptyState,
    CheckCircleIcon,
    DollarSignIcon,
    TrendingUpIcon,
    UsersIcon,
    TargetIcon,
    Edit2Icon,
    Trash2Icon,
} from '../components/UIComponents';

const UpcomingReminders: React.FC<{
    reminders: Reminder[],
    customers: Customer[],
    onEdit: (reminder: Reminder) => void,
    onToggleComplete: (id: string) => void,
    onDelete: (id: string) => void,
    onOpenCustomer: (customer: Customer) => void,
}> = ({ reminders, customers, onEdit, onToggleComplete, onDelete, onOpenCustomer }) => {
    const pendingReminders = useMemo(() => {
        return [...reminders]
            .filter(r => !r.completed)
            .sort((a, b) => a.dueDate - b.dueDate)
            .slice(0, 5); // Show top 5 upcoming
    }, [reminders]);

    const getCustomer = (id: string) => customers.find(c => c.id === id);
    const formatDateTime = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '---';

    if (pendingReminders.length === 0) {
        return (
            <EmptyState
                icon={<CheckCircleIcon className="w-12 h-12" />}
                title="Không có nhắc hẹn nào"
                message="Mọi thứ đều được kiểm soát! Bạn không có nhắc hẹn nào sắp tới."
            />
        );
    }

    return (
        <div className="space-y-3">
            {pendingReminders.map(reminder => {
                const customer = getCustomer(reminder.customerId);
                const isOverdue = reminder.dueDate < Date.now();
                return (
                    <div key={reminder.id} className="p-3 border dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-center justify-between transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start flex-grow">
                            <button aria-label="Đánh dấu hoàn thành" onClick={() => onToggleComplete(reminder.id)} className="mr-4 mt-1 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-green-500">
                                <div className="w-6 h-6 rounded-full border-2 border-current"></div>
                            </button>
                            <div className="flex-grow">
                                <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>{reminder.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    KH: <button onClick={() => customer && onOpenCustomer(customer)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{customer?.name || '...'}</button> | Hạn: <span className={`font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{formatDateTime(reminder.dueDate)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                            <button aria-label="Chỉnh sửa" onClick={() => onEdit(reminder)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full"><Edit2Icon className="w-4 h-4" /></button>
                            <button aria-label="Xóa" onClick={() => onDelete(reminder.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const SalesOverTimeChart: React.FC<{customers: Customer[], statuses: Status[], theme: string}> = ({ customers, statuses, theme }) => {
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

        const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400, slate-500
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

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
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1, color: textColor },
                        grid: { color: gridColor }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
        
         return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [customers, statuses, theme]);

    return <canvas ref={chartRef} />;
};


const PipelineDistributionChart: React.FC<{customers: Customer[], statuses: Status[], theme: string}> = ({ customers, statuses, theme }) => {
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
         
        const textColor = theme === 'dark' ? '#e2e8f0' : '#334155'; // slate-200, slate-700

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Số lượng KH',
                    data,
                    backgroundColor: colors,
                    hoverOffset: 4,
                    borderColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            boxWidth: 12, 
                            padding: 15,
                            color: textColor
                        } 
                    } 
                } 
            }
        });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [customers, statuses, theme]);

    return <canvas ref={chartRef} />;
};

const DashboardView: React.FC<{
    customers: Customer[],
    statuses: Status[],
    reminders: Reminder[],
    onEditReminder: (reminder: Reminder) => void,
    onToggleComplete: (id: string) => void,
    onDeleteReminder: (id: string) => void,
    onOpenCustomer: (customer: Customer) => void,
    theme: string,
}> = ({ customers, statuses, reminders, onEditReminder, onToggleComplete, onDeleteReminder, onOpenCustomer, theme }) => {
    
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

        const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

        return {
            newCustomersThisMonth,
            totalRevenue: formatCurrency(totalRevenue),
            carsSold: totalDelivered.length,
            conversionRate: closedCustomersCount > 0 ? ((wonCustomersCount / closedCustomersCount) * 100).toFixed(1) + '%' : '0%',
        };
    }, [customers, statuses]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Tổng quan</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Doanh thu tháng" value={stats.totalRevenue} icon={<DollarSignIcon />} />
                 <StatCard title="Xe đã bán" value={stats.carsSold.toString()} icon={<TrendingUpIcon />} />
                 <StatCard title="KH mới trong tháng" value={stats.newCustomersThisMonth.toString()} icon={<UsersIcon />} />
                 <StatCard title="Tỷ lệ chuyển đổi" value={stats.conversionRate} icon={<TargetIcon />} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Hoạt động Bán hàng (30 ngày qua)</h3>
                     <div className="chart-container">
                        <SalesOverTimeChart customers={customers} statuses={statuses} theme={theme} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Phân bổ Pipeline</h3>
                     <div className="chart-container">
                        <PipelineDistributionChart customers={customers} statuses={statuses} theme={theme} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Nhắc hẹn sắp tới</h3>
                <UpcomingReminders reminders={reminders} customers={customers} onEdit={onEditReminder} onToggleComplete={onToggleComplete} onDelete={onDeleteReminder} onOpenCustomer={onOpenCustomer} />
            </div>
        </div>
    );
};

export default DashboardView;