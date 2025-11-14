const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/transportOrder");

// Cấu hình multer để lưu ảnh tạm trong bộ nhớ
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/",
  upload.array("images"), // Multer nhận ảnh
  async (req, res, next) => {
    try {
      // Nếu bạn gửi JSON trong key 'data', parse nó
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      // Đưa file buffer vào req.body.pickup_images
      if (req.files && req.files.length > 0) {
        req.body.pickup_images = req.files.map((f) =>
          f.buffer.toString("base64")
        );
      }

      await controller.createOrder(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/orders — Lấy tất cả đơn hàng
router.get("/", controller.getAllOrders);

// GET /api/orders/:id — Lấy chi tiết đơn hàng
router.get("/:id", controller.getOrderById);

// PUT /api/orders/:id/status — Cập nhật trạng thái đơn hàng
router.put("/:id/status", controller.updateOrderStatus);

module.exports = router;
