import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

const transporter = nodemailer.createTransport({
  // Configure your email service
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

export const onNoteShared = functions.firestore
  .document('notes/{noteId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if sharedWith array changed
    if (!previousData.sharedWith || !newData.sharedWith) return;
    
    const newShares = newData.sharedWith.filter(share => 
      !previousData.sharedWith.some(oldShare => 
        oldShare.email === share.email
      )
    );

    // Send email to new shares
    for (const share of newShares) {
      const mailOptions = {
        from: '"Notes App" <noreply@yourapp.com>',
        to: share.email,
        subject: 'A note has been shared with you',
        html: `
          <h1>New Note Shared</h1>
          <p>A note titled "${newData.title}" has been shared with you.</p>
          <p>You have ${share.access} access.</p>
          <a href="https://yourapp.com/notes">View Note</a>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }
  }); 