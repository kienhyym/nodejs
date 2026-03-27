const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({

  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  },

  content: String,

  imageUrl: String,

  fileName: String,

  isCorrect: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Option", optionSchema);