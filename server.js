const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// 中间件设置
app.use(express.json());
app.use(express.static('.'));

// 保存数据的API端点
app.post('/api/save-data', async (req, res) => {
    try {
        const data = req.body;
        await fs.writeFile(
            path.join(__dirname, 'data', 'unified_services.json'),
            JSON.stringify(data, null, 2),
            'utf8'
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 