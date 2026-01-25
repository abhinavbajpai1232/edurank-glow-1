/**
 * Bytez API Integration
 * Handles all AI requests for notes generation, video search, and quiz generation
 * Using the official bytez.js package
 */

// Note: In production, keep API keys in environment variables
const BYTEZ_API_KEY = import.meta.env.VITE_BYTEZ_API_KEY || "2622dd06541127bea7641c3ad0ed8859";

// Import Bytez SDK
let Bytez: any;

// Dynamically import bytez.js to handle optional installation
try {
  const bytezModule = await import('bytez.js');
  Bytez = bytezModule.default || bytezModule;
} catch (error) {
  console.warn('bytez.js not installed, using fallback implementation');
}

/**
 * Initialize Bytez SDK with API key
 */
let sdk: any;

if (Bytez) {
  // Use actual bytez.js package
  sdk = new Bytez(BYTEZ_API_KEY);
} else {
  // Fallback implementation if bytez.js is not installed
  sdk = {
    model: (modelName: string) => ({
      run: async (messages: Array<{ role: string; content: string }>) => {
        try {
          const response = await fetch('https://api.bytez.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${BYTEZ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.message || 'API request failed' };
          }

          const data = await response.json();
          return {
            output: data.choices?.[0]?.message?.content || '',
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      },
    }),
  };
}

/**
 * Generate study notes using GPT-4.1-mini
 */
export async function generateNotesWithBytez(
  videoTitle: string,
  videoContent: string,
  filters: {
    class?: string;
    subject?: string;
    language?: string;
    board?: string;
  }
): Promise<{ notes?: string; error?: string }> {
  const model = sdk.model('openai/gpt-4.1-mini');

  const languageNote = filters.language ? `Language: ${filters.language}` : '';
  const classNote = filters.class ? `Class/Level: ${filters.class}` : '';
  const boardNote = filters.board ? `Board: ${filters.board}` : '';

  const prompt = `Generate comprehensive study notes for an educational video.

Video Title: "${videoTitle}"

${classNote}
${boardNote}
Subject: ${filters.subject || 'General'}
${languageNote}

Content: ${videoContent}

Requirements:
- Create well-structured notes with clear headings
- Include key concepts, definitions, and important points
- Add practical examples where applicable
- Keep language simple and student-friendly
- Format for easy PDF conversion
- Ensure content is syllabus-aligned for the selected class and board

Please provide detailed, comprehensive study notes that help students understand and remember the topic.`;

  const { error, output } = await model.run([
    {
      role: 'user',
      content: prompt,
    },
  ]);

  if (error) {
    return { error };
  }

  return { notes: output };
}

/**
 * Generate quiz questions specifically for notes using Gemini-3-pro-preview
 * This function creates quiz questions based on study notes
 */
export async function generateNotesQuizWithBytez(
  notes: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
    language?: string;
  },
  questionCount: number = 10,
  difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{ questions?: any[]; error?: string }> {
  try {
    const model = sdk.model('google/gemini-3-pro-preview');

    const classNote = filters.class ? `Class/Level: ${filters.class}` : '';
    const boardNote = filters.board ? `Board: ${filters.board}` : '';
    const languageNote = filters.language ? `Language: ${filters.language}` : '';

    const prompt = `Generate ${questionCount} comprehensive multiple-choice quiz questions based on the provided study notes.

${classNote}
${boardNote}
Subject: ${filters.subject || 'General'}
${languageNote}
Difficulty Level: ${difficultyLevel}

Study Notes to Create Questions From:
${notes}

Requirements:
- Create questions that test deep understanding, not just memorization
- Ensure questions progressively build on each other
- Provide exactly 4 options for each question (A, B, C, D)
- Clearly mark the correct answer
- Include detailed explanations for why each answer is correct or incorrect
- Make incorrect options realistic and educationally valuable
- Ensure questions cover all major concepts from the notes
- Match the ${difficultyLevel} difficulty level appropriately
- Questions should be suitable for the ${filters.class || 'General'} class level

Format your response as a valid JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "a": "Option A",
      "b": "Option B", 
      "c": "Option C",
      "d": "Option D"
    },
    "correctAnswer": "a",
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
  }
]

Return ONLY the JSON array, no markdown, no code blocks, no extra text.`;

    const { error, output } = await model.run([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    if (error) {
      return { error: `Failed to generate notes quiz: ${error}` };
    }

    try {
      // Parse the JSON response - clean up markdown if present
      let jsonString = output || '[]';
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0].trim();
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0].trim();
      }
      
      const questions = JSON.parse(jsonString);
      
      // Validate questions structure
      if (!Array.isArray(questions)) {
        return { error: 'Invalid quiz format returned from API' };
      }

      return { questions };
    } catch (parseError) {
      return { error: 'Failed to parse quiz questions from API response' };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error generating notes quiz' };
  }
}

/**
 * Generate quiz questions using Gemini-3-pro
 */
export async function generateQuizWithBytez(
  notes: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
  },
  questionCount: number = 10,
  difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{ questions?: any[]; error?: string }> {
  const model = sdk.model('google/gemini-3-pro-preview');

  const classNote = filters.class ? `Class/Level: ${filters.class}` : '';
  const boardNote = filters.board ? `Board: ${filters.board}` : '';

  const prompt = `Generate ${questionCount} multiple-choice quiz questions based on the provided notes.

${classNote}
${boardNote}
Subject: ${filters.subject || 'General'}
Difficulty Level: ${difficultyLevel}

Notes Content:
${notes}

Requirements:
- Create questions that test understanding, not just memory
- Provide 4 options for each question
- Ensure only one correct answer
- Include detailed explanations
- Make wrong options plausible but incorrect
- Avoid trick questions
- Ensure questions match the ${difficultyLevel} difficulty level

Format your response as a valid JSON array with this structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct..."
  }
]

Return ONLY the JSON array, no markdown or extra text.`;

  const { error, output } = await model.run([
    {
      role: 'user',
      content: prompt,
    },
  ]);

  if (error) {
    return { error };
  }

  try {
    // Parse the JSON response
    const questions = JSON.parse(output || '[]');
    return { questions };
  } catch (parseError) {
    return { error: 'Failed to parse quiz questions' };
  }
}

/**
 * Find the best educational videos on YouTube for a specific topic using Gemini-3-pro-preview
 * This function identifies high-quality, curriculum-aligned video resources
 * Excludes YouTube Shorts and prioritizes full-length educational content
 */
export async function findBestVideoOnYoutubeBytez(
  topic: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
    language?: string;
    videoType?: string;
    minDuration?: number; // in minutes
  } = {}
): Promise<{ videos?: any[]; error?: string }> {
  try {
    // Validate that user is not searching for YouTube shorts
    if (topic.toLowerCase().includes('shorts') || topic.includes('youtube.com/shorts')) {
      return {
        error: 'YouTube Shorts are not supported for learning. Please search for full-length educational videos instead.',
      };
    }

    const model = sdk.model('google/gemini-3-pro-preview');

    const classNote = filters.class ? `Class/Level: ${filters.class}` : '';
    const boardNote = filters.board ? `Board: ${filters.board}` : '';
    const videoTypeNote = filters.videoType ? `Preferred Video Type: ${filters.videoType}` : '';
    const minDurationNote = filters.minDuration ? `Minimum Duration: ${filters.minDuration} minutes` : 'Minimum Duration: 10 minutes';

    const prompt = `Find and recommend the BEST educational videos on YouTube for learning about: "${topic}"

${classNote}
${boardNote}
Subject: ${filters.subject || 'General'}
Language: ${filters.language || 'English'}
${videoTypeNote}
${minDurationNote}

CRITICAL REQUIREMENTS:
1. EXCLUDE ALL YouTube Shorts - only recommend full-length videos (minimum ${filters.minDuration || 10} minutes)
2. Select ONLY videos from highly reputable, verified educational channels
3. Content MUST align with the ${filters.class || 'general'} class curriculum
4. Videos must have excellent pedagogical value
5. All videos must be appropriate for the age group/class specified
6. Ensure content is accurate, current, and well-explained

Find 5-7 of the ABSOLUTE BEST videos and provide:
- Exact video title
- Channel name (exact name)
- Video duration in minutes (must be >= ${filters.minDuration || 10})
- YouTube Video ID (the alphanumeric code from URL)
- Comprehensive description (3-4 sentences)
- Why this specific video is excellent for learning this topic
- Educational quality score (1-10)
- Engagement/presentation score (1-10)
- Key topics covered

IMPORTANT: Only suggest videos you are confident are from legitimate, well-known educational channels.

Format response as valid JSON array:
[
  {
    "title": "Exact video title",
    "channel": "Channel name",
    "duration": 15,
    "videoId": "dQw4w9WgXcQ",
    "description": "3-4 sentence description of content",
    "why": "Specific reasons this video is excellent for learning",
    "educationScore": 9,
    "engagementScore": 8,
    "topicsCovered": ["concept1", "concept2", "concept3"]
  }
]

Return ONLY the JSON array, no markdown, no code blocks, no additional text.`;

    const { error, output } = await model.run([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    if (error) {
      return { error: `Failed to find videos: ${error}` };
    }

    try {
      // Parse the JSON response - handle markdown code blocks
      let jsonString = output || '[]';
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0].trim();
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0].trim();
      }
      
      const videos = JSON.parse(jsonString);

      if (!Array.isArray(videos)) {
        return { error: 'Invalid video format returned from API' };
      }

      // Additional client-side validation to ensure no shorts
      const validVideos = videos.filter((video: any) => {
        const minDurationMinutes = filters.minDuration || 10;
        return video.duration && video.duration >= minDurationMinutes && video.videoId;
      });

      if (validVideos.length === 0) {
        return {
          error: 'No suitable educational videos found matching your criteria. Please try a different search or check your filters.',
        };
      }

      return { videos: validVideos };
    } catch (parseError) {
      return { error: 'Failed to parse video search results from API response' };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error finding videos' };
  }
}

/**
 * Find educational videos using Gemini-3-pro
 * Validates that videos are NOT shorts (duration >= 10 minutes)
 */
export async function findVideoWithBytez(
  topic: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
    language?: string;
    videoType?: string;
    videoDuration?: string;
  }
): Promise<{ videos?: any[]; error?: string }> {
  // Validate that user is not searching for YouTube shorts
  if (topic.toLowerCase().includes('shorts') || topic.includes('youtube.com/shorts')) {
    return {
      error: 'YouTube Shorts are not supported for learning. Please search for full-length educational videos instead.',
    };
  }

  const model = sdk.model('google/gemini-3-pro-preview');

  const classNote = filters.class ? `Class/Level: ${filters.class}` : '';
  const boardNote = filters.board ? `Board: ${filters.board}` : '';
  const videoTypeNote = filters.videoType ? `Preferred Video Type: ${filters.videoType}` : '';
  const durationNote = filters.videoDuration ? `Preferred Duration: ${filters.videoDuration}` : '';

  const prompt = `Find the best educational videos for learning about: "${topic}"

${classNote}
${boardNote}
Subject: ${filters.subject || 'General'}
Language: ${filters.language || 'English'}
${videoTypeNote}
${durationNote}

Important Constraints:
- EXCLUDE YouTube Shorts (they must be at least 10 minutes long)
- Select videos from reputable educational channels
- Ensure content aligns with the selected class and board curriculum
- Prioritize videos with high educational value
- Verify videos are appropriate for the selected age group/class

Recommend 5-7 top videos with:
- Title
- Channel name
- Duration (in minutes, must be >= 10)
- Link/YouTube ID
- Brief description (2-3 sentences)
- Why it's good for this topic
- Engagement score (1-10)

Format as JSON array with structure:
[
  {
    "title": "Video title",
    "channel": "Channel name",
    "duration": 15,
    "videoId": "dQw4w9WgXcQ",
    "description": "Brief description",
    "why": "Why this video is helpful",
    "engagementScore": 8
  }
]

Return ONLY the JSON array, no markdown or extra text.`;

  const { error, output } = await model.run([
    {
      role: 'user',
      content: prompt,
    },
  ]);

  if (error) {
    return { error };
  }

  try {
    const videos = JSON.parse(output || '[]');
    
    // Additional client-side validation to ensure no shorts
    const validVideos = videos.filter((video: any) => {
      return video.duration && video.duration >= 10;
    });

    if (validVideos.length === 0) {
      return {
        error: 'No suitable educational videos found matching your criteria. Please try a different search.',
      };
    }

    return { videos: validVideos };
  } catch (parseError) {
    return { error: 'Failed to parse video search results' };
  }
}

/**
 * Validate that a video is not a YouTube short
 */
export function validateVideoNotShort(url: string): { valid: boolean; message?: string } {
  if (url.includes('youtube.com/shorts') || url.includes('youtu.be/shorts')) {
    return {
      valid: false,
      message: 'YouTube Shorts are not supported. Please use full-length educational videos (minimum 10 minutes).',
    };
  }

  return { valid: true };
}
