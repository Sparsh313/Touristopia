const nodemailer = require('nodemailer');
const { options } = require('../app');

const sendEmail = async (options) => {
  // 1> Create Trasnporter
  const Trasnporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.Email_host,
    port: process.env.Email_port,
    auth: {
      user: process.env.Email_Username,
      pass: process.env.Email_Password,
    },
    //  Activate in your gmail "Less secure app" option
  });
  // 2> Define Email Options
  const mailOptions = {
    from: 'SPARSH SINGH <EMAIL>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3> send email
  await Trasnporter.sendMail(mailOptions);
};

module.exports = sendEmail;
