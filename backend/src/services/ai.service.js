const axios = require('axios');
const bcrypt = require('bcryptjs');

const constantsHolder = require('../constants');
const { UsersModel, AnswersModel } = require('../models');
const { AnswerRepliesRepository } = require('../repositories');

const DEFAULT_AI_USERNAME = 'ramineni_ai';
const DEFAULT_AI_PASSWORD = 'ai-assistant-not-for-login';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const STACK_OVERFLOW_STYLE_SYSTEM_PROMPT = [
  'You are a senior Stack Overflow style assistant for software questions.',
  'Never output hidden reasoning, chain-of-thought, or internal analysis.',
  'For non-coding questions, answer somewhat briefly and directly in plain text.',
  'For non-coding questions, do not use markdown, asterisks, bullet points, or numbering.',
  'For non-coding questions, keep the response concise: around 4 to 6 simple sentences.',
  'If the user asks a coding question, return a clean markdown answer in this structure:',
  'One short plain explanation sentence before code (max 2 sentences).',
  'Then sections per language or solution part using headings.',
  'Under each section, include a fenced code block with explicit language tag.',
  'For coding questions, provide a full working solution, not a partial snippet.',
  'Include required imports, helper functions, and complete function/class definitions.',
  'If a full app is too long, provide one complete runnable file with all required logic.',
  'Do not truncate code intentionally. Prioritize completeness.',
  'Do not include internal reasoning text such as "Reasoning:".',
  'No long introductions. No unnecessary explanation.',
].join('\n');

const stripHtml = (value = '') => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const buildPrompt = ({ title, body, tagName }) => {
  const cleanedBody = stripHtml(body).slice(0, 2500);

  return [
    'Give a concise and practical answer for this question.',
    '',
    `Question title: ${title}`,
    `Question body: ${cleanedBody}`,
    `Tags: ${tagName || 'N/A'}`,
  ].join('\n');
};

const buildReplyPrompt = ({ answerBody, replyBody }) => {
  const cleanedAnswer = stripHtml(answerBody).slice(0, 1800);
  const cleanedReply = stripHtml(replyBody).slice(0, 1200);

  return [
    'Respond briefly to this follow-up reply in a helpful and direct way.',
    '',
    `Original answer: ${cleanedAnswer}`,
    `User follow-up: ${cleanedReply}`,
  ].join('\n');
};

const createFallbackAnswer = ({ title, body }) => {
  const compactTitle = (title || '').trim();
  const compactBody = stripHtml(body).slice(0, 280);
  const normalized = `${compactTitle} ${compactBody}`.toLowerCase();

  if (normalized.includes('ram mandir') || normalized.includes('ayodhya')) {
    return 'Ram Mandir is in Ayodhya, Uttar Pradesh, India.';
  }

  if (
    normalized.includes('code')
    || normalized.includes('function')
    || normalized.includes('api')
    || normalized.includes('query')
  ) {
    return [
      'Language: javascript',
      'Code:',
      '```javascript',
      'function solve(input) {',
      '  return input;',
      '}',
      '```',
    ].join('\n');
  }

  return `Start with one direct fix for "${compactTitle || 'this question'}" and test again. If it still fails, verify the input and expected output step by step. Then share the exact error and a minimal code snippet for a more precise fix.`;
};

const resolveModelConfig = () => {
  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      endpoint: process.env.GROQ_API_URL || DEFAULT_GROQ_ENDPOINT,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      endpoint: process.env.OPENAI_API_URL || DEFAULT_OPENAI_ENDPOINT,
    };
  }

  return null;
};

const getAssistantUser = async () => {
  const username = process.env.AI_ASSISTANT_USERNAME || DEFAULT_AI_USERNAME;

  let assistant = await UsersModel.findOne({ where: { username } });
  if (assistant) {
    return assistant;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.AI_ASSISTANT_PASSWORD || DEFAULT_AI_PASSWORD,
    10,
  );

  try {
    assistant = await UsersModel.create({
      username,
      password: hashedPassword,
      gravatar: constantsHolder.GRAVATAR_URL(999999),
    });
  } catch (error) {
    assistant = await UsersModel.findOne({ where: { username } });
  }

  return assistant;
};

const generateAnswer = async ({ title, body, tagName }) => {
  const modelConfig = resolveModelConfig();
  if (!modelConfig) {
    return createFallbackAnswer({ title, body });
  }

  try {
    const payload = {
      model: modelConfig.model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: STACK_OVERFLOW_STYLE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildPrompt({ title, body, tagName }),
        },
      ],
    };

    if (modelConfig.provider === 'groq') {
      payload.max_completion_tokens = 2200;
      payload.top_p = 1;
      payload.reasoning_effort = 'medium';
      payload.stream = false;
    } else {
      payload.max_tokens = 1800;
    }

    const response = await axios.post(modelConfig.endpoint, payload, {
      headers: {
        Authorization: `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    return response?.data?.choices?.[0]?.message?.content?.trim()
      || createFallbackAnswer({ title, body });
  } catch (error) {
    console.log('AI answer generation failed:', error?.response?.data || error.message);
    return createFallbackAnswer({ title, body });
  }
};

exports.createAssistantAnswer = async ({ postId, title, body, tagName }) => {
  try {
    const content = await generateAnswer({ title, body, tagName });
    if (!content) {
      return null;
    }

    const assistant = await getAssistantUser();
    if (!assistant) {
      return null;
    }

    return await AnswersModel.create({
      body: content,
      user_id: assistant.id,
      post_id: postId,
    });
  } catch (error) {
    console.log('AI answer save failed:', error.message);
    return null;
  }
};

exports.createAssistantReplyForAnswer = async ({ answerId, replyBody, answerBody }) => {
  try {
    const content = await generateAnswer({
      title: 'Reply to follow-up question',
      body: buildReplyPrompt({ answerBody, replyBody }),
      tagName: 'follow-up',
    });

    if (!content) {
      return null;
    }

    const assistant = await getAssistantUser();
    if (!assistant) {
      return null;
    }

    return await AnswerRepliesRepository.createInternal({
      body: content,
      userId: assistant.id,
      answerId,
    });
  } catch (error) {
    console.log('AI reply save failed:', error.message);
    return null;
  }
};
