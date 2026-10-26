import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho form Sự kiện
    const [eventTitle, setEventTitle] = useState('');
    const [eventCapacity, setEventCapacity] = useState('');
    const [editingEventId, setEditingEventId] = useState(null); // Nếu có ID tức là đang Sửa
    
    const navigate = useNavigate();

    const fetchData = () => {
        Promise.all([
            api.get('/admin/users'), 
            api.get('/admin/tickets'),
            api.get('/events')
        ]).then(([usersRes, ticketsRes, eventsRes]) => {
            setUsers(usersRes.data);
            setTickets(ticketsRes.data);
            setEvents(eventsRes.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (!savedUser || savedUser.system_role !== 'ADMIN') {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    // XỬ LÝ SỰ KIỆN
    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                // Sửa sự kiện
                await api.put(`/events/${editingEventId}`, { title: eventTitle, seat_capacity: Number(eventCapacity) });
                alert("Cập nhật thành công!");
            } else {
                // Thêm sự kiện mới
                await api.post('/events', { title: eventTitle, seat_capacity: Number(eventCapacity) });
                alert("Tạo sự kiện thành công!");
            }
            setEventTitle(''); setEventCapacity(''); setEditingEventId(null);
            fetchData();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    const handleEditEvent = (ev) => {
        setEventTitle(ev.title);
        setEventCapacity(ev.seat_capacity);
        setEditingEventId(ev.event_id);
        window.scrollTo(0, 0); // Cuộn lên form
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("CẢNH BÁO: Xóa sự kiện sẽ xóa toàn bộ vé của sự kiện này. Bạn chắc chắn chứ?")) return;
        try {
            await api.delete(`/events/${id}`);
            alert("Đã xóa sự kiện!");
            fetchData();
        } catch (err) { alert("Lỗi xóa sự kiện!"); }
    };

    // XỬ LÝ NGƯỜI DÙNG
    const handleEditUser = async (user) => {
        const newName = window.prompt("Nhập Họ Tên mới:", user.full_name);
        if (newName === null) return; // Bấm Cancel
        const newEmail = window.prompt("Nhập Email mới:", user.email);
        if (newEmail === null) return;

        try {
            await api.put(`/admin/users/${user.user_id}`, { 
                full_name: newName, 
                email: newEmail, 
                system_role: user.system_role 
            });
            alert("Cập nhật User thành công!");
            fetchData();
        } catch (err) { alert("Lỗi cập nhật User!"); }
    };

    // XỬ LÝ VÉ
    const handleDeleteTicket = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa vé này khỏi hệ thống?")) return;
        try {
            await api.delete(`/admin/tickets/${id}`);
            alert("Đã xóa vé!");
            fetchData();
        } catch (err) { alert("Lỗi xóa vé!"); }
    };

    if (loading) return <div className="text-center mt-20 text-xl font-semibold">Đang tải dữ liệu...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-3xl font-bold text-blue-800">Trang Quản Trị</h2>
                <div className="flex gap-3">
                    <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Trang Sinh Viên</Link>
                    <Link to="/scanner" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">Trạm Soát Vé</Link>
                </div>
            </div>

            {/* Form Thêm/Sửa Sự Kiện */}
            <div className={`bg-white p-6 rounded-xl shadow-md mb-8 border-l-4 ${editingEventId ? 'border-yellow-500' : 'border-green-500'}`}>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    {editingEventId ? "Cập Nhật Sự Kiện" : "Tạo Sự Kiện Mới"}
                </h3>
                <form onSubmit={handleSaveEvent} className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Tên sự kiện..." value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
                    <input type="number" placeholder="Sức chứa..." value={eventCapacity} onChange={e => setEventCapacity(e.target.value)} className="w-full md:w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className={`text-white px-6 py-2 rounded-lg font-semibold transition ${editingEventId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
                        {editingEventId ? "Lưu Thay Đổi" : "+ Thêm Mới"}
                    </button>
                    {editingEventId && (
                        <button type="button" onClick={() => { setEditingEventId(null); setEventTitle(''); setEventCapacity(''); }} className="bg-gray-400 text-white px-4 py-2 rounded-lg">
                            Hủy
                        </button>
                    )}
                </form>
            </div>

            {/* Quản lý Sự Kiện */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Quản lý Sự Kiện</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600">
                                <th className="p-3 border-b">ID</th>
                                <th className="p-3 border-b">Tên Sự Kiện</th>
                                <th className="p-3 border-b">Sức Chứa</th>
                                <th className="p-3 border-b text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev.event_id} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{ev.event_id}</td>
                                    <td className="p-3 border-b font-medium text-blue-700">{ev.title}</td>
                                    <td className="p-3 border-b">{ev.seat_capacity}</td>
                                    <td className="p-3 border-b text-center flex justify-center gap-2">
                                        <button onClick={() => handleEditEvent(ev)} className="bg-yellow-400 text-white px-3 py-1 rounded text-sm hover:bg-yellow-500">Sửa</button>
                                        <button onClick={() => handleDeleteEvent(ev.event_id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quản lý Người Dùng */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Danh sách Người Dùng</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600">
                                <th className="p-3 border-b">ID</th>
                                <th className="p-3 border-b">Họ Tên</th>
                                <th className="p-3 border-b">Email</th>
                                <th className="p-3 border-b text-center">Quyền</th>
                                <th className="p-3 border-b text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.user_id} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{u.user_id}</td>
                                    <td className="p-3 border-b font-medium">{u.full_name}</td>
                                    <td className="p-3 border-b">{u.email}</td>
                                    <td className="p-3 border-b text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.system_role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.system_role}
                                        </span>
                                    </td>
                                    <td className="p-3 border-b text-center">
                                        <button onClick={() => handleEditUser(u)} className="bg-yellow-400 text-white px-3 py-1 rounded text-sm hover:bg-yellow-500">Sửa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quản lý Vé */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Danh sách Vé đã phát hành</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600">
                                <th className="p-3 border-b">Mã Vé</th>
                                <th className="p-3 border-b">Sinh Viên</th>
                                <th className="p-3 border-b">Sự Kiện</th>
                                <th className="p-3 border-b text-center">Trạng Thái</th>
                                <th className="p-3 border-b text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(t => (
                                <tr key={t.ticket_id} className="hover:bg-gray-50">
                                    <td className="p-3 border-b font-mono text-blue-600 font-bold">{t.ticket_code}</td>
                                    <td className="p-3 border-b">{t.full_name}</td>
                                    <td className="p-3 border-b">{t.event_title}</td>
                                    <td className="p-3 border-b text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.checkin_status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : t.checkin_status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {t.checkin_status}
                                        </span>
                                    </td>
                                    <td className="p-3 border-b text-center">
                                        <button onClick={() => handleDeleteTicket(t.ticket_id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Hủy/Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}