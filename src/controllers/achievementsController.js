const Achievements = require("../models/achievements");
const Lecture = require("../models/lecture");


const createAchievements = async (req, res) => {

  try {
    const { lectureId } = req.params;
    const { userName, userClass, userResult } = req.body;

    if (!userName || !userClass) {
      return res.status(500).json({
        message: "chưa nhập thông tin nguòi dùng"
      });
    }

    const achievements = await Achievements.create({
      lectureId,
      name: userName,
      class: userClass,
      result: userResult,
    });

    return res.json({
      message: "Gửi kết quả thành công",
      data: achievements
    });

  } catch (error) {
    return res.status(500).json({
      message: "Gửi kết quả thất bại",
      error: error.message
    });
  }
};



const getAchievements = async (req, res) => {

  try {
    const achievements = await Achievements.find()
      .sort({ createdAt: -1 });
    const result = [];

    for (const achievement of achievements) {
      const lecture = await Lecture.findById({
        _id: achievement.lectureId
      });
      result.push({
        ...achievement.toObject(),
        lecture
      });
    }
    return res.json({
      message: "Get achievements success",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      message: "lỗi lấy dữ liệu",
      error: error.message
    });
  }
};


module.exports = {
  createAchievements,
  getAchievements,
};