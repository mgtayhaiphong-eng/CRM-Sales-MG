import React, { useMemo } from 'react';
import { Role, type User, type Customer, type Status } from '../types';
import { CUSTOMER_TIERS } from '../constants';
import { 
    Highlight, 
    PaginationControls, 
    SortableHeader, 
    EmptyState, 
    UsersIcon, 
    PlusIcon,
    SparklesIcon,
    Edit2Icon,
    Trash2Icon
} from '../components/UIComponents';

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
const ListView: React.FC<ListViewProps> = ({ customers, totalCustomers, statuses, onCustomerEdit, onCustomerDelete, onGenerateScript, onAddCustomer, users, currentUser, selectedUserId, onSelectedUserChange, searchTerm, selectedCustomerIds, onToggleSelectCustomer, onToggleSelectAll, sortConfig, handleSort, pagination, setPagination }) => {
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Chưa phân công';
    
    const areAllSelected = useMemo(() => {
        return customers.length > 0 && customers.every(c => selectedCustomerIds.has(c.id));
    }, [customers, selectedCustomerIds]);

    const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleDateString('vi-VN') : '---';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Danh sách Khách hàng ({totalCustomers})</h2>
                {currentUser.role === Role.ADMIN && (
                    <div>
                        <label htmlFor="user-filter" className="text-sm font-medium mr-2 dark:text-gray-300">NV Sales:</label>
                        <select id="user-filter" value={selectedUserId} onChange={e => onSelectedUserChange(e.target.value)} className="p-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                            <option value="all">Tất cả</option>
                            {users.filter(u => u.role === Role.USER).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="p-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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
                                <tr key={customer.id} className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedCustomerIds.has(customer.id) ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`}>
                                    <td className="w-4 p-4">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            checked={selectedCustomerIds.has(customer.id)}
                                            onChange={() => onToggleSelectCustomer(customer.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white"><Highlight text={customer.name} highlight={searchTerm} /></td>
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
                                        <button aria-label="Tạo kịch bản AI" onClick={() => onGenerateScript(customer)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors" title="Tạo kịch bản"><SparklesIcon className="w-5 h-5"/></button>
                                        <button aria-label="Chỉnh sửa" onClick={() => onCustomerEdit(customer)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Chỉnh sửa"><Edit2Icon className="w-5 h-5"/></button>
                                        <button aria-label="Xóa" onClick={() => onCustomerDelete([customer.id])} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors" title="Xóa"><Trash2Icon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {totalCustomers === 0 && (
                    <div className="border-t dark:border-gray-700">
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

export default ListView;
