const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  },

  content: String,

  image: String,

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