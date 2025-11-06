const TransportRecommendation = require("../models/transportRecommendation.js");
const User = require("../models/User.js");
const CompanyRegistration = require("../models/CompanyRegistration.js");

const processTransportRecommendations = async (req, res) => {
  try {
    // Tìm các yêu cầu pending
    let pendingRequests = await TransportRecommendation.find({
      status: "pending",
    });

    // Nếu chưa có yêu cầu nào pending, khởi tạo mới từ request body
    if (pendingRequests.length === 0) {
      if (!req.body.request) {
        return res.status(400).json({
          error:
            "Không có yêu cầu nào đang pending và request mới không được cung cấp.",
        });
      }

      const newRequest = new TransportRecommendation({
        request: req.body.request,
        status: "pending",
        created_at: new Date(),
      });
      await newRequest.save();

      pendingRequests = [newRequest]; // gán để xử lý tiếp
    }
    const summary = {
      processed: 0,
      deleted_invalid_users: 0,
      invalid_roles: 0,
      no_eligible_companies: 0,
    };
    const processedResults = [];

    for (const requestDoc of pendingRequests) {
      const { request } = requestDoc;

      // 1️⃣ Xác minh người dùng
      const user = await User.findOne({
        wallet_address: request.customer_wallet,
      });

      if (!user) {
        console.log(
          `⚠️ Không tìm thấy người dùng với ví ${request.customer_wallet} → Xóa request khỏi DB`
        );
        await TransportRecommendation.deleteOne({ _id: requestDoc._id });
        summary.deleted_invalid_users++;
        processedResults.push({
          request_id: requestDoc._id,
          status: "deleted_invalid_user",
          reason: "Ví khách hàng không tồn tại trong hệ thống người dùng.",
        });
        continue;
      }

      const ownerRole = user.roles.find(
        (r) => r.role_type === "company_owner" && r.status === "active"
      );

      if (!ownerRole) {
        console.log(
          `🚫 Wallet ${request.customer_wallet} không có quyền truy cập — chỉ company_owner mới được tìm đối tác vận chuyển.`
        );
        requestDoc.status = "failed";
        console.log(
          `⚠️ Không tìm thấy người dùng với ví ${request.customer_wallet} có role owner → Xóa request khỏi DB`
        );
        await TransportRecommendation.deleteOne({ _id: requestDoc._id });
        summary.invalid_roles++;
        processedResults.push({
          request_id: requestDoc._id,
          status: "invalid_role",
          reason:
            "Người dùng không có quyền 'company_owner' để tạo yêu cầu vận chuyển.",
        });
        continue;
      }

      const requestingCompanyId = ownerRole?.entity_id;

      // 2️⃣ Lấy thông tin công ty gửi yêu cầu
      const requestingCompany = await CompanyRegistration.findOne({
        company_id: requestingCompanyId,
      });

      const requestingCompanyName = requestingCompany?.business_name;

      // 3️⃣ Lấy danh sách công ty vận chuyển đủ điều kiện
      const eligibleCompanies = await CompanyRegistration.aggregate([
        {
          $match: {
            status: "approved",
            type: { $in: ["carrier", "logistics_provider"] },
          },
        },
        {
          $match: {
            $or: [
              { "address.country": request.pickup.country_code },
              { "address.country": request.delivery.country_code },
            ],
          },
        },
        {
          $match: {
            $expr: request.cargo.is_hazardous
              ? { $ne: ["$type", "other"] }
              : { $eq: ["$status", "approved"] },
          },
        },
        {
          $addFields: {
            compatibility_score: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "carrier"] }, then: 0.9 },
                  { case: { $eq: ["$type", "logistics_provider"] }, then: 0.8 },
                ],
                default: 0.5,
              },
            },
          },
        },
        { $sort: { compatibility_score: -1 } },
        { $limit: 20 },
      ]);

      if (!eligibleCompanies || eligibleCompanies.length === 0) {
        console.log(
          `⚠️ Không tìm thấy công ty vận chuyển phù hợp cho yêu cầu từ ${requestingCompanyName}`
        );
        summary.no_eligible_companies++;
        processedResults.push({
          request_id: requestDoc._id,
          status: "no_eligible_companies",
          reason:
            "Không tìm thấy đơn vị vận chuyển phù hợp với tuyến đường hoặc yêu cầu hàng hóa.",
        });
        continue;
      }
      requestDoc.status = "no_eligible_companies";
      // 4️⃣ Tạo danh sách gợi ý
      const recommendations = eligibleCompanies.map((comp) => ({
        company_id: comp.company_id,
        score: comp.compatibility_score,
        reasons: ["in_service_area", "has_required_capability"],
        estimated_price_usd: request.cargo.weight_kg * 10,
        estimated_transit_hours: 48,
      }));

      // 5️⃣ Cập nhật document
      requestDoc.recommendations = recommendations;
      requestDoc.status = "processed";
      requestDoc.processed_at = new Date();
      await requestDoc.save();
      summary.processed++;
      processedResults.push({
        request_id: requestDoc._id,
        company: requestingCompanyName,
        status: "processed",
        total_recommendations: recommendations.length,
      });
    }

    res.status(200).json({
      message: "✅ Đã xử lý yêu cầu vận chuyển.",
      processed_count: processedResults.length,
      details: processedResults,
    });
  } catch (err) {
    console.error("❌ Error processing transport recommendations:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
};

module.exports = { processTransportRecommendations };
