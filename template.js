function wrapInTemplate(subject, message, name) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.8;
                color: #2c3e50;
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #ffeef8 0%, #fff0f5 100%);
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #e91e63; margin: 0; font-size: 24px;">💕</h2>
      </div>

      <div style="background: white;
                  padding: 25px;
                  border-radius: 10px;
                  border-left: 4px solid #e91e63;">
        <p style="font-size: 16px; margin-bottom: 15px;">
          ${message}
        </p>

        <p style="margin-top: 25px; margin-bottom: 5px;">
          <strong>${name}</strong>
        </p>

        <p style="margin: 0; font-size: 14px; color: #7f8c8d;">
          Sent with ❤️ on ${new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">❤️ You + Me = Forever ❤️</p>
      </div>
    </div>
  `;
}

module.exports = { wrapInTemplate };
