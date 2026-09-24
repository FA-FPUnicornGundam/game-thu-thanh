# Thành Trì Bình Minh

Vertical slice tower defense chạy trên RPG Maker MZ 1.8.1 (runtime core 1.6.1 của sample asset).

## Chạy

Mở `TowerDefenseVN\game.rmmzproject` bằng RPG Maker MZ hoặc chạy `index.html` bằng NW.js đi kèm MZ.

## Cách chơi

- Click vào các vòng tròn xanh trên bản đồ để xây **Tháp canh** (60 vàng).
- Nhấn **Enter** để gọi đợt kẻ địch tiếp theo.
- Tháp tự động bắn mục tiêu gần căn cứ trong bán kính 150 pixel.
- Hạ địch nhận 20 vàng; bảo vệ căn cứ qua 5 đợt để thắng.
- Nếu máu căn cứ về 0 là thua; nhấn **R** để chơi lại.

Logic vertical slice nằm trong `js/plugins/TowerDefenseVN.js`; bản đồ nền sử dụng tileset/audio/ảnh có sẵn trong sample project, không thay thế hàng loạt asset.
