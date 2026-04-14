/**
 * Builds Claude API requests for opportunity evaluation.
 *
 * The rubric system prompt is large and static — it uses cache_control: ephemeral
 * so the first batch in each daily run pays full price, and all subsequent
 * batches within the same run (~5 min window) hit the cache at ~10% cost.
 */

const RUBRIC_PROMPT = `You are an expert online business analyst evaluating money-making opportunities for a solo entrepreneur with limited free time (roughly 10 hours/week). Your task is to score each opportunity objectively and pragmatically.

## Scoring Criteria

For each opportunity, produce the following fields:

1. **time_required** (number): Realistic hours per week needed to start generating income. Use decimals. Examples: 0.5, 2, 5, 10, 20.

2. **earning_potential** (number): Realistic monthly earnings in USD after 3 months of consistent effort. Be conservative but honest. Examples: 50, 300, 800, 2000, 5000.

3. **difficulty** (integer 1-5):
   - 1 = Anyone can do this today with no skills
   - 2 = Minor learning curve, doable in a week
   - 3 = Moderate skills needed, takes a few weeks to start
   - 4 = Significant expertise or capital required
   - 5 = Expert-level or requires a team

4. **ai_leverage** (integer 1-5): How much AI tools (ChatGPT, Claude, Midjourney, etc.) can reduce effort or amplify output:
   - 1 = AI provides no meaningful advantage
   - 2 = AI helps slightly (drafting, ideation)
   - 3 = AI cuts time in half
   - 4 = AI makes this 3-5x faster/better
   - 5 = This opportunity is fundamentally AI-powered

5. **fit_score** (number 0.0-1.0): Overall composite fit for a time-constrained solo entrepreneur who wants to leverage AI. Weight: earning_potential 35%, ai_leverage 30%, low difficulty 20%, low time required 15%. Calculate carefully.

6. **claude_summary** (string): One sentence explaining what the opportunity is and why it's worth the score.

7. **action_items** (array of 3 strings): Specific, immediately actionable first steps someone can take today. Each step should have an estimated time in parentheses. Example: "Research top 5 competitors on Google (20 min)".

## Output Format

Return ONLY a valid JSON array. No markdown, no prose before or after. Each element must have all 7 fields.

Example structure:
[
  {
    "id": 1,
    "time_required": 3,
    "earning_potential": 800,
    "difficulty": 2,
    "ai_leverage": 4,
    "fit_score": 0.78,
    "claude_summary": "...",
    "action_items": ["Step 1 (20 min)", "Step 2 (30 min)", "Step 3 (15 min)"]
  }
]

The "id" field must match the id provided in the input. Evaluate each opportunity independently.`;

/**
 * Build a Claude API request for evaluating a batch of opportunities.
 * @param {Array<{ id: number, title: string, raw_text: string, category: string }>} opportunities
 * @returns {object} request body for Anthropic SDK client.messages.create()
 */
export function buildEvaluationRequest(opportunities) {
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

  const userContent = opportunities.map(opp => (
    `--- Opportunity ID: ${opp.id} ---\nTitle: ${opp.title}\nCategory: ${opp.category || 'unknown'}\nDescription: ${opp.raw_text?.slice(0, 400) || 'No description'}`
  )).join('\n\n');

  return {
    model,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: RUBRIC_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Please evaluate the following ${opportunities.length} opportunities:\n\n${userContent}`,
      },
    ],
  };
}
