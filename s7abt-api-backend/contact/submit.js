const db = require('../shared/db');
const { success, error } = require('../shared/response');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

/**
 * Handle contact form and newsletter submissions
 * Stores in database - no external services required
 */
exports.handler = async (event) => {
  console.log('Contact submit event:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, subject, message } = body;

    if (!email) {
      return error('Email is required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error('Invalid email format', 400);
    }

    // Create table if not exists
    await db.rawQuery(`
      CREATE TABLE IF NOT EXISTS s7b_contact (
        s7b_contact_id INT AUTO_INCREMENT PRIMARY KEY,
        s7b_contact_name VARCHAR(100),
        s7b_contact_email VARCHAR(255) NOT NULL,
        s7b_contact_subject VARCHAR(255),
        s7b_contact_message TEXT,
        s7b_contact_type ENUM('contact', 'newsletter') DEFAULT 'contact',
        s7b_contact_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Determine type based on content
    const type = (!subject && !message) || subject === 'Newsletter Subscription' ? 'newsletter' : 'contact';

    // Insert submission
    await db.query(
      `INSERT INTO s7b_contact (s7b_contact_name, s7b_contact_email, s7b_contact_subject, s7b_contact_message, s7b_contact_type)
       VALUES (?, ?, ?, ?, ?)`,
      [name || null, email, subject || null, message || null, type]
    );

    // Send email notification via SES (best-effort, don't block response)
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (notificationEmail && type === 'contact') {
      try {
        const ses = new SESClient({ region: process.env.AWS_REGION });
        await ses.send(new SendEmailCommand({
          Source: notificationEmail,
          Destination: { ToAddresses: [notificationEmail] },
          Message: {
            Subject: { Data: `New Contact: ${subject || 'No Subject'}` },
            Body: {
              Html: {
                Data: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#333;border-bottom:2px solid #0ea5e9;padding-bottom:10px">New Contact Form Submission</h2>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:8px;font-weight:bold;color:#555">Name:</td><td style="padding:8px">${name || 'N/A'}</td></tr>
                    <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Email:</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
                    <tr><td style="padding:8px;font-weight:bold;color:#555">Subject:</td><td style="padding:8px">${subject || 'N/A'}</td></tr>
                  </table>
                  <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px">
                    <strong style="color:#555">Message:</strong>
                    <p style="white-space:pre-wrap;color:#333">${message || 'No message'}</p>
                  </div>
                  <p style="margin-top:20px;font-size:12px;color:#999">Sent from S7abt Contact Form</p>
                </div>`
              }
            }
          }
        }));
        console.log('SES notification sent to:', notificationEmail);
      } catch (sesError) {
        console.error('SES notification failed (non-blocking):', sesError.message);
      }
    }

    return success({
      message: type === 'newsletter' ? 'Subscribed successfully' : 'Message sent successfully'
    }, 201);

  } catch (err) {
    console.error('Error submitting contact:', err);
    return error('Failed to submit', 500);
  }
};
