const { sql, poolPromise } = require('../config/db');

// Lấy danh sách tất cả sự kiện
exports.getAllEvents = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM EVENTS ORDER BY event_id DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Tạo sự kiện mới (Dành cho Admin)
exports.createEvent = async (req, res) => {
    const { title, seat_capacity } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('title', sql.NVarChar(200), title)
            .input('seat_capacity', sql.Int, seat_capacity)
            .query("INSERT INTO EVENTS (title, seat_capacity, status) VALUES (@title, @seat_capacity, 'OPEN')");
        
        res.status(201).json({ success: true, message: "Tạo sự kiện mới thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Cập nhật sự kiện
exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, seat_capacity } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar(200), title)
            .input('seat_capacity', sql.Int, seat_capacity)
            .query("UPDATE EVENTS SET title = @title, seat_capacity = @seat_capacity WHERE event_id = @id");
        res.json({ success: true, message: "Cập nhật sự kiện thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Xóa sự kiện
exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        // Bắt buộc phải xóa vé trước để tránh lỗi khóa ngoại (Foreign Key)
        await pool.request().input('id', sql.Int, id).query("DELETE FROM TICKETS WHERE event_id = @id");
        // Sau đó mới xóa sự kiện
        await pool.request().input('id', sql.Int, id).query("DELETE FROM EVENTS WHERE event_id = @id");
        
        res.json({ success: true, message: "Xóa sự kiện và các vé liên quan thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};