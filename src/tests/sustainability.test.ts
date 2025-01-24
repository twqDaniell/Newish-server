import OpenAi from "openai";

const mockCreate = jest.fn()
  .mockResolvedValueOnce({
    choices: [
      { message: { content: "1. Tip 1\n2. Tip 2\n3. Tip 3" } },
    ],
  })
  .mockRejectedValueOnce(new Error("API error"));

jest.mock("openai", () => {
  return {
    __esModule: true,
    default: class OpenAi {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

test("Handle OpenAi success response", async () => {
  const openai = new OpenAi({ apiKey: "test_key" });
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Test" }],
  });

  expect(response.choices[0].message.content).toEqual("1. Tip 1\n2. Tip 2\n3. Tip 3");
});

test("Handle OpenAi error response", async () => {
  const openai = new OpenAi({ apiKey: "test_key" });

  await expect(
    openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Test" }],
    })
  ).rejects.toThrow("API error");
});

