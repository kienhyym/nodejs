const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema({

  title: String,

  link: String,

  imageUrl: String,
  
  fileName: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Knowledge", knowledgeSchema);