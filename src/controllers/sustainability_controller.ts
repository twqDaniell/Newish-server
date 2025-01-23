import OpenAi from "openai";

const openai = new OpenAi({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getSustainabilityTips = async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a sustainability expert.",
        },
        {
          role: "user",
          content: "Give me 5 tips about sustainability.",
        },
      ],
    });

    const tips = response.choices[0].message.content.trim().split("\n").filter((tip) => tip.length > 0);

    return res.status(200).json({ tips });
  } catch (error) {
    console.error("Error fetching tips from OpenAI:", error.message);
    return res.status(500).json({ error: "Failed to fetch sustainability tips" });
  }
};
