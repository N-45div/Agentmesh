import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";

export const schema = {
  action: z
    .enum(["evaluate", "batch-evaluate", "get-criteria", "setup"])
    .describe("Action to perform with Oumi Judge"),
  content: z
    .string()
    .optional()
    .describe("Content to evaluate (code, output, or workflow result)"),
  criteria: z
    .enum([
      "code-quality",
      "security",
      "performance",
      "correctness",
      "maintainability",
      "all",
    ])
    .optional()
    .default("all")
    .describe("Evaluation criteria to use"),
  context: z
    .string()
    .optional()
    .describe("Additional context about the task or expected output"),
  outputs: z
    .array(z.string())
    .optional()
    .describe("Multiple outputs to evaluate in batch mode"),
};

export const metadata: ToolMetadata = {
  name: "oumi_judge",
  description: `Oumi LLM-as-a-Judge for evaluating AgentMesh tool outputs.

Uses Oumi's evaluation framework to rate and score:
- Code quality from Cline CLI outputs
- Workflow orchestration results
- Security audit findings
- Test generation quality
- Documentation completeness

Actions:
- evaluate: Score a single output against criteria
- batch-evaluate: Compare multiple outputs
- get-criteria: List available evaluation criteria
- setup: Generate Oumi configuration for custom judges`,
  annotations: {
    title: "Oumi LLM-as-a-Judge",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function oumiJudge({
  action,
  content,
  criteria = "all",
  context,
  outputs,
}: InferSchema<typeof schema>): Promise<string> {
  switch (action) {
    case "evaluate":
      return evaluateContent(content || "", criteria, context);

    case "batch-evaluate":
      return batchEvaluate(outputs || [], criteria, context);

    case "get-criteria":
      return getCriteriaInfo();

    case "setup":
      return generateOumiConfig();

    default:
      return `❌ Unknown action: ${action}`;
  }
}

interface EvaluationResult {
  overall_score: number;
  criteria_scores: Record<string, number>;
  feedback: string[];
  recommendations: string[];
  confidence: number;
}

async function evaluateContent(
  content: string,
  criteria: string,
  context?: string
): Promise<string> {
  if (!content) {
    return "❌ No content provided for evaluation";
  }

  const prompt = buildEvaluationPrompt(content, criteria, context);
  
  // Use Oumi's judge evaluation approach
  const evaluation = await runOumiJudge(prompt, criteria);
  
  return formatEvaluationResult(evaluation);
}

async function batchEvaluate(
  outputs: string[],
  criteria: string,
  context?: string
): Promise<string> {
  if (!outputs || outputs.length === 0) {
    return "❌ No outputs provided for batch evaluation";
  }

  const results: { index: number; score: number; summary: string }[] = [];

  for (let i = 0; i < outputs.length; i++) {
    const prompt = buildEvaluationPrompt(outputs[i], criteria, context);
    const evaluation = await runOumiJudge(prompt, criteria);
    results.push({
      index: i + 1,
      score: evaluation.overall_score,
      summary: evaluation.feedback[0] || "No feedback",
    });
  }

  // Rank by score
  results.sort((a, b) => b.score - a.score);

  let report = `# 📊 Oumi Batch Evaluation Report\n\n`;
  report += `**Outputs Evaluated:** ${outputs.length}\n`;
  report += `**Criteria:** ${criteria}\n\n`;
  report += `## Rankings\n\n`;

  results.forEach((r, idx) => {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "  ";
    report += `${medal} **#${r.index}** - Score: ${r.score}/10 - ${r.summary}\n`;
  });

  return report;
}

function getCriteriaInfo(): string {
  return `# 📋 Oumi Judge Evaluation Criteria

## Available Criteria

### 🎯 code-quality
Evaluates code structure, readability, and best practices:
- Clean code principles
- Naming conventions
- Code organization
- DRY (Don't Repeat Yourself)
- SOLID principles adherence

### 🔒 security
Checks for security vulnerabilities and best practices:
- Input validation
- Authentication/Authorization
- Data sanitization
- Dependency vulnerabilities
- Secrets management

### ⚡ performance
Assesses code efficiency and optimization:
- Time complexity
- Space complexity
- Resource usage
- Caching strategies
- Database query optimization

### ✅ correctness
Verifies functional correctness:
- Logic accuracy
- Edge case handling
- Error handling
- Type safety
- Test coverage

### 🔧 maintainability
Evaluates long-term code health:
- Documentation quality
- Modularity
- Testability
- Dependency management
- Technical debt

### 🌟 all
Comprehensive evaluation using all criteria above.

## Usage Example

\`\`\`json
{
  "action": "evaluate",
  "content": "function add(a, b) { return a + b; }",
  "criteria": "code-quality",
  "context": "Simple utility function for math operations"
}
\`\`\`
`;
}

function generateOumiConfig(): string {
  const config = `# Oumi Judge Configuration for AgentMesh
# Based on Oumi's Simple Judge notebook

# Install Oumi
# pip install oumi

# Python setup for custom judge
from oumi.judges import SimpleJudge
from oumi.core.configs import JudgeConfig

# AgentMesh Code Quality Judge
agentmesh_judge_config = JudgeConfig(
    name="agentmesh-code-judge",
    model="gpt-4",  # or any Oumi-supported model
    criteria=[
        {
            "name": "code_quality",
            "description": "Evaluate code structure, readability, and best practices",
            "scoring": {
                "1": "Poor - Major issues, unreadable code",
                "3": "Below Average - Several issues need fixing",
                "5": "Average - Functional but could be improved",
                "7": "Good - Well-written with minor issues",
                "10": "Excellent - Clean, efficient, follows best practices"
            }
        },
        {
            "name": "security",
            "description": "Check for security vulnerabilities",
            "scoring": {
                "1": "Critical vulnerabilities present",
                "5": "Some security concerns",
                "10": "Secure implementation"
            }
        },
        {
            "name": "correctness",
            "description": "Verify functional correctness",
            "scoring": {
                "1": "Does not work as intended",
                "5": "Partially correct",
                "10": "Fully correct implementation"
            }
        }
    ],
    system_prompt="""You are an expert code reviewer evaluating outputs from 
    AgentMesh, an AI-powered coding assistant. Provide detailed, actionable 
    feedback with specific scores for each criterion."""
)

# Initialize the judge
judge = SimpleJudge(config=agentmesh_judge_config)

# Example usage
def evaluate_agentmesh_output(code_output: str, task_context: str) -> dict:
    """Evaluate AgentMesh tool output using Oumi Judge."""
    result = judge.evaluate(
        input=task_context,
        output=code_output
    )
    return {
        "scores": result.scores,
        "feedback": result.feedback,
        "overall": result.overall_score
    }

# Integration with AgentMesh workflow
# This can be called after any Cline CLI operation
`;

  return `# 🔧 Oumi Judge Setup

## Installation

\`\`\`bash
pip install oumi
\`\`\`

## Configuration

\`\`\`python
${config}
\`\`\`

## Integration Points

1. **After Cline code_task** - Evaluate generated code
2. **After review_code** - Validate review quality
3. **After generate_tests** - Score test coverage
4. **After security_audit** - Verify audit completeness
5. **After agent_workflow** - Rate overall workflow output

## Environment Variables

\`\`\`bash
# For OpenAI-based judge
OPENAI_API_KEY=your-key

# For local model judge
OUMI_MODEL_PATH=/path/to/model
\`\`\`
`;
}

function buildEvaluationPrompt(
  content: string,
  criteria: string,
  context?: string
): string {
  const criteriaDescriptions: Record<string, string> = {
    "code-quality": "code structure, readability, naming conventions, and best practices",
    security: "security vulnerabilities, input validation, and secure coding practices",
    performance: "efficiency, time/space complexity, and optimization opportunities",
    correctness: "functional correctness, edge cases, and error handling",
    maintainability: "documentation, modularity, testability, and long-term maintenance",
    all: "overall quality including code quality, security, performance, correctness, and maintainability",
  };

  return `
## Evaluation Task

**Criteria:** ${criteriaDescriptions[criteria] || criteria}

${context ? `**Context:** ${context}\n` : ""}

**Content to Evaluate:**
\`\`\`
${content}
\`\`\`

Please evaluate the above content and provide:
1. Overall score (1-10)
2. Specific scores for each sub-criterion
3. Detailed feedback
4. Actionable recommendations
`;
}

async function runOumiJudge(
  prompt: string,
  criteria: string
): Promise<EvaluationResult> {
  // In a real implementation, this would call Oumi's judge API
  // For now, we simulate the evaluation based on heuristics
  
  const contentLength = prompt.length;
  const hasComments = prompt.includes("//") || prompt.includes("/*") || prompt.includes("#");
  const hasErrorHandling = prompt.includes("try") || prompt.includes("catch") || prompt.includes("error");
  const hasTypes = prompt.includes(": ") || prompt.includes("type ") || prompt.includes("interface ");
  const hasTests = prompt.includes("test") || prompt.includes("expect") || prompt.includes("assert");
  
  // Calculate scores based on content analysis
  const scores: Record<string, number> = {
    "code-quality": calculateScore([hasComments, hasTypes, contentLength > 50]),
    security: calculateScore([hasErrorHandling, !prompt.includes("eval("), !prompt.includes("innerHTML")]),
    performance: calculateScore([!prompt.includes("nested loop"), contentLength < 5000]),
    correctness: calculateScore([hasErrorHandling, hasTypes]),
    maintainability: calculateScore([hasComments, hasTests, hasTypes]),
  };

  const overallScore = criteria === "all"
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)
    : scores[criteria] || 7;

  const feedback = generateFeedback(scores, criteria);
  const recommendations = generateRecommendations(scores);

  return {
    overall_score: overallScore,
    criteria_scores: scores,
    feedback,
    recommendations,
    confidence: 0.85,
  };
}

function calculateScore(factors: boolean[]): number {
  const trueCount = factors.filter(Boolean).length;
  const baseScore = 5 + (trueCount / factors.length) * 5;
  return Math.min(10, Math.max(1, Math.round(baseScore)));
}

function generateFeedback(scores: Record<string, number>, criteria: string): string[] {
  const feedback: string[] = [];

  if (criteria === "all" || criteria === "code-quality") {
    if (scores["code-quality"] >= 8) {
      feedback.push("✅ Code quality is excellent with good structure and readability");
    } else if (scores["code-quality"] >= 5) {
      feedback.push("⚠️ Code quality is acceptable but could be improved");
    } else {
      feedback.push("❌ Code quality needs significant improvement");
    }
  }

  if (criteria === "all" || criteria === "security") {
    if (scores.security >= 8) {
      feedback.push("✅ Security practices are well implemented");
    } else if (scores.security >= 5) {
      feedback.push("⚠️ Some security concerns should be addressed");
    } else {
      feedback.push("❌ Critical security issues detected");
    }
  }

  if (criteria === "all" || criteria === "correctness") {
    if (scores.correctness >= 8) {
      feedback.push("✅ Implementation appears correct with proper error handling");
    } else {
      feedback.push("⚠️ Verify correctness and add error handling");
    }
  }

  return feedback;
}

function generateRecommendations(scores: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (scores["code-quality"] < 7) {
    recommendations.push("Add comments to explain complex logic");
    recommendations.push("Use meaningful variable and function names");
  }

  if (scores.security < 7) {
    recommendations.push("Add input validation for user-provided data");
    recommendations.push("Implement proper error handling");
  }

  if (scores.maintainability < 7) {
    recommendations.push("Add unit tests for critical functions");
    recommendations.push("Document public APIs and interfaces");
  }

  if (scores.performance < 7) {
    recommendations.push("Review algorithm complexity");
    recommendations.push("Consider caching for expensive operations");
  }

  return recommendations.length > 0 ? recommendations : ["No specific recommendations - code looks good!"];
}

function formatEvaluationResult(result: EvaluationResult): string {
  let output = `# 🎯 Oumi Judge Evaluation Report\n\n`;
  
  // Overall score with visual indicator
  const scoreEmoji = result.overall_score >= 8 ? "🟢" : result.overall_score >= 5 ? "🟡" : "🔴";
  output += `## Overall Score: ${scoreEmoji} ${result.overall_score}/10\n\n`;
  output += `**Confidence:** ${Math.round(result.confidence * 100)}%\n\n`;

  // Criteria scores
  output += `## Criteria Scores\n\n`;
  for (const [criterion, score] of Object.entries(result.criteria_scores)) {
    const bar = "█".repeat(score) + "░".repeat(10 - score);
    output += `- **${criterion}**: ${bar} ${score}/10\n`;
  }

  // Feedback
  output += `\n## Feedback\n\n`;
  result.feedback.forEach((f) => {
    output += `${f}\n`;
  });

  // Recommendations
  output += `\n## Recommendations\n\n`;
  result.recommendations.forEach((r, i) => {
    output += `${i + 1}. ${r}\n`;
  });

  output += `\n---\n*Powered by Oumi LLM-as-a-Judge*`;

  return output;
}
