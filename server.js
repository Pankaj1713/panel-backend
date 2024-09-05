const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors"); // Import cors
const Product = require("./models/Product");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS with unrestricted access
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/ecommerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

const upload = multer({ storage: storage });

app.post("/api/products", async (req, res) => {
  try {
    console.log("Received body:", req.body); // Log the request body

    const { name, description, price, category, inStock, image } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, and category are required" });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      inStock,
      image,
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// GET route to retrieve all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve products" });
  }
});

// PUT route to update a product by ID
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, inStock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.inStock = inStock !== undefined ? inStock : product.inStock;

    // If a new image is provided, delete the old one and update the path
    if (req.file) {
      if (product.image) {
        fs.unlinkSync(product.image); // Delete the old image
      }
      product.image = req.file.path;
    }

    await product.save();

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE route to delete a product by ID
app.delete("/api/products/:id", async (req, res) => {
  try {
    console.log("Attempting to delete product with ID:", req.params.id);

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete the image file if it exists
    if (product.image) {
      try {
        fs.unlinkSync(product.image); // Delete the old image
        console.log("Image deleted:", product.image);
      } catch (fileErr) {
        console.error("Failed to delete image:", fileErr);
        // Optionally continue or return an error
      }
    }

    await Product.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
