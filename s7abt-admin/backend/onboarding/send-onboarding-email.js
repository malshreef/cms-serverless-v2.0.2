const { CognitoIdentityProviderClient, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const REGION = process.env.AWS_REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;
const FROM_EMAIL = process.env.FROM_EMAIL;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || FROM_EMAIL;

const cognito = new CognitoIdentityProviderClient({ region: REGION });
const ses = new SESv2Client({ region: REGION });

const htmlTemplate = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Tahoma,Arial,sans-serif;background-color:#f5f5f5;margin:0;padding:20px;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;">☁️ سحابة الكلاود</h1>
<p style="color:#bbdefb;margin:8px 0 0;font-size:14px;">S7ABT Cloud Platform</p>
</div>
<div style="padding:30px;">
<p style="font-size:16px;color:#333;line-height:1.8;">بسم الله الرحمن الرحيم</p>
<p style="font-size:16px;color:#333;line-height:1.8;">مرحباً،</p>
<p style="font-size:16px;color:#333;line-height:1.8;">يسعدنا إبلاغكم بأنه تم <strong>ترقية منصة سحابة الكلاود</strong> بنجاح إلى الإصدار الجديد، والذي يتضمن تحسينات كبيرة في الأداء وتجربة الاستخدام.</p>
<div style="background:#e3f2fd;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<h3 style="color:#1a73e8;margin:0 0 12px;">🔗 روابط الوصول</h3>
<p style="margin:8px 0;"><strong>لوحة التحكم:</strong> <a href="https://admin.s7abt.com" style="color:#1a73e8;text-decoration:none;font-weight:bold;">admin.s7abt.com</a></p>
<p style="margin:8px 0;"><strong>الموقع العام:</strong> <a href="https://s7abt.com" style="color:#1a73e8;text-decoration:none;font-weight:bold;">s7abt.com</a></p>
</div>
<h3 style="color:#1a73e8;border-bottom:2px solid #e3f2fd;padding-bottom:8px;">📋 تعليمات تسجيل الدخول</h3>
<ol style="font-size:15px;color:#333;line-height:2.2;padding-right:20px;">
<li>افتح رابط لوحة التحكم: <strong>admin.s7abt.com</strong></li>
<li>اضغط على <strong>"نسيت كلمة المرور"</strong> لتعيين كلمة مرور جديدة</li>
<li>أدخل بريدك الإلكتروني المسجل لدينا</li>
<li>ستصلك رسالة تحتوي على رمز التحقق - أدخله في الصفحة</li>
<li>اختر كلمة مرور جديدة وسجّل دخولك</li>
</ol>
<h3 style="color:#1a73e8;border-bottom:2px solid #e3f2fd;padding-bottom:8px;">✨ أبرز التحديثات</h3>
<ul style="font-size:15px;color:#333;line-height:2.2;padding-right:20px;">
<li><strong>واجهة محدّثة بالكامل</strong> - تصميم عصري وسهل الاستخدام</li>
<li><strong>إدارة المقالات والأخبار</strong> - إضافة وتعديل وحذف المحتوى بسهولة</li>
<li><strong>نظام الوسوم (Tags)</strong> - تصنيف المقالات والأخبار بوسوم لتسهيل البحث</li>
<li><strong>رفع الصور والوسائط</strong> - رفع مباشر للصور مع المقالات</li>
<li><strong>نظام مصادقة آمن</strong> - تسجيل دخول محمي عبر نظام المصادقة الجديد</li>
<li><strong>الموقع العام الجديد</strong> - موقع عصري ثنائي اللغة (عربي/إنجليزي)</li>
</ul>
<div style="background:#fff3e0;border-radius:8px;padding:15px;margin:20px 0;">
<p style="font-size:14px;color:#e65100;margin:0;">💬 في حال واجهتك أي مشكلة في تسجيل الدخول أو استخدام لوحة التحكم، لا تتردد في التواصل معنا عبر الرد على هذه الرسالة.</p>
</div>
</div>
<div style="background:#f5f5f5;padding:20px;text-align:center;border-top:1px solid #e0e0e0;">
<p style="color:#888;font-size:13px;margin:0;">مع أطيب التحيات،<br/><strong>فريق سحابة الكلاود التقني</strong></p>
<p style="color:#aaa;font-size:11px;margin:8px 0 0;">© 2026 S7ABT Cloud - جميع الحقوق محفوظة</p>
</div>
</div>
</body>
</html>`;

const textTemplate = `بسم الله الرحمن الرحيم

مرحباً،

يسعدنا إبلاغكم بأنه تم ترقية منصة سحابة الكلاود بنجاح إلى الإصدار الجديد.

رابط لوحة التحكم: https://admin.s7abt.com
رابط الموقع العام: https://s7abt.com

تعليمات تسجيل الدخول:
1. افتح رابط لوحة التحكم: admin.s7abt.com
2. اضغط على نسيت كلمة المرور لتعيين كلمة مرور جديدة
3. أدخل بريدك الإلكتروني المسجل لدينا
4. ستصلك رسالة تحتوي على رمز التحقق
5. اختر كلمة مرور جديدة وسجّل دخولك

مع أطيب التحيات،
فريق سحابة الكلاود التقني`;

exports.handler = async (event) => {
  console.log("Starting onboarding email send...");
  const results = { success: [], failed: [] };

  // 1. List all Cognito users
  const listCmd = new ListUsersCommand({ UserPoolId: USER_POOL_ID });
  const { Users } = await cognito.send(listCmd);
  console.log(`Found ${Users.length} users in Cognito`);

  // 2. Send email to each user
  for (const user of Users) {
    const emailAttr = user.Attributes.find((a) => a.Name === "email");
    if (!emailAttr || !user.Enabled) {
      console.log(`Skipping user ${user.Username}: no email or disabled`);
      results.failed.push({ username: user.Username, reason: "no email or disabled" });
      continue;
    }

    const email = emailAttr.Value;
    try {
      const sendCmd = new SendEmailCommand({
        FromEmailAddress: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Content: {
          Simple: {
            Subject: {
              Data: "تم ترقية منصة سحابة الكلاود - تعليمات الدخول للوحة التحكم الجديدة",
              Charset: "UTF-8",
            },
            Body: {
              Html: { Data: htmlTemplate, Charset: "UTF-8" },
              Text: { Data: textTemplate, Charset: "UTF-8" },
            },
          },
        },
      });

      const result = await ses.send(sendCmd);
      console.log(`Sent to ${email}: MessageId=${result.MessageId}`);
      results.success.push({ email, messageId: result.MessageId });
    } catch (err) {
      console.error(`Failed to send to ${email}: ${err.message}`);
      results.failed.push({ email, reason: err.message });
    }
  }

  console.log(`Done. Success: ${results.success.length}, Failed: ${results.failed.length}`);
  return results;
};
