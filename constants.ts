
export const VIETNAM_CITIES = [ 'Hà Nội', 'TP Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông' ];

export const CUSTOMER_TIERS = [
    { value: 'HOT', label: 'HOT - Tiềm năng Cao', color: 'text-red-600', reminderDays: 3 },
    { value: 'WARM', label: 'WARM - Đang Chăm sóc', color: 'text-yellow-600', reminderDays: 5 },
    { value: 'COLD', label: 'COLD - Khách hàng Mới', color: 'text-indigo-600', reminderDays: 7 },
    { value: 'LOST', label: 'LOST - Đã Lostsale/Thất bại', color: 'text-gray-600', reminderDays: 0 },
] as const;
