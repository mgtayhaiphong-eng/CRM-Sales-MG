import React, { useMemo } from 'react';
import type { CrmData, User } from '../types';
import { ReportCard, BarChart, PieChart, formatCurrency } from '../components/UIComponents';

const EmployeeSalesReport: React.FC<{crmData: CrmData, users: User[], onExport: (data: any[], filename: string) => void, theme: string}> = ({crmData, users, onExport, theme}) => {
    const deliveredStatusIds = crmData.statuses.filter(s => s.type === 'delivered').map(s => s.id);
    const salesUsers = users.filter(u => u.role === 'user');
    
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
                    <BarChart data={chartData} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} theme={theme} />
                </div>
                <div className="overflow-x-auto max-h-60 custom-scrollbar">
                    <table className="w-full text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{reportData.map((row, i) => <tr key={i}>{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 1 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};


const CarModelPerformanceReport: React.FC<{crmData: CrmData, onExport: (data: any[], filename: string) => void, theme: string}> = ({crmData, onExport, theme}) => {
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
                    <PieChart data={chartData} theme={theme} />
                </div>
                 <div className="overflow-x-auto max-h-60 custom-scrollbar">
                     <table className="w-full text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{reportData.map((row, i) => <tr key={i}>{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 2 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    )
};

const LeadSourceReport: React.FC<{crmData: CrmData, onExport: (data: any[], filename: string) => void, theme: string}> = ({crmData, onExport, theme}) => {
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
                    <BarChart data={chartData} options={{ plugins: { legend: { display: false } } }} theme={theme} />
                </div>
                 <div className="overflow-x-auto max-h-60 custom-scrollbar">
                     <table className="w-full text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{reportData.map((row, i) => <tr key={i}>{Object.values(row).map((val, j) => <td key={j} className="p-2">{typeof val === 'number' && j === 2 ? formatCurrency(val) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};

const CacLtvReport: React.FC<{ crmData: CrmData; onExport: (data: any[], filename: string) => void, theme: string }> = ({ crmData, onExport, theme }) => {
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
                    <BarChart data={chartData} options={{ plugins: { legend: { display: false } } }} theme={theme} />
                </div>
                <div className="overflow-x-auto max-h-60 custom-scrollbar">
                    <table className="w-full text-sm text-gray-700 dark:text-gray-300">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>{Object.keys(reportData[0] || {}).map(h => <th key={h} className="p-2 text-left font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{reportData.map((row, i) => <tr key={i}>{Object.values(row).map((val, j) => <td key={j} className="p-2">{j > 1 && typeof val === 'number' ? (j === 4 ? val.toFixed(2) : formatCurrency(val)) : val}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </ReportCard>
    );
};

const ReportsView: React.FC<{crmData: CrmData, users: User[], theme: string}> = ({crmData, users, theme}) => {
    
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
             <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Báo cáo & Phân tích</h1>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <EmployeeSalesReport crmData={crmData} users={users} onExport={exportToCSV} theme={theme} />
                 <CarModelPerformanceReport crmData={crmData} onExport={exportToCSV} theme={theme} />
                 <LeadSourceReport crmData={crmData} onExport={exportToCSV} theme={theme} />
                 <CacLtvReport crmData={crmData} onExport={exportToCSV} theme={theme} />
            </div>
        </div>
    )
};

export default ReportsView;
