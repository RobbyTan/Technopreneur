//* ************ Image Upload Configuration *************\\
const multer = require('multer')
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname)
  }
})
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false)
  }
  cb(null, true)
}
const upload = multer({storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary')

cloudinary.config({
  cloud_name: 'df9hhv4wy',
  api_key: '484816384568152',
  api_secret: 'HbU8MglP4viPNDsXoaHtc3dtH8U'
})
//* ************ END Image Upload Config *************\\

// export upload and cloudinary
module.exports = {
  cloudinary: cloudinary,
  upload: upload
}