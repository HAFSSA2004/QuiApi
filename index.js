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
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Product Schema
const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    image: String,
    title: String,
    location: String,
    description: String,
    price: { type: Number, required: true },
    categorie: String,
    datePoster: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }

});
  
const Product = mongoose.model("produits", productSchema); // Collection: "produits"
app.get("/", (req, res) => {
    res.send("Welcome to the API! Use /products to get data.");
});

app.get("/products/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("User ID reçu :", userId);

        // Vérifier si l'ID est valide  
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "ID utilisateur invalide." });
        }

        // Convertir userId en ObjectId pour la requête
        const objectId = new mongoose.Types.ObjectId(userId);

        // Trouver les produits associés à cet utilisateur
        const userProducts = await Product.find({ userId: objectId });

        console.log("Produits trouvés :", userProducts);

        if (userProducts.length === 0) {
            return res.status(404).json({ message: "Aucune annonce trouvée pour cet utilisateur." });
        }

        res.status(200).json(userProducts);
    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ error: err.message });
    }
});
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["seller", "admin"] },
    adminKey: { type: String }  // Uniquement pour les admins
});
const User = mongoose.model("users", userSchema); // Collection: "users"


// ➤ Login Route   
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (user.role === "admin") {
            return res.json({ message: "Welcome Admin", role: "admin", space: "/admin-space" });
        } else {
            return res.json({ message: "Welcome Seller", role: "seller", space: "/seller-space" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});


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