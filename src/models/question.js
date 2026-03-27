const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "exam"
  },

  content: String,

  imageUrl: String,

  fileName: String,

  type: {
    type: String,
    enum: ["single", "multiple"],
    default: "single"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Question", questionSchema);