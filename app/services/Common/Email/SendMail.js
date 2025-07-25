import nodemailer from 'nodemailer';

export async function Sendmail(sender,senderPass, recipient, subject, message) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: sender,
      pass: senderPass
    }
  });

  const mailOptions = {
    from: sender,
    to: recipient,
    subject: subject,
    html: message,
  };

  let info = await transporter.sendMail(mailOptions);
  return info;
}