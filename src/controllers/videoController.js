const Video = require("../models/video");

const updateTitleVideo = async (req, res) => {

  try {
    const id = req.params.id;
    const { title } = req.body;
    if (!id) {
      return res.status(400).json({
        message: "Lỗi gửi dữ liệu"
      });
    }
    if(title === ''){
      return res.status(400).json({
        message: "tiêu đè không dược để trống" 
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        message: "video not found"
      });
    }
    video.displayName = title;
    await video.save();
    return res.json({
      message: "Update tiêu đề thành công",
      data: video
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Create video failed",
      error: error.message
    });

  }

};




module.exports = {
  updateTitleVideo,
};