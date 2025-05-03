const express = require("express");
const { default: mongoose } = require("mongoose");
const router = express.Router();

// Import the Recipe model
require("../models/Recipes");
const Recipes = mongoose.model("Recipe");

/* Main route. */
router.get("/", (req, res, next) => {
  res.send(`
        <h1>Connected to the server/recipes</h1>
        ${
          process.env.NODE_ENV === "production"
            ? "<h2>Production Mode</h2>"
            : "<h2>Development Mode</h2>"
        }
    `);
});

// Get all recipes
router.get("/all", async (req, res, next) => {
  const filter = {};
  try {
    const recipes = await Recipes.find(filter);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recipes and paginate
router.get("/paginate", async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const filter = {};

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return res.status(400).json({ error: "Invalid page or limit" });
  }
  try {
    const totalRecipes = await Recipes.countDocuments(filter);
    const recipes = await Recipes.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json({
      data: recipes,
      currentPage: pageNum,
      totalPages: Math.ceil(totalRecipes / limitNum),
      hasNextPage: pageNum * limitNum < totalRecipes,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get 6 random recipes for homepage carousel
router.get("/random", async (req, res, next) => {
  const filter = [{ $sample: { size: 6 } }];
  try {
    const recipes = await Recipes.aggregate(filter);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a recipe by ID array of ids
// router.get('/:id', async (req, res) => {
//   try {
//     const id = Number(req.params.id);            // 131 → 131

//     const recipe = await Recipes.findOne({ id }); //  ← custom field, not _id

//     if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
//     res.json(recipe);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

router.get("/ids", async (req, res) => {
  try {
    // Accept comma-separated list or repeated query keys
    let ids = req.query.ids;
    if (!ids)
      return res.status(400).json({ message: "ids query param required" });

    if (Array.isArray(ids)) ids = ids.flat(); // ids[]=131&ids[]=205…
    if (typeof ids === "string") ids = ids.split(",");

    const numericIds = ids.map(Number).filter(Boolean); // [131,205,402]

    const recipes = await Recipes.find({ id: { $in: numericIds } }).lean();
    res.json(recipes); // array of docs
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Create a new recipe
router.post("/addNew", async (req, res) => {
  try {
    const recipe = await Recipes.create(req.body);
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
