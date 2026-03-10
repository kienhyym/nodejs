const Option = require("../models/option");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const createOption = async (req, res) => {

  try {

    const { questionId, content, isCorrect } = req.body;

    let imageUrl = null;

    if (req.file) {

      const file = req.file;

      const fileName = `option/${Date.now()}-${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await r2.send(command);

      imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    }

    const option = await Option.create({
      questionId,
      content,
      isCorrect,
      image: imageUrl
    });

    res.json({
      message: "Create option success",
      data: option
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Create option failed",
      error: error.message
    });

  }

};
const updateOption = async (req, res) => {

  try {

    const optionId = req.params.id;

    const option = await Option.findById(optionId);

    if (!option) {
      return res.status(404).json({
        message: "Option not found"
      });
    }

    const { content, isCorrect } = req.body;

    if (content) option.content = content;

    if (isCorrect !== undefined) option.isCorrect = isCorrect;

    if (req.file) {

      const file = req.file;

      const fileName = `option/${Date.now()}-${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await r2.send(command);

      option.image = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    }

    await option.save();

    res.json({
      message: "Update option success",
      data: option
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Update option failed",
      error: error.message
    });

  }

};
const getOptions = async (req, res) => {

  try {

    const options = await Option.find()
      .populate("questionId", "content");

    res.json({
      data: options
    });

  } catch (error) {

    res.status(500).json({
      message: "Get options failed"
    });

  }

};
const getOptionDetail = async (req, res) => {

  try {

    const option = await Option.findById(req.params.id);

    if (!option) {
      return res.status(404).json({
        message: "Option not found"
      });
    }

    res.json(option);

  } catch (error) {

    res.status(500).json({
      message: "Get option failed"
    });

  }

};
const deleteOption = async (req, res) => {

  try {

    const optionId = req.params.id;

    const option = await Option.findById(optionId);

    if (!option) {
      return res.status(404).json({
        message: "Option not found"
      });
    }

    await Option.findByIdAndDelete(optionId);

    res.json({
      message: "Delete option success"
    });

  } catch (error) {

    res.status(500).json({
      message: "Delete option failed"
    });

  }

};
module.exports = {
  createOption,
  updateOption,
  getOptions,
  getOptionDetail,
  deleteOption
};
