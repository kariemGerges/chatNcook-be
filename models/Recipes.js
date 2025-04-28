const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const recipeSchema = new Schema({
  id: { type: Number, unique: true, required: true, index: true },

  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  ingredients: {
    type: [String],
    required: true,
  },
  preparation_steps: {
    type: String,
    required: true,
  },
  preparation_time: {
    type: String,
    required: true,
  },
  country_of_origin: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

mongoose.model('Recipe', recipeSchema);
