import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Strip HTML tags to get plain text for AI context
const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Smart model routing: 70B for quality, 8B for fast tasks
const MODELS = {
  quality: "llama-3.3-70b-versatile",
  fast: "llama-3.1-8b-instant",
};

const ACTION_MODEL_MAP = {
  autocomplete: "quality",
  grammar: "fast",
  tone: "quality",
  expand: "quality",
  simplify: "quality",
};

const SYSTEM_PROMPTS = {
  autocomplete:
    "You are a creative blog writing assistant. Continue the user's text naturally and engagingly. Write 2-4 sentences that flow seamlessly from what they've written. Do not repeat their text. Only output the continuation.",
  grammar:
    "You are a grammar and spelling expert. Fix all grammar, spelling, and punctuation errors in the given text. Preserve the original meaning and tone. Only output the corrected text, nothing else.",
  tone_professional:
    "You are a writing tone expert. Rewrite the given text in a professional, business-appropriate tone while preserving the core meaning. Only output the rewritten text.",
  tone_casual:
    "You are a writing tone expert. Rewrite the given text in a friendly, conversational, and casual tone while preserving the core meaning. Only output the rewritten text.",
  tone_academic:
    "You are a writing tone expert. Rewrite the given text in a formal, academic tone suitable for research or educational content. Only output the rewritten text.",
  expand:
    "You are a content expansion expert. Take the given text (which may be bullet points or brief notes) and expand it into well-structured, detailed paragraphs. Maintain the original ideas and add supporting details. Only output the expanded text.",
  simplify:
    "You are a simplification expert. Rewrite the given text to make it easier to understand. Use simpler words, shorter sentences, and remove jargon. Maintain the core meaning. Only output the simplified text.",
  suggest_tags:
    "You are a blog content analyzer. Given the blog title and content, suggest 3-5 relevant tags as a JSON array of lowercase strings. Only output the JSON array, nothing else. Example: [\"javascript\", \"web development\", \"tutorial\"]",
};

const callGroq = async (model, systemPrompt, userContent, maxTokens = 500) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error("AI_RATE_LIMITED");
    }
    throw new Error(
      errorData.error?.message || `Groq API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || "";
};

export const writingAssist = async (req, res, next) => {
  try {
    const { text, action, tone } = req.body;

    if (!text || !action) {
      return sendError(res, 400, "Text and action are required");
    }

    const validActions = ["autocomplete", "grammar", "tone", "expand", "simplify"];
    if (!validActions.includes(action)) {
      return sendError(res, 400, `Invalid action. Must be one of: ${validActions.join(", ")}`);
    }

    if (text.length > 3000) {
      return sendError(res, 400, "Text must be under 3000 characters");
    }

    // Determine system prompt
    let systemPrompt;
    if (action === "tone") {
      const validTones = ["professional", "casual", "academic"];
      const selectedTone = validTones.includes(tone) ? tone : "professional";
      systemPrompt = SYSTEM_PROMPTS[`tone_${selectedTone}`];
    } else {
      systemPrompt = SYSTEM_PROMPTS[action];
    }

    // Pick model based on action
    const modelType = ACTION_MODEL_MAP[action];
    const model = MODELS[modelType];

    const maxTokens = action === "expand" ? 800 : action === "autocomplete" ? 300 : 500;

    const suggestion = await callGroq(model, systemPrompt, text, maxTokens);

    return sendSuccess(res, 200, "AI suggestion generated", {
      suggestion,
      action,
      model: modelType,
    });
  } catch (error) {
    if (error.message === "AI_RATE_LIMITED") {
      return sendError(res, 429, "AI is busy right now. Please try again in a moment.");
    }
    if (error.message === "GROQ_API_KEY is not configured") {
      return sendError(res, 503, "AI service is not configured");
    }
    next(error);
  }
};

export const suggestTags = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return sendError(res, 400, "Title or content is required");
    }

    const inputText = `Title: ${title || "Untitled"}\n\nContent: ${(content || "").substring(0, 1500)}`;

    const result = await callGroq(
      MODELS.fast,
      SYSTEM_PROMPTS.suggest_tags,
      inputText,
      100
    );

    let tags = [];
    try {
      tags = JSON.parse(result);
      if (!Array.isArray(tags)) tags = [];
      tags = tags.filter((t) => typeof t === "string").map((t) => t.toLowerCase().trim());
    } catch {
      // If JSON parse fails, try to extract tags from text
      tags = result
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    return sendSuccess(res, 200, "Tags suggested", { tags: tags.slice(0, 5) });
  } catch (error) {
    if (error.message === "AI_RATE_LIMITED") {
      return sendError(res, 429, "AI is busy right now. Please try again in a moment.");
    }
    if (error.message === "GROQ_API_KEY is not configured") {
      return sendError(res, 503, "AI service is not configured");
    }
    next(error);
  }
};

export const generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return sendError(res, 400, "Prompt is required");
    }

    if (prompt.length > 500) {
      return sendError(res, 400, "Prompt must be under 500 characters");
    }

    const cleanPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    
    // Try Pollinations.ai with retry logic
    let imageUrl = null;
    let lastError = null;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const checkResponse = await fetch(pollUrl, { 
          method: "HEAD", 
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        clearTimeout(timeoutId);
        
        if (checkResponse.ok || checkResponse.status === 200) {
          imageUrl = pollUrl;
          break;
        }
        lastError = `Service returned ${checkResponse.status}`;
      } catch (err) {
        lastError = err.message;
        console.log(`[AI Image] Attempt ${attempt} failed:`, lastError);
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    if (!imageUrl) {
      return sendError(res, 503, "Image generation service is temporarily unavailable. Please try again in a moment.");
    }

    return sendSuccess(res, 200, "Image generated", { imageUrl, prompt: cleanPrompt });
  } catch (error) {
    next(error);
  }
};

export const blogChat = async (req, res, next) => {
  try {
    const { blogTitle, blogContent, userMessage, chatHistory = [] } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return sendError(res, 400, "Message is required");
    }

    if (userMessage.length > 500) {
      return sendError(res, 400, "Message must be under 500 characters");
    }

    if (!blogTitle && !blogContent) {
      return sendError(res, 400, "Blog context is required");
    }

    // Strip HTML and limit context to 3000 chars to stay within token limits
    const plainContent = stripHtml(blogContent || "").substring(0, 3000);

    const systemPrompt = `You are a helpful AI assistant embedded in a blog reading app. You help readers understand, analyze, and explore the content of blog articles.

You have been given the following blog article to discuss:

**Title:** ${blogTitle || "Untitled"}

**Content:**
${plainContent}

Guidelines:
- Answer questions specifically about this article's content
- For "summarize": Give a 3-4 sentence TL;DR
- For "key takeaways": Give 4-5 bullet points
- For "simplify": Rewrite the core idea in plain, simple language  
- For "quiz": Ask 3 short comprehension questions based on the article
- For "related topics": Suggest 4-5 topics the reader could explore next
- Be concise, friendly, and conversational
- If asked something unrelated to the article, gently redirect to the article content
- Use markdown formatting (bold, bullets) for better readability`;

    // Keep only last 10 messages to avoid token overflow
    const recentHistory = chatHistory.slice(-10);

    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: userMessage.trim() },
    ];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS.quality,
        messages,
        max_tokens: 600,
        temperature: 0.6,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error("AI_RATE_LIMITED");
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim() || "";

    return sendSuccess(res, 200, "Chat response generated", { reply });
  } catch (error) {
    if (error.message === "AI_RATE_LIMITED") {
      return sendError(res, 429, "AI is busy right now. Please try again in a moment.");
    }
    if (error.message === "GROQ_API_KEY is not configured") {
      return sendError(res, 503, "AI service is not configured");
    }
    next(error);
  }
};
