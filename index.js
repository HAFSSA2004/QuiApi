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
    id: Number,  // ID personnalisé
    image: String,
    title: String,
    location: String,
    description: String,
    price: String,
    categorie: String,
    datePoster: String
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
    const { id } = req.params;
    console.log("ID reçu:", id);

    if (isNaN(id)) {
        return res.status(400).json({ error: "L'ID doit être un nombre valide." });
    }

    try {
        const produit = await Product.findOne({ id: Number(id) }); // ✅ Correction ici
        if (!produit) {
            return res.status(404).json({ error: "Produit non trouvé." });
        }
        res.json(produit);
    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// ➤ Add a new product
// ➤ Add a new product
app.post("/products", async (req, res) => {
    try {
        const { id, image, title, location, description, price, categorie, datePoster } = req.body;

        // Vérification des champs requis
        if (!title || !price || !location || !categorie) {
            return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires." });
        }

        const newProduct = new Product({
            id,
            image,
            title,
            location,
            description,
            price,
            categorie,
            datePoster
        });

        await newProduct.save();
        res.status(201).json({ message: "Produit ajouté avec succès !" });
    } catch (error) {
        console.error("Erreur lors de l'ajout du produit:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
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
