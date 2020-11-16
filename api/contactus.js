const { functions, database } = require('./lib/swa');
const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = functions.http().allow({ users: ['anthonychu'] }).onRequest(async function (req, res) {
  const form = req.form;
  const msg = {
    to: 'antchu@microsoft.com',
    from: 'anthony@anthonychu.ca',
    subject: `Contact form from ${form.email}`,
    html: `<strong>Name: </strong>${form.name}<br />
           <strong>Email: </strong>${form.email}`
  };

  const fileupload = form.fileupload;
  if (fileupload && fileupload.data) {
    msg.attachments = [{
      content: fileupload.data.toString('base64'),
      filename: fileupload.filename,
      type: fileupload.mimetype,
      disposition: 'attachment'
    }];
  }

  await mail.send(msg);
  res.status = 302;
  res.headers = {
    location: '/thankyou.html'
  };
});