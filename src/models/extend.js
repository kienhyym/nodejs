const mongoose = require("mongoose");

const extendSchema = new mongoose.Schema({

  title: String,

  link: String,

  videoUrl: String,
  
  fileName: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Extend", extendSchema);