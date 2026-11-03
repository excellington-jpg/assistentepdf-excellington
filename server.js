const express = require('express');
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(cors());

app.get('/', (req, res) => {
    res.send('Servidor do Assistente PDF Excellington rodando via API HTTPS do Gmail!');
});

app.post('/send-email', async (req, res) => {
    const { to, cc, subject, text, filename, pdfBase64 } = req.body;

    if (!to || !pdfBase64) {
        return res.status(400).json({ success: false, error: 'O e-mail de destino e o arquivo PDF são obrigatórios.' });
    }

    try {
        // Configuração OAuth2 para usar a API do Gmail pela porta HTTPS (443), ignorando o bloqueio de SMTP do Render
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oAuth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Monta o e-mail com o anexo PDF
        const mailOptions = {
            from: `Assistente PDF Excellington <${process.env.GMAIL_USER}>`,
            to: to,
            cc: cc || undefined,
            subject: subject || 'Documento PDF - Excellington',
            text: text || 'Segue em anexo o seu documento PDF.',
            attachments: [
                {
                    filename: filename || 'documento.pdf',
                    content: Buffer.from(pdfBase64, 'base64'),
                    contentType: 'application/pdf'
                }
            ],
            textEncoding: 'base64'
        };

        const mail = new MailComposer(mailOptions);
        const message = await mail.compile().build();
        
        // Codifica a mensagem no formato exigido pela API do Gmail
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Dispara o e-mail via HTTPS
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        res.json({ success: true, message: 'E-mail enviado com sucesso via API HTTPS!' });

    } catch (error) {
        console.error('Erro ao enviar e-mail via API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});
