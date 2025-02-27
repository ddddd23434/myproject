const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаём статические файлы (HTML, JS, CSS и т. д.)
app.use(express.static(path.join(__dirname, "public")));

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
