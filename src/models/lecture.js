const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Lecture", lectureSchema);