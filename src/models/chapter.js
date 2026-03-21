const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  name: String,
  status: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Chapter", chapterSchema);