'use server';

/**
 * @fileOverview A Genkit flow for generating budget insights from past transactions.
 *
 * - getBudgetInsights - A function that returns budget insights based on past transactions.
 * - BudgetInsightsInput - The input type for the getBudgetInsights function.
 * - BudgetInsightsOutput - The return type for the getBudgetInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetInsightsInputSchema = z.object({
  project_id: z.string().describe('The ID of the project to analyze.'),
  transactions: z.array(
    z.object({
      id: z.string(),
      project_id: z.string(),
      type: z.enum(['expense', 'income', 'payout_advance', 'payout_settlement']),
      amount: z.number(),
      category: z.string(),
      proof_image_url: z.string().optional(),
      timestamp: z.string(),
    })
  ).describe('An array of transaction objects for the project.'),
  budget_limit: z.number().describe('The budget limit for the project.'),
});
export type BudgetInsightsInput = z.infer<typeof BudgetInsightsInputSchema>;

const BudgetInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the budget insights, including potential overruns.'),
});
export type BudgetInsightsOutput = z.infer<typeof BudgetInsightsOutputSchema>;

export async function getBudgetInsights(input: BudgetInsightsInput): Promise<BudgetInsightsOutput> {
  return budgetInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetInsightsPrompt',
  input: {schema: BudgetInsightsInputSchema},
  output: {schema: BudgetInsightsOutputSchema},
  prompt: `You are a financial analyst providing budget insights for project managers.

  Analyze the following transactions for project with ID: {{{project_id}}}. The project has a budget limit of {{{budget_limit}}}.
  Transactions:
  {{#each transactions}}
  - ID: {{id}}, Type: {{type}}, Amount: {{amount}}, Category: {{category}}, Timestamp: {{timestamp}}
  {{/each}}

  Provide a concise summary of the budget insights, including potential overruns and key spending areas. Focus on financial risks.
  `,
});

const budgetInsightsFlow = ai.defineFlow(
  {
    name: 'budgetInsightsFlow',
    inputSchema: BudgetInsightsInputSchema,
    outputSchema: BudgetInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
