import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handles(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, score, answers } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Provide name and phone" });
    }

    const answersList = Object.entries(answers)
      .map(
        ([question, answer]) =>
          `<li><strong>${question}:</strong> ${answer}</li>`,
      )
      .join("");

    const { data, error } = await resend.emails.send({
      from: "Questionário <onboarding@resend.dev>",
      to: ["sandro.arpux@gmail.com"],
      subject: `Novo lead: ${name} (Score: ${score})`,
      html: `
                <h1>Novo questionário respondido!</h1>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Telefone:</strong> ${phone}</p>
                <p><strong>Score Final:</strong> ${score}</p>
                <br />
                <h3>Respostas coletadas:</h3>
                <ul>
                    ${answersList}
                </ul>
            `,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ message: "Email sent successfully!", data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
