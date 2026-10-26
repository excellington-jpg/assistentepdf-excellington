const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Aumenta o limite do body para permitir anexos PDF em base64
app.use(express.json({ limit: '25mb' }));
app.use(cors());

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor do Assistente PDF Excellington rodando com sucesso!');
});

// Rota principal de envio
app.post('/send-email', async (req, res) => {
    const { to, cc, subject, text, filename, pdfBase64 } = req.body;

    if (!to || !pdfBase64) {
        return res.status(400).json({ success: false, error: 'O e-mail de destino e o arquivo PDF são obrigatórios.' });
    }

    try {
        // Transporte SMTP configurado via variáveis de ambiente seguras do Render
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

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
            ]
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'E-mail enviado com sucesso!' });

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});
