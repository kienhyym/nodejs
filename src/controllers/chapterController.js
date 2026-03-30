const Chapter = require("../models/chapter");
const Lecture = require("../models/lecture");
const Exam = require("../models/exam");
const Question = require("../models/question");
const Option = require("../models/option");
const Video = require("../models/video");

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

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

    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found"
      });
    }

    // ======================
    // 1. LẤY LECTURE
    // ======================
    const lectures = await Lecture.find({ chapterId });

    for (const lecture of lectures) {

      // ======================
      // 2. XOÁ THUMBNAIL
      // ======================
      if (lecture.thumbnailName) {

        const key = lecture.thumbnailName.replace(
          `${process.env.R2_PUBLIC_URL}/`,
          ""
        );

        await r2.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key
        }));
      }

      // ======================
      // 3. XOÁ VIDEO
      // ======================
      const videos = await Video.find({ lectureId: lecture._id });

      await Promise.all(
        videos.map(async (video) => {

          if (video.fileName) {

            const key = video.fileName.replace(
              `${process.env.R2_PUBLIC_URL}/`,
              ""
            );

            await r2.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: key
            }));
          }

        })
      );

      await Video.deleteMany({ lectureId: lecture._id });

      // ======================
      // 4. XOÁ EXAM
      // ======================
      const exams = await Exam.find({ lectureId: lecture._id });

      for (const exam of exams) {

        // ======================
        // 5. XOÁ QUESTION
        // ======================
        const questions = await Question.find({ examId: exam._id });

        for (const question of questions) {

          // xoá ảnh question
          if (question.fileName) {

            const key = question.fileName.replace(
              `${process.env.R2_PUBLIC_URL}/`,
              ""
            );

            await r2.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: key
            }));
          }

          // ======================
          // 6. XOÁ OPTION
          // ======================
          const options = await Option.find({
            questionId: question._id
          });

          await Promise.all(
            options.map(async (opt) => {

              if (opt.fileName) {

                const key = opt.fileName.replace(
                  `${process.env.R2_PUBLIC_URL}/`,
                  ""
                );

                await r2.send(new DeleteObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: key
                }));
              }

            })
          );

          await Option.deleteMany({
            questionId: question._id
          });

        }

        await Question.deleteMany({
          examId: exam._id
        });

      }

      await Exam.deleteMany({ lectureId: lecture._id });

    }

    // ======================
    // 7. XOÁ LECTURE
    // ======================
    await Lecture.deleteMany({ chapterId });

    // ======================
    // 8. XOÁ CHAPTER
    // ======================
    await Chapter.findByIdAndDelete(chapterId);

    return res.json({
      message: "Delete chapter success"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Delete chapter failed",
      error: error.message
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
