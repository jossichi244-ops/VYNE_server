const mongoose = require("mongoose");

const geoSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

const pickupSchema = new mongoose.Schema({
  address: { type: String },
  country_code: {
    type: String,
    match: /^[A-Z]{2}$/,
    required: true,
  },
  geo: {
    type: geoSchema,
    required: true,
    // ✅ Cho phép client gửi [lon, lat]
    set: (v) => (Array.isArray(v) ? { type: "Point", coordinates: v } : v),
  },
  earliest: { type: Date, required: true },
  latest: { type: Date },
});

const deliverySchema = new mongoose.Schema({
  address: { type: String },
  country_code: {
    type: String,
    match: /^[A-Z]{2}$/,
    required: true,
  },
  geo: {
    type: geoSchema,
    required: true,
    // ✅ Cho phép client gửi [lon, lat]
    set: (v) => (Array.isArray(v) ? { type: "Point", coordinates: v } : v),
  },
  latest: { type: Date, required: true },
});

const cargoSchema = new mongoose.Schema({
  description: { type: String },
  weight_kg: { type: Number, required: true, min: 0 },
  volume_m3: { type: Number, required: true, min: 0 },
  is_hazardous: { type: Boolean, default: false },
  msds_cid: { type: String },
  temperature_required: { type: Number },
  stackable: { type: Boolean, default: true },
});

const preferencesSchema = new mongoose.Schema({
  max_price_usd: { type: Number },
  allow_consolidation: { type: Boolean, default: true },
  require_empty_container_return: { type: Boolean, default: false },
});

const recommendationSchema = new mongoose.Schema({
  company_id: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  reasons: [
    {
      type: String,
      enum: [
        "in_service_area",
        "has_required_capability",
        "available_now",
        "good_on_time_rate",
        "accepts_hazardous",
        "offers_consolidation",
        "has_empty_container_near_pickup",
      ],
    },
  ],
  estimated_price_usd: { type: Number },
  estimated_transit_hours: { type: Number },
});

const requestSchema = new mongoose.Schema({
  customer_wallet: {
    type: String,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
  },
  pickup: { type: pickupSchema, required: true },
  delivery: { type: deliverySchema, required: true },
  cargo: { type: cargoSchema, required: true },
  preferences: { type: preferencesSchema },
});

const transportRecommendationSchema = new mongoose.Schema(
  {
    request: { type: requestSchema, required: true },
    recommendations: [recommendationSchema],
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    created_at: { type: Date, required: true, default: Date.now },
    processed_at: { type: Date },
  },
  {
    timestamps: false,
    collection: "transport_recommendations",
  }
);

// Add geospatial index for pickup and delivery
transportRecommendationSchema.index({ "request.pickup.geo": "2dsphere" });
transportRecommendationSchema.index({ "request.delivery.geo": "2dsphere" });

// ✅ Export theo chuẩn CommonJS
module.exports = mongoose.model(
  "TransportRecommendation",
  transportRecommendationSchema
);
