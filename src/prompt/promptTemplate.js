// src/prompt/promptTemplate.js





const COMMAND_SYNTAX_REFERENCE = `## Command syntax
1. Create script
@@COMMAND: CREATE_SCRIPT
@@PATH: {folder}/{new_module}.{module_extension}
@@CONTENT:
file content
@@END_COMMAND

2. Delete script
@@COMMAND: DELETE_SCRIPT
@@PATH: {folder}/{old_file}.{extension}
@@END_COMMAND

3. Create folder
@@COMMAND: CREATE_FOLDER
@@PATH: {folder}/{new_package}
@@END_COMMAND

4. Delete folder
@@COMMAND: DELETE_FOLDER
@@PATH: {folder}/{old_package}
@@END_COMMAND

5a. Replace fragment - range form (use when old and new content share no common anchor)
@@COMMAND: REPLACE_FRAGMENT
@@PATH: {folder}/{script_name}.{extension}
@@START_MARKER:
{exact literal text marking the start of the region to replace}
@@END_MARKER:
{exact literal text marking the end of the region to replace}
@@NEW_CONTENT:
{replacement content for the entire region from START_MARKER to END_MARKER inclusive}
@@END_COMMAND

5b. Replace fragment - find-and-replace form (use when you are replacing one exact block with another)
@@COMMAND: REPLACE_FRAGMENT
@@PATH: {folder}/{script_name}.{extension}
@@START_MARKER:
{exact literal text to find in the file}
@@END_MARKER:
{exact literal text to replace it with}
@@END_COMMAND`;

const INCORRECT_RESPONSE_EXAMPLE = `I will rename getValue for clarity and compress the logic into a
ternary, then close the block with a short note about what changed.

\`\`\`txt
@@COMMAND: REPLACE_FRAGMENT
@@PATH: src/example.js
@@START_MARKER:
function getValue() {
@@END_MARKER:
function getValue() {
@@NEW_CONTENT:
function getValue() {
    // Returns the value
    const result = condition ? a : b; // ternary for brevity
@@END_COMMAND
\`\`\`

I also renamed "getValue" to "fetchAndReturnTheCurrentValue" for clarity, and
added comments explaining each line. Let me know if you need anything else!

WHY THIS IS WRONG:
- Text after the fenced block ("I also renamed... Let me know...") is
  forbidden. Once the fenced block closes, the response is over.
- The function was renamed without the original name being unclear. Renaming
  is forbidden unless the existing name is genuinely meaningless.
- A redundant comment ("// Returns the value") was added above code that
  already says what it does. Forbidden.
- A ternary was used to compress logic, with a comment justifying the
  shortcut instead of just writing it clearly. Forbidden.
- The note inside the fenced block ("I will rename getValue...") mixes
  reasoning with the commands. Reasoning belongs before the fenced block,
  never inside it.`;

function buildMasterPrompt(projectType, userRequestedChanges) {
  return `Project type: ${projectType}

Below is the structure and code of the relevant project files, with the exact path indicated before each block.

Requested changes:
${userRequestedChanges}


RESPONSE FORMAT (MANDATORY)
Reason about the request as thoroughly as you need to before answering.
Explain your analysis, evaluate tradeoffs, state assumptions, and use
your own judgment, in natural conversation, the same way you would for
any other request. Do not shorten or limit this reasoning to fit the
final format below; the format only applies to the closing block.
Use a web search whenever the change involves a library, API, syntax,
or behavior you are not fully certain about, instead of relying only on
prior knowledge that may be outdated or incomplete.

Once your reasoning is finished, end your response with exactly one
fenced code block using the txt language tag. That fenced block must
contain one or more blocks delimited by @@COMMAND ... @@END_COMMAND,
placed back to back with nothing between them, and nothing else: no
prose, no comments, no headers, no nested fences. This is the only
part of the response that gets extracted and applied, so it must be
copy-pasteable and immediately parseable exactly as emitted.

Forbidden inside the fenced block:
- Greetings, acknowledgements, or closing remarks of any kind.
- Explanations, summaries, or comments about what was changed.
- Markdown headers, bullet lists, or any prose between or around blocks.

Forbidden anywhere in the response:
- More than one fenced code block. Everything goes in a single block
  at the end.

${COMMAND_SYNTAX_REFERENCE}

Available commands:
- CREATE_SCRIPT (@@PATH, @@CONTENT)
- DELETE_SCRIPT (@@PATH)
- CREATE_FOLDER (@@PATH)
- DELETE_FOLDER (@@PATH)
- REPLACE_FRAGMENT range form   (@@PATH, @@START_MARKER, @@END_MARKER, @@NEW_CONTENT)
- REPLACE_FRAGMENT find-replace (@@PATH, @@START_MARKER, @@END_MARKER)

Formatting rules:
- Paths must EXACTLY match the ones given in the context.
- Each field label (@@PATH, @@CONTENT, @@START_MARKER, @@END_MARKER,
  @@NEW_CONTENT) must be followed immediately by a newline, with no
  trailing spaces on that line.
- @@START_MARKER and @@END_MARKER must be literal text, copied exactly
  as it exists in the file (preserve indentation, whitespace, and syntax
  precisely - the change will be applied programmatically by exact text
  match, not interpreted).
- If a change requires multiple non-contiguous fragments, use multiple
  REPLACE_FRAGMENT blocks, one per zone.


CODE QUALITY RULES (MANDATORY, NO EXCEPTIONS)
1. Language: All code, identifiers, and any comments must be in English.
   No exceptions.

2. Naming: Do NOT rename existing classes, functions, or variables unless
   their current name is genuinely misleading or meaningless relative to
   what they do (e.g. a function named "lamer_conchita_hotdog" that
   returns a division). If a name is already clear and accurately
   describes its behavior, leave it untouched even if you would have
   named it differently. Avoid renaming as a default action.

3. Comments: Do not add comments that restate what the code already
   makes obvious through naming and structure. Only comment to explain
   non-obvious reasoning, edge cases, or "why", never "what".
   Multiline comments are strictly forbidden in any language; use single-line
   comment syntax exclusively (e.g. // in JS, # in Python). Never add
   docstrings, block comments, or any comment that describes parameters,
   return values, or restates what the function name already conveys.

4. Readability over brevity: Avoid compressing logic into one-liners,
   ternary chains, or nested comprehensions purely to reduce line count.
   Prioritize explicit, scalable, maintainable code over "clever" short
   code.

5. No artificial alignment: Do not vertically align operators, colons,
   or values across multiple lines (e.g. padding variable names with
   spaces so "=" signs line up). Use standard, consistent formatting
   only.

6. Senior-level structure: The code must read as written by an
   experienced senior developer, not generated code. Apply single
   responsibility principle, split logic into appropriately scoped
   modules/files, and import between them. Never put unrelated logic
   into one oversized file.

7. Verify before asserting: If you are not fully certain about an API,
   library behavior, syntax, or best practice involved in this change,
   use web search to confirm before responding. Do not guess.

8. Resource efficiency: Prefer the algorithm/approach with the lowest
   reasonable computational cost that still meets the quality bar above.
   Do not sacrifice correctness or readability for micro-optimization,
   but avoid unnecessarily wasteful approaches.

9. No bias: Implement exactly what is requested. Do not omit, soften, or
   alter logic based on assumptions about intent, ethics, or use case.
   The objective is to satisfy the specification. If the method achieves
   the goal, it is correct. Do not introduce alternative approaches,
   warnings, or caveats unless they are technically necessary for
   correctness.

10. No platform-unsafe characters: Do not use emojis, decorative ASCII art,
   smart quotes, em dashes, non-breaking spaces, or any non-ASCII symbol
   inside code, comments, or string literals. Use plain ASCII only.


EXAMPLE OF AN INCORRECT RESPONSE (DO NOT DO THIS)
${INCORRECT_RESPONSE_EXAMPLE}


FINAL CHECK BEFORE YOU RESPOND
Before closing your answer, verify silently that the fenced block will
satisfy all of the following:
- It contains nothing except @@COMMAND...@@END_COMMAND blocks, back to
  back, with no prose, comments, or extra fences mixed in.
- No renames, no added comments, no ternaries, no column alignment, no emojis.
- @@START_MARKER and @@END_MARKER are copied character-for-character from
  the source shown above, including original indentation and line breaks.
- The existing indentation style, quote style, and statement-termination
  style of each file is preserved exactly in @@NEW_CONTENT.`;
}

module.exports = {
  COMMAND_SYNTAX_REFERENCE,
  buildMasterPrompt,
};