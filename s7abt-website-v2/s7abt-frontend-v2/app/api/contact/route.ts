import { NextResponse } from 'next/server';
import axios from 'axios';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Email recipients for contact form notifications (must be verified in SES)
// Configure these in .env.local - comma-separated for multiple recipients
const NOTIFICATION_EMAILS = (process.env.CONTACT_NOTIFICATION_EMAILS || '').split(',').filter(e => e.trim());
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'noreply@example.com';

// Initialize SES client
const sesClient = new SESClient({
    region: process.env.AWS_REGION || '<your-region>',
});

/**
 * Send email notification to admins
 */
async function sendEmailNotification(name: string, email: string, subject: string, message: string) {
    const emailSubject = `[S7ABT Contact] ${subject || 'New Contact Form Submission'}`;
    const emailBody = `
New contact form submission received:

Name: ${name}
Email: ${email}
Subject: ${subject || 'N/A'}

Message:
${message}

---
This email was sent automatically from s7abt.com contact form.
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
        .message-box { white-space: pre-wrap; }
        .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>رسالة جديدة من نموذج الاتصال</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">الاسم:</div>
                <div class="value">${name}</div>
            </div>
            <div class="field">
                <div class="label">البريد الإلكتروني:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
                <div class="label">الموضوع:</div>
                <div class="value">${subject || 'غير محدد'}</div>
            </div>
            <div class="field">
                <div class="label">الرسالة:</div>
                <div class="value message-box">${message}</div>
            </div>
            <div class="footer">
                تم إرسال هذا البريد تلقائياً من نموذج الاتصال في موقع s7abt.com
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();

    const command = new SendEmailCommand({
        Destination: {
            ToAddresses: NOTIFICATION_EMAILS,
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: htmlBody,
                },
                Text: {
                    Charset: 'UTF-8',
                    Data: emailBody,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: emailSubject,
            },
        },
        Source: FROM_EMAIL,
        ReplyToAddresses: [email],
    });

    await sesClient.send(command);
    console.log('Email notification sent to:', NOTIFICATION_EMAILS.join(', '));
}

export async function POST(request: Request) {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!email) {
        return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
        );
    }

    const API_KEY = process.env.MAILERLITE_API_KEY;

    if (!API_KEY) {
        console.error('MAILERLITE_API_KEY is not defined');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        console.log('Attempting to subscribe:', email);
        console.log('Using API Key length:', API_KEY.length);

        // 1. Save to MailerLite
        const response = await axios.post(
            'https://connect.mailerlite.com/api/subscribers',
            {
                email,
                fields: {
                    name: name,
                    subject: subject || '',
                    message: message || '',
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                },
            }
        );

        console.log('MailerLite Success:', response.data);

        // 2. Send email notification to admins
        try {
            await sendEmailNotification(name, email, subject, message);
        } catch (emailError: any) {
            // Log email error but don't fail the request
            console.error('Failed to send email notification:', emailError.message);
        }

        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('MailerLite API Error Details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        return NextResponse.json(
            { error: 'Failed to submit to MailerLite', details: error.response?.data || error.message },
            { status: 500 }
        );
    }
}
