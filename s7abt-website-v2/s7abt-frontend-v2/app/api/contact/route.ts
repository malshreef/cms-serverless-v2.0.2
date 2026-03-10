import { NextResponse } from 'next/server';
import axios from 'axios';

// Lambda endpoint for DB storage
const CONTACT_LAMBDA_URL = process.env.CONTACT_LAMBDA_URL || '';

export async function POST(request: Request) {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!email) {
        return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
        );
    }

    const results = { db: false, mailerlite: false };

    // 1. Forward to Lambda for DB storage (primary)
    if (CONTACT_LAMBDA_URL) {
        try {
            await axios.post(CONTACT_LAMBDA_URL, { name, email, subject, message }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            results.db = true;
            console.log('DB storage success via Lambda');
        } catch (dbError: any) {
            console.error('DB storage failed:', dbError.message);
        }
    }

    // 2. Add to MailerLite subscriber list
    const API_KEY = process.env.MAILERLITE_API_KEY;
    if (API_KEY) {
        try {
            await axios.post(
                'https://connect.mailerlite.com/api/subscribers',
                {
                    email,
                    fields: {
                        name: name || '',
                        last_name: subject || '',
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                    timeout: 10000,
                }
            );
            results.mailerlite = true;
            console.log('MailerLite subscriber added:', email);
        } catch (mlError: any) {
            console.error('MailerLite error:', mlError.response?.data || mlError.message);
        }
    } else {
        console.warn('MAILERLITE_API_KEY not configured, skipping');
    }

    // Return success if at least one storage succeeded
    if (results.db || results.mailerlite) {
        return NextResponse.json({ success: true, results });
    }

    return NextResponse.json(
        { error: 'Failed to process submission' },
        { status: 500 }
    );
}
