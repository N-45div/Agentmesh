#!/usr/bin/env python3
"""
AgentMesh Oumi Judge - LLM-as-a-Judge for code quality evaluation.

This script uses Oumi's SimpleJudge to evaluate code outputs from AgentMesh tools.
It can be called from the TypeScript MCP server via subprocess.

Usage:
    python judge.py --content "code to evaluate" --criteria "all"
    python judge.py --content "code" --context "task description" --criteria "security"

Environment Variables:
    OPENAI_API_KEY: Required for OpenAI models
    OPENAI_API_BASE: Optional, set to OpenRouter URL for OpenRouter models
    OPENROUTER_API_KEY: If using OpenRouter, set this as OPENAI_API_KEY
"""

import argparse
import json
import os
import sys

def evaluate_with_oumi(content: str, criteria: str = "all", context: str = "") -> dict:
    """Evaluate content using Oumi's SimpleJudge."""
    try:
        from oumi.judges.simple_judge import SimpleJudge
        
        # Get the config path
        config_path = os.path.join(os.path.dirname(__file__), "judge_config.yaml")
        
        # Initialize the judge
        judge = SimpleJudge(judge_config=config_path)
        
        # Prepare the dataset
        dataset = [
            {
                "context": context or "Evaluate this code output from an AI coding assistant",
                "content": content,
            }
        ]
        
        # Run evaluation
        outputs = judge.judge(dataset)
        
        # Parse results
        for output in outputs:
            return {
                "success": True,
                "overall_score": output.field_values.get("overall_score", 7),
                "criteria_scores": output.field_values.get("criteria_scores", {}),
                "feedback": output.field_values.get("feedback", []),
                "recommendations": output.field_values.get("recommendations", []),
                "explanation": output.field_values.get("explanation", ""),
            }
        
        return {"success": False, "error": "No output from judge"}
        
    except ImportError:
        # Oumi not installed, use fallback
        return evaluate_fallback(content, criteria, context)
    except Exception as e:
        return {"success": False, "error": str(e)}


def evaluate_fallback(content: str, criteria: str = "all", context: str = "") -> dict:
    """Fallback evaluation using OpenAI/OpenRouter directly when Oumi is not installed."""
    try:
        import openai
        
        # Check for API key
        api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            return evaluate_heuristic(content, criteria)
        
        # Configure client
        base_url = os.environ.get("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        
        # Build prompt
        prompt = f"""You are an expert code quality judge for AgentMesh, an AI-powered coding assistant.

Evaluate the code/output below based on these criteria:
1. **Code Quality** (1-10): Structure, readability, naming conventions, best practices
2. **Security** (1-10): Input validation, error handling, no vulnerabilities
3. **Performance** (1-10): Efficiency, complexity, optimization
4. **Correctness** (1-10): Logic accuracy, edge cases, error handling
5. **Maintainability** (1-10): Documentation, modularity, testability

Context: {context or "Evaluate this code output from an AI coding assistant"}

Code/Output to Evaluate:
```
{content}
```

Respond ONLY with valid JSON (no markdown):
{{"overall_score": <1-10>, "criteria_scores": {{"code_quality": <1-10>, "security": <1-10>, "performance": <1-10>, "correctness": <1-10>, "maintainability": <1-10>}}, "feedback": ["<feedback1>", "<feedback2>"], "recommendations": ["<rec1>", "<rec2>"]}}"""

        response = client.chat.completions.create(
            model=os.environ.get("OUMI_MODEL", "openai/gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1024,
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        
        result = json.loads(result_text)
        result["success"] = True
        return result
        
    except ImportError:
        return evaluate_heuristic(content, criteria)
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"Failed to parse JSON response: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def evaluate_heuristic(content: str, criteria: str = "all") -> dict:
    """Heuristic-based evaluation when no API is available."""
    # Simple heuristic scoring based on code patterns
    has_comments = "//" in content or "/*" in content or "#" in content
    has_error_handling = "try" in content or "catch" in content or "error" in content.lower()
    has_types = ": " in content or "type " in content or "interface " in content
    has_tests = "test" in content.lower() or "expect" in content or "assert" in content
    has_docs = '"""' in content or "'''" in content or "/**" in content
    
    def calc_score(factors):
        return min(10, max(1, 5 + sum(factors) * 2))
    
    scores = {
        "code_quality": calc_score([has_comments, has_types, len(content) > 50]),
        "security": calc_score([has_error_handling, "eval(" not in content, "innerHTML" not in content]),
        "performance": calc_score(["nested" not in content.lower(), len(content) < 5000]),
        "correctness": calc_score([has_error_handling, has_types]),
        "maintainability": calc_score([has_comments, has_tests, has_docs]),
    }
    
    overall = round(sum(scores.values()) / len(scores))
    
    feedback = []
    if scores["code_quality"] >= 7:
        feedback.append("✅ Code structure looks good")
    else:
        feedback.append("⚠️ Consider improving code structure and adding comments")
    
    if scores["security"] >= 7:
        feedback.append("✅ No obvious security issues detected")
    else:
        feedback.append("⚠️ Review security practices")
    
    recommendations = []
    if not has_comments:
        recommendations.append("Add comments to explain complex logic")
    if not has_error_handling:
        recommendations.append("Add error handling for edge cases")
    if not has_types:
        recommendations.append("Consider adding type annotations")
    
    return {
        "success": True,
        "overall_score": overall,
        "criteria_scores": scores,
        "feedback": feedback,
        "recommendations": recommendations if recommendations else ["Code looks good!"],
        "note": "Heuristic evaluation (no API key configured)"
    }


def main():
    parser = argparse.ArgumentParser(description="Oumi Judge for AgentMesh")
    parser.add_argument("--content", required=True, help="Content to evaluate")
    parser.add_argument("--criteria", default="all", help="Evaluation criteria")
    parser.add_argument("--context", default="", help="Additional context")
    
    args = parser.parse_args()
    
    result = evaluate_with_oumi(args.content, args.criteria, args.context)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
