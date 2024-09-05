const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    image: { type: String }, // This should handle URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
