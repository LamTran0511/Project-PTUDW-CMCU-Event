const { sql, poolPromise } = require('../config/db');

// API lấy danh sách người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT u.user_id, u.student_code, u.full_name, u.email, u.system_role,
                (SELECT COUNT(*) FROM TICKETS t WHERE t.student_id = u.user_id) AS total_tickets
            FROM USERS u ORDER BY u.user_id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// API lấy danh sách toàn bộ vé
exports.getAllTickets = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.ticket_id, t.ticket_code, t.checkin_status, t.registered_at, 
                   u.full_name, e.title AS event_title
            FROM TICKETS t
            INNER JOIN USERS u ON t.student_id = u.user_id
            INNER JOIN EVENTS e ON t.event_id = e.event_id
            ORDER BY t.registered_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, system_role } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('full_name', sql.NVarChar(100), full_name)
            .input('email', sql.VarChar(100), email)
            .input('system_role', sql.VarChar(20), system_role)
            .query("UPDATE USERS SET full_name = @full_name, email = @email, system_role = @system_role WHERE user_id = @id");
        res.json({ success: true, message: "Cập nhật người dùng thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Xóa vé (Admin hủy vé của sinh viên)
exports.deleteTicket = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query("DELETE FROM TICKETS WHERE ticket_id = @id");
        res.json({ success: true, message: "Đã xóa vé khỏi hệ thống!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};