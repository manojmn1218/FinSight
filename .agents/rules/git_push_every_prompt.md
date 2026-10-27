# Git Push on Every Prompt Rule

## Mandatory Instruction
On **EVERY prompt** received from the user—without exception:
1. Complete the requested action, analysis, or answer.
2. If files were modified:
   - `git add .`
   - `git commit -m "<descriptive message>"`
3. If no files were modified (e.g. conversational prompt or status query):
   - `git commit --allow-empty -m "chore(sync): conversation checkpoint"`
4. Execute `git push origin main`.
5. Confirm to the user that the commit was pushed.
