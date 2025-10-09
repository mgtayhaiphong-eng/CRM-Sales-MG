import React from 'react';
import type { User, CrmData } from '../types';
import { EditableSettingList } from '../components/UIComponents';

const SettingsView: React.FC<{
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
    
    const handleSettingsUpdate = (key: keyof CrmData, updatedData: any[]) => {
        // @ts-ignore
        setCrmData(prev => ({...prev, [key]: updatedData }));
    }

    return (
         <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Cài đặt Hệ thống</h1>
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-lg text-red-700 dark:text-red-500 mb-2">Vùng nguy hiểm</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Các hành động này không thể hoàn tác. Hãy cẩn thận.</p>
                <div className="flex space-x-4">
                    <button onClick={handleResetAllData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Xóa Dữ liệu Khách hàng</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
