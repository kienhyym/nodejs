const Chapter = require("../models/chapter");
const Lecture = require("../models/lecture");

const createChapter = async (req, res) => {

  try {

    const { title, name,status } = req.body;

    if (!title) {
      return res.status(500).json({
        message: "Chưa nhập tiêu đề"
      });
    }

    const chapter = await Chapter.create({
      title,
      name,
      status
    });

    res.json({
      message: "Create chapter success",
      data: chapter
    });

  } catch (error) {
    res.status(500).json({
      message: "Create chapter failed",
      error: error.message
    });

  }

};
const updateChapter = async (req, res) => {

  try {

    const chapterId = req.params.id;

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(500).json({
        message: "Chapter not found"
      });
    }

    const { title, name, status } = req.body;
    if (!title) {
      return res.status(500).json({
        message: "chưa nhập tiêu đề"
      });
    }

    chapter.title = title;
    chapter.name = name;
    chapter.status = status
    await chapter.save();

    res.json({
      message: "Update chapter success",
      data: chapter
    });

  } catch (error) {
    res.status(500).json({
      message: "Update chapter failed",
      error: error.message
    });

  }

};
const getChapters = async (req, res) => {

  try {

    const chapters = await Chapter.find()
    res.json({
      data: chapters
    });

  } catch (error) {

    res.status(500).json({
      message: "Get chapters failed"
    });

  }

};
const getChapter = async (req, res) => {

  try {

    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found"
      });
    }
    return res.status(200).json({
      message: "Lấy dữ liệu thành công",
      data: chapter
    });


  } catch (error) {
    res.status(500).json({
      message: "Get chapter failed"
    });

  }

};
const deleteChapter = async (req, res) => {

  try {

    const chapterId = req.params.id;

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found"
      });
    }

    await Chapter.findByIdAndDelete(chapterId);

    res.json({
      message: "Delete chapter success"
    });

  } catch (error) {

    res.status(500).json({
      message: "Delete chapter failed"
    });

  }

};


module.exports = {
  createChapter,
  updateChapter,
  getChapters,
  getChapter,
  deleteChapter,
};
