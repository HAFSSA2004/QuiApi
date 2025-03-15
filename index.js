require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas 
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Product Schema
const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true }, // Ensure id is unique and required
    image: String,
    title: String,  
    location: String,
    description: String,
    price: { type: Number, required: true },  // ✅ Ensure price is required
    categorie: String,
    datePoster: { type: Date, default: Date.now }, 
});

  
const Product = mongoose.model("produits", productSchema); // Collection: "produits"

// ➤ Get all products
app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Get a single product by ID
app.get("/produits/:id", async (req, res) => {
    const id = Number(req.params.id);
    console.log("🔍 Received request for ID:", id);  // ✅ Log incoming request

    if (isNaN(id)) {
        console.log("❌ Invalid product ID:", req.params.id);
        return res.status(400).json({ error: "Invalid product ID." });
    }

    try {
        const produit = await Product.findOne({ id: id });
        console.log("📋 Query result:", produit);  // ✅ Log what MongoDB returns

        if (!produit) {
            console.log("❌ Product not found in database.");
            return res.status(404).json({ error: "Product not found." });
        }

        console.log("✅ Product found:", produit);
        res.json(produit);
    } catch (error) {
        console.error("❌ Error fetching product:", error);
        res.status(500).json({ error: "Server error." });
    }
});

// ➤ Add a new product (INSERT)
app.post("/products", async (req, res) => {
    try {
        const { id, image, title, location, description, price, categorie } = req.body;

        if (!id || isNaN(Number(id)) || !image || !title || !location || !description || isNaN(price) || !categorie) {
            return res.status(400).json({ error: "All fields are required and price & id must be numbers." });
        }

        const existingProduct = await Product.findOne({ id: Number(id) });
        if (existingProduct) {
            return res.status(400).json({ error: "A product with this ID already exists." });
        }

        const newProduct = new Product({
            id: Number(req.body.id), // Convert id to Number
            image: req.body.image,
            title: req.body.title,
            location: req.body.location,
            description: req.body.description,
            price: Number(req.body.price), // ✅ Convert price to Number
            categorie: req.body.categorie,
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({ message: "Product added successfully!", product: savedProduct });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ➤ Update a product by ID
app.put("/products/:id", async (req, res) => {
    const productId = Number(req.params.id);

    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            req.body,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Delete a product by ID
app.delete("/products/:id", async (req, res) => {
    const productId = Number(req.params.id);

    try {
        const deletedProduct = await Product.findOneAndDelete({ id: productId });

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
module.exports = app;